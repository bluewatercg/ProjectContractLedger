# 生产环境部署脚本 (PowerShell版本)
# 确保拉取最新镜像并启动服务

param(
    [string]$Action = "deploy"
)

# 配置变量
$ComposeFile = "docker-compose.yml"
$EnvFile = ".env"
$ContainerName = "contract-ledger"
$ImageName = "ghcr.milu.moe/bluewatercg/projectcontractledger"
$HealthUrl = "http://192.168.1.115:8000/api/health"
$FrontendUrl = "http://192.168.1.115:8000"

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
    Write-Host "           生产环境部署脚本 - 项目合同管理系统" -ForegroundColor Cyan
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host "时间: $(Get-Date)" -ForegroundColor White
    Write-Host "镜像: $ImageName" -ForegroundColor White
    Write-Host "健康检查: $HealthUrl" -ForegroundColor White
    Write-Host "前端地址: $FrontendUrl" -ForegroundColor White
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host ""
}

# 检查必要文件和环境
function Test-Prerequisites {
    Log-Step "检查部署环境..."
    
    # 检查 docker-compose 文件
    if (-not (Test-Path $ComposeFile)) {
        Log-Error "未找到 $ComposeFile 文件"
        exit 1
    }
    
    # 检查环境变量文件
    if (-not (Test-Path $EnvFile)) {
        Log-Warn "未找到 $EnvFile 文件，将使用默认配置"
    }
    
    # 检查 Docker 是否运行
    try {
        docker info | Out-Null
    }
    catch {
        Log-Error "Docker 未运行，请启动 Docker Desktop"
        exit 1
    }
    
    # 检查 docker-compose 是否可用
    try {
        docker-compose --version | Out-Null
    }
    catch {
        Log-Error "docker-compose 未安装或不在 PATH 中"
        exit 1
    }
    
    Log-Info "环境检查通过"
}

# 备份当前部署
function Backup-CurrentDeployment {
    Log-Step "备份当前部署..."
    
    # 检查是否有运行的容器
    $runningContainers = docker-compose ps --services --filter "status=running"
    if ($runningContainers) {
        # 创建镜像备份
        $backupTag = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        
        # 获取当前运行的镜像ID
        $currentImage = docker-compose images -q | Select-Object -First 1
        if ($currentImage) {
            docker tag $currentImage "${ImageName}:${backupTag}"
            Log-Info "当前镜像已备份为: ${ImageName}:${backupTag}"
        }
        
        # 导出当前配置
        $backupConfig = "docker-compose.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss').yml"
        docker-compose config | Out-File -FilePath $backupConfig -Encoding UTF8
        Log-Info "当前配置已备份到: $backupConfig"
    }
    else {
        Log-Info "没有运行中的容器需要备份"
    }
}

# 清理旧镜像缓存
function Clear-OldImages {
    Log-Step "清理旧镜像缓存..."
    
    # 停止并删除容器（保留数据卷）
    Log-Info "停止当前服务..."
    docker-compose down --remove-orphans
    
    # 删除旧的镜像（强制拉取最新版本）
    Log-Info "删除本地镜像缓存..."
    try {
        docker rmi "${ImageName}:latest" 2>$null
    }
    catch {
        Log-Warn "本地镜像不存在或已删除"
    }
    
    # 清理未使用的镜像
    Log-Info "清理未使用的镜像..."
    docker image prune -f | Out-Null
    
    Log-Info "镜像缓存清理完成"
}

# 拉取最新镜像
function Get-LatestImage {
    Log-Step "拉取最新镜像..."
    
    # 强制拉取最新镜像
    Log-Info "从 GitHub Container Registry 拉取最新镜像..."
    docker-compose pull --ignore-pull-failures
    
    # 验证镜像拉取成功
    $imageExists = docker images --format "{{.Repository}}:{{.Tag}}" | Where-Object { $_ -like "*$ImageName*" }
    if ($imageExists) {
        Log-Info "镜像拉取成功，镜像信息："
        docker images | Where-Object { $_ -like "*$ImageName*" } | Select-Object -First 1
        
        # 显示镜像创建时间
        $imageId = docker images --format "{{.ID}}" "${ImageName}:latest" | Select-Object -First 1
        if ($imageId) {
            $created = docker inspect --format='{{.Created}}' $imageId
            $createdDate = ([DateTime]$created).ToString("yyyy-MM-dd HH:mm:ss")
            Log-Info "镜像创建时间: $createdDate"
        }
    }
    else {
        Log-Error "镜像拉取失败"
        exit 1
    }
}

# 启动服务
function Start-Services {
    Log-Step "启动服务..."
    
    # 启动服务
    Log-Info "启动容器..."
    docker-compose up -d
    
    # 显示容器状态
    Log-Info "容器状态："
    docker-compose ps
}

