# GitHub 构建发布脚本 (PowerShell版本)
# 用于触发GitHub Actions构建并发布新版本

param(
    [string]$Action = "release"
)

# 颜色函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $ColorMap = @{
        "Red" = "Red"
        "Green" = "Green"
        "Yellow" = "Yellow"
        "Blue" = "Blue"
        "White" = "White"
    }
    
    Write-Host $Message -ForegroundColor $ColorMap[$Color]
}

function Log-Info {
    param([string]$Message)
    Write-ColorOutput "[INFO] $Message" "Green"
}

function Log-Warn {
    param([string]$Message)
    Write-ColorOutput "[WARN] $Message" "Yellow"
}

function Log-Error {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" "Red"
}

function Log-Step {
    param([string]$Message)
    Write-ColorOutput "[STEP] $Message" "Blue"
}

# 显示脚本信息
function Show-Header {
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host "                    GitHub 构建发布脚本" -ForegroundColor Cyan
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host "时间: $(Get-Date)" -ForegroundColor White
    Write-Host "目标: 触发GitHub Actions构建并发布新版本" -ForegroundColor White
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host ""
}

# 检查Git状态
function Test-GitStatus {
    Log-Step "检查Git状态..."
    
    # 检查是否在Git仓库中
    try {
        git rev-parse --git-dir | Out-Null
    }
    catch {
        Log-Error "当前目录不是Git仓库"
        exit 1
    }
    
    # 检查当前分支
    $currentBranch = git branch --show-current
    Log-Info "当前分支: $currentBranch"
    
    # 检查是否有未提交的更改
    $changes = git status --porcelain
    if ($changes) {
        Log-Warn "检测到未提交的更改"
        git status --short
        Write-Host ""
        $continue = Read-Host "是否继续？(y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Log-Info "操作已取消"
            exit 0
        }
    }
    else {
        Log-Info "工作目录干净"
    }
    
    # 检查远程仓库
    $remoteUrl = git remote get-url origin
    Log-Info "远程仓库: $remoteUrl"
    
    return $currentBranch
}

# 检查GitHub Actions配置
function Test-GitHubActions {
    Log-Step "检查GitHub Actions配置..."
    
    # 检查工作流文件
    if (-not (Test-Path ".github/workflows")) {
        Log-Error ".github/workflows 目录不存在"
        exit 1
    }
    
    Log-Info "GitHub Actions工作流文件:"
    Get-ChildItem ".github/workflows" -Filter "*.yml" | ForEach-Object { Write-Host "  $($_.Name)" }
    
    # 检查主要工作流
    $mainWorkflow = ".github/workflows/docker-build-push.yml"
    if (Test-Path $mainWorkflow) {
        Log-Info "✅ 主构建工作流存在: $mainWorkflow"
        
        # 检查分支配置
        Log-Info "分支触发配置:"
        $content = Get-Content $mainWorkflow | Where-Object { $_ -match "branches:" }
        if ($content) {
            $content | ForEach-Object { Write-Host "  $_" }
        }
        else {
            Log-Warn "未找到分支配置"
        }
    }
    else {
        Log-Error "主构建工作流不存在: $mainWorkflow"
        exit 1
    }
}

# 检查修复内容
function Test-Fixes {
    Log-Step "检查修复内容..."
    
    # 检查nginx配置修复
    $nginxConfig = Get-Content "tools/nginx/nginx.conf" -Raw
    if ($nginxConfig -match "proxy_pass http://backend/api/") {
        Log-Info "✅ nginx代理配置已修复"
    }
    else {
        Log-Warn "⚠️  nginx代理配置可能需要修复"
    }
    
    # 检查前端API配置
    $startScript = Get-Content "scripts/dev/start.sh" -Raw
    if ($startScript -match "API_BASE_URL: '/api/v1'") {
        Log-Info "✅ 前端API配置已修复"
    }
    else {
        Log-Warn "⚠️  前端API配置可能需要修复"
    }
    
    # 检查环境变量配置
    if (Test-Path ".env.production.template") {
        $envConfig = Get-Content ".env.production.template" -Raw
        if ($envConfig -match "FRONTEND_API_BASE_URL=/api/v1") {
            Log-Info "✅ 环境变量配置已修复"
        }
        else {
            Log-Warn "⚠️  环境变量配置可能需要修复"
        }
    }
}

# 提交修复内容
function Submit-Fixes {
    Log-Step "提交修复内容..."
    
    # 检查是否有更改需要提交
    $changes = git status --porcelain
    if (-not $changes) {
        Log-Info "没有新的更改需要提交"
        return
    }
    
    # 显示更改内容
    Log-Info "待提交的更改:"
    git status --short
    Write-Host ""
    
    # 确认提交
    $commit = Read-Host "是否提交这些更改？(y/N)"
    if ($commit -ne "y" -and $commit -ne "Y") {
        Log-Info "跳过提交"
        return
    }
    
    # 添加所有更改
    git add .
    
    # 提交更改
    $commitMessage = @"
fix: 修复nginx代理配置和API路径问题

- 修复nginx代理配置，解决登录404问题
- 修复前端API基础URL配置
- 修复文件上传路径配置
- 更新健康检查路径
- 移除Docker资源预留配置警告
"@
    
    git commit -m $commitMessage
    Log-Info "✅ 更改已提交"
}

# 推送到GitHub
function Push-ToGitHub {
    param([string]$CurrentBranch)
    
    Log-Step "推送到GitHub..."
    
    # 确认推送
    Write-Host ""
    Log-Info "准备推送到分支: $CurrentBranch"
    $push = Read-Host "是否推送到GitHub？(y/N)"
    if ($push -ne "y" -and $push -ne "Y") {
        Log-Info "推送已取消"
        return
    }
    
    # 推送到远程仓库
    Log-Info "推送到远程仓库..."
    try {
        git push origin $CurrentBranch
        Log-Info "✅ 推送成功"
    }
    catch {
        Log-Error "❌ 推送失败"
        exit 1
    }
}

# 创建版本标签（可选）
function New-VersionTag {
    Log-Step "创建版本标签（可选）..."
    
    Write-Host ""
    $createTag = Read-Host "是否创建版本标签？(y/N)"
    if ($createTag -ne "y" -and $createTag -ne "Y") {
        Log-Info "跳过版本标签创建"
        return
    }
    
    # 获取版本号
    Write-Host ""
    $versionTag = Read-Host "请输入版本号 (例如: v1.0.1)"
    
    if (-not $versionTag) {
        Log-Warn "版本号为空，跳过标签创建"
        return
    }
    
    # 创建标签
    git tag -a $versionTag -m "Release $versionTag - 修复nginx代理和API路径问题"
    
    # 推送标签
    try {
        git push origin $versionTag
        Log-Info "✅ 版本标签 $versionTag 创建并推送成功"
    }
    catch {
        Log-Error "❌ 版本标签推送失败"
        exit 1
    }
}

# 监控GitHub Actions
function Watch-GitHubActions {
    Log-Step "监控GitHub Actions..."
    
    $repoUrl = (git remote get-url origin) -replace '\.git$', ''
    $actionsUrl = "$repoUrl/actions"
    
    Log-Info "GitHub Actions页面: $actionsUrl"
    Log-Info "请在浏览器中打开上述链接查看构建状态"
    
    Write-Host ""
    Log-Info "构建完成后，您可以："
    Log-Info "1. 检查构建日志确认没有错误"
    Log-Info "2. 确认新镜像已推送到GitHub Container Registry"
    Log-Info "3. 在生产环境运行: docker-compose pull && docker-compose up -d"
}

# 显示部署指令
function Show-DeploymentInstructions {
    Log-Step "显示部署指令..."
    
    Write-Host ""
    Write-Host "=== 生产环境部署指令 ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. 等待GitHub Actions构建完成" -ForegroundColor White
    Write-Host "2. 在生产服务器上运行以下命令:" -ForegroundColor White
    Write-Host ""
    Write-Host "   # 拉取最新镜像" -ForegroundColor Gray
    Write-Host "   docker-compose pull" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   # 重启服务" -ForegroundColor Gray
    Write-Host "   docker-compose down" -ForegroundColor Cyan
    Write-Host "   docker-compose up -d" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. 验证部署:" -ForegroundColor White
    Write-Host "   # 检查健康状态" -ForegroundColor Gray
    Write-Host "   curl http://192.168.1.115:8000/api/health" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   # 测试登录API" -ForegroundColor Gray
    Write-Host "   curl -X POST http://192.168.1.115:8000/api/v1/auth/login \" -ForegroundColor Cyan
    Write-Host "     -H `"Content-Type: application/json`" \" -ForegroundColor Cyan
    Write-Host "     -d '{`"username`":`"admin`",`"password`":`"admin123`"}'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "4. 或使用部署脚本:" -ForegroundColor White
    Write-Host "   .\scripts\deploy-production.ps1" -ForegroundColor Cyan
    Write-Host ""
}

# 主函数
function Invoke-GitHubRelease {
    Show-Header
    $currentBranch = Test-GitStatus
    Test-GitHubActions
    Test-Fixes
    Submit-Fixes
    Push-ToGitHub -CurrentBranch $currentBranch
    New-VersionTag
    Watch-GitHubActions
    Show-DeploymentInstructions
    
    Write-Host ""
    Log-Info "🎉 GitHub构建发布流程完成！"
    Log-Info "请查看GitHub Actions页面确认构建状态"
}

# 处理命令行参数
switch ($Action.ToLower()) {
    "check" {
        Test-GitStatus
        Test-GitHubActions
        Test-Fixes
    }
    "commit" {
        Submit-Fixes
    }
    "push" {
        $currentBranch = Test-GitStatus
        Push-ToGitHub -CurrentBranch $currentBranch
    }
    default {
        Invoke-GitHubRelease
    }
}