# 等待服务启动
function Wait-ForServices {
    Log-Step "等待服务启动..."
    
    # 等待后端服务
    Log-Info "等待后端服务启动..."
    for ($i = 1; $i -le 60; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $HealthUrl -TimeoutSec 2 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Log-Info "后端服务已启动 (耗时: ${i}秒)"
                break
            }
        }
        catch {
            # 继续等待
        }
        
        if ($i -eq 60) {
            Log-Error "后端服务启动超时 (60秒)"
            Show-Logs
            exit 1
        }
        
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
    }
    Write-Host ""
    
    # 等待前端服务
    Log-Info "等待前端服务启动..."
    for ($i = 1; $i -le 30; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $FrontendUrl -TimeoutSec 2 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Log-Info "前端服务已启动 (耗时: ${i}秒)"
                break
            }
        }
        catch {
            # 继续等待
        }
        
        if ($i -eq 30) {
            Log-Error "前端服务启动超时 (30秒)"
            Show-Logs
            exit 1
        }
        
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
    }
    Write-Host ""
}

# 健康检查
function Test-Health {
    Log-Step "执行健康检查..."
    
    # 检查后端健康状态
    Log-Info "检查后端健康状态..."
    try {
        $healthResponse = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing
        if ($healthResponse.Content -like "*success*" -or $healthResponse.Content -like "*ok*" -or $healthResponse.Content -like "*healthy*") {
            Log-Info "✅ 后端健康检查通过"
        }
        else {
            Log-Warn "⚠️  后端健康检查异常: $($healthResponse.Content)"
        }
    }
    catch {
        Log-Warn "⚠️  后端健康检查失败: $($_.Exception.Message)"
    }
    
    # 检查前端访问
    Log-Info "检查前端访问..."
    try {
        $frontendResponse = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing
        if ($frontendResponse.StatusCode -eq 200) {
            Log-Info "✅ 前端访问正常"
        }
        else {
            Log-Warn "⚠️  前端访问异常 (HTTP $($frontendResponse.StatusCode))"
        }
    }
    catch {
        Log-Warn "⚠️  前端访问失败: $($_.Exception.Message)"
    }
    
    # 检查API路径修复
    Log-Info "检查API路径修复..."
    try {
        $loginApiResponse = Invoke-WebRequest -Uri "${FrontendUrl}/api/v1/auth/login" -UseBasicParsing
        $statusCode = $loginApiResponse.StatusCode
        if ($statusCode -eq 401 -or $statusCode -eq 400) {
            Log-Info "✅ 登录API路径正确 (HTTP $statusCode)"
        }
        else {
            Log-Warn "⚠️  登录API状态异常 (HTTP $statusCode)"
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            Log-Error "❌ 登录API仍然404，修复未生效"
        }
        elseif ($statusCode -eq 401 -or $statusCode -eq 400) {
            Log-Info "✅ 登录API路径正确 (HTTP $statusCode)"
        }
        else {
            Log-Warn "⚠️  登录API检查失败: $($_.Exception.Message)"
        }
    }
}

# 显示日志
function Show-Logs {
    Log-Step "显示最近日志..."
    Write-Host "=== 最近50行日志 ===" -ForegroundColor Yellow
    docker-compose logs --tail 50
}

# 显示部署结果
function Show-DeploymentResult {
    Log-Step "部署结果总结..."
    
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host "                        部署完成" -ForegroundColor Cyan
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host "🌐 前端地址: $FrontendUrl" -ForegroundColor White
    Write-Host "🔧 后端API: http://192.168.1.115:8080" -ForegroundColor White
    Write-Host "❤️  健康检查: $HealthUrl" -ForegroundColor White
    Write-Host "📊 API文档: ${FrontendUrl}/api-docs" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 验证步骤:" -ForegroundColor Yellow
    Write-Host "1. 访问前端: $FrontendUrl" -ForegroundColor White
    Write-Host "2. 测试登录功能" -ForegroundColor White
    Write-Host "3. 测试文件上传功能" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 管理命令:" -ForegroundColor Yellow
    Write-Host "- 查看日志: docker-compose logs -f" -ForegroundColor White
    Write-Host "- 查看状态: docker-compose ps" -ForegroundColor White
    Write-Host "- 重启服务: docker-compose restart" -ForegroundColor White
    Write-Host "- 停止服务: docker-compose down" -ForegroundColor White
    Write-Host "==================================================================" -ForegroundColor Cyan
}

# 主函数
function Invoke-Deployment {
    try {
        Show-Header
        Test-Prerequisites
        Backup-CurrentDeployment
        Clear-OldImages
        Get-LatestImage
        Start-Services
        Wait-ForServices
        Test-Health
        Show-DeploymentResult
        
        Log-Info "🎉 部署成功完成！"
    }
    catch {
        Log-Error "部署过程中出现错误: $($_.Exception.Message)"
        Log-Info "显示错误日志..."
        Show-Logs
        
        Write-Host ""
        Log-Warn "如需回滚，可以使用备份镜像:"
        docker images | Where-Object { $_ -like "*backup*" } | Select-Object -First 3
        
        exit 1
    }
}

# 处理命令行参数
switch ($Action.ToLower()) {
    "logs" {
        docker-compose logs -f
    }
    "status" {
        docker-compose ps
    }
    "health" {
        Test-Health
    }
    "backup" {
        Backup-CurrentDeployment
    }
    default {
        Invoke-Deployment
    }
}
