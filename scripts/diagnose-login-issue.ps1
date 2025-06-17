# 登录问题诊断脚本 (PowerShell版本)
# 用于查看nginx日志和诊断登录API问题

param(
    [string]$Action = "diagnose"
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
    Write-Host "                    登录问题诊断脚本" -ForegroundColor Cyan
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host "时间: $(Get-Date)" -ForegroundColor White
    Write-Host "目标: 诊断登录API问题并查看nginx日志" -ForegroundColor White
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host ""
}

# 查找容器
function Find-Container {
    Log-Step "查找运行中的容器..."
    
    # 查找可能的容器名称
    $ContainerNames = @(
        "contract-ledger",
        "contract-ledger-app", 
        "contract-ledger-fixed",
        "projectcontractledger"
    )
    
    $script:ContainerID = ""
    $script:ContainerName = ""
    
    foreach ($name in $ContainerNames) {
        $containers = docker ps --format "{{.Names}}" | Where-Object { $_ -like "*$name*" }
        if ($containers) {
            $script:ContainerName = $containers[0]
            $script:ContainerID = (docker ps --filter "name=$name" --format "{{.ID}}")[0]
            break
        }
    }
    
    # 如果没找到，尝试通过镜像名查找
    if (-not $script:ContainerID) {
        $script:ContainerID = (docker ps --filter "ancestor=ghcr.milu.moe/bluewatercg/projectcontractledger" --format "{{.ID}}")[0]
        if ($script:ContainerID) {
            $script:ContainerName = (docker ps --filter "id=$script:ContainerID" --format "{{.Names}}")[0]
        }
    }
    
    if (-not $script:ContainerID) {
        Log-Error "未找到运行中的容器"
        Log-Info "当前运行的容器："
        docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
        exit 1
    }
    
    Log-Info "找到容器: $script:ContainerName ($script:ContainerID)"
}

# 检查容器状态
function Test-ContainerStatus {
    Log-Step "检查容器状态..."
    
    # 容器基本信息
    Log-Info "容器信息："
    $containerInfo = docker inspect $script:ContainerID --format "{{.Name}}: {{.State.Status}}"
    Write-Host $containerInfo
    
    # 端口映射
    Log-Info "端口映射："
    docker port $script:ContainerID
    
    # 资源使用
    Log-Info "资源使用："
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" $script:ContainerID
}

# 查看容器日志
function Get-ContainerLogs {
    Log-Step "查看容器启动日志..."
    
    Write-Host "=== 最近50行容器日志 ===" -ForegroundColor Yellow
    docker logs --tail 50 $script:ContainerID
    Write-Host ""
}

# 查看nginx日志
function Get-NginxLogs {
    Log-Step "查看nginx日志..."
    
    # 检查nginx日志文件是否存在
    Log-Info "检查nginx日志文件..."
    try {
        docker exec $script:ContainerID ls -la /var/log/nginx/
    }
    catch {
        Log-Warn "nginx日志目录不存在，尝试查找日志文件..."
        docker exec $script:ContainerID find / -name "access.log" -o -name "error.log" 2>$null | Select-Object -First 10
    }
    
    Write-Host ""
    Write-Host "=== Nginx访问日志 (最近20行) ===" -ForegroundColor Yellow
    try {
        docker exec $script:ContainerID tail -20 /var/log/nginx/access.log
    }
    catch {
        Log-Warn "无法读取nginx访问日志"
    }
    
    Write-Host ""
    Write-Host "=== Nginx错误日志 (最近20行) ===" -ForegroundColor Yellow
    try {
        docker exec $script:ContainerID tail -20 /var/log/nginx/error.log
    }
    catch {
        Log-Warn "无法读取nginx错误日志"
    }
}

# 测试API接口
function Test-ApiEndpoints {
    Log-Step "测试API接口..."
    
    $BaseUrl = "http://192.168.1.115:8000"
    
    # 测试健康检查
    Log-Info "测试健康检查接口..."
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Log-Info "✅ 健康检查正常 (HTTP $($response.StatusCode))"
        }
        else {
            Log-Error "❌ 健康检查异常 (HTTP $($response.StatusCode))"
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Log-Error "❌ 健康检查失败 (HTTP $statusCode)"
    }
    
    # 测试登录接口
    Log-Info "测试登录接口..."
    try {
        $body = @{
            username = "test"
            password = "test"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq 401 -or $statusCode -eq 400) {
            Log-Info "✅ 登录接口路径正确 (HTTP $statusCode - 认证失败，符合预期)"
        }
        else {
            Log-Warn "⚠️  登录接口异常 (HTTP $statusCode)"
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            Log-Error "❌ 登录接口404 - 路径问题"
        }
        elseif ($statusCode -eq 401 -or $statusCode -eq 400) {
            Log-Info "✅ 登录接口路径正确 (HTTP $statusCode - 认证失败，符合预期)"
        }
        else {
            Log-Warn "⚠️  登录接口异常 (HTTP $statusCode)"
        }
    }
    
    # 获取详细响应
    Log-Info "获取登录接口详细响应..."
    Write-Host "=== 登录接口响应 ===" -ForegroundColor Yellow
    try {
        $body = @{
            username = "test"
            password = "test"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
        Write-Host $response.Content
    }
    catch {
        Write-Host $_.Exception.Response.Content
    }
    Write-Host ""
}

# 检查nginx配置
function Test-NginxConfig {
    Log-Step "检查nginx配置..."
    
    # 测试nginx配置
    Log-Info "测试nginx配置语法..."
    try {
        docker exec $script:ContainerID nginx -t
    }
    catch {
        Log-Warn "nginx配置测试失败"
    }
    
    # 查看nginx配置文件
    Log-Info "查看nginx主配置..."
    Write-Host "=== nginx.conf (关键部分) ===" -ForegroundColor Yellow
    try {
        docker exec $script:ContainerID grep -A 10 -B 2 "location /api" /etc/nginx/nginx.conf
    }
    catch {
        Log-Warn "无法读取nginx配置，尝试查找配置文件..."
        docker exec $script:ContainerID find /etc -name "nginx.conf" | Select-Object -First 5
    }
    Write-Host ""
}

# 检查运行时配置
function Test-RuntimeConfig {
    Log-Step "检查前端运行时配置..."
    
    # 查看前端配置文件
    Log-Info "查看前端运行时配置..."
    Write-Host "=== 前端运行时配置 ===" -ForegroundColor Yellow
    try {
        docker exec $script:ContainerID cat /usr/share/nginx/html/config.js
    }
    catch {
        Log-Warn "无法读取前端配置文件"
        docker exec $script:ContainerID find /usr/share/nginx/html -name "config.js" -o -name "*.js" | Select-Object -First 5
    }
    Write-Host ""
    
    # 检查环境变量
    Log-Info "检查关键环境变量..."
    Write-Host "=== 关键环境变量 ===" -ForegroundColor Yellow
    try {
        docker exec $script:ContainerID env | Where-Object { $_ -match "(API|FRONTEND|NODE_ENV)" }
    }
    catch {
        Log-Warn "未找到相关环境变量"
    }
    Write-Host ""
}

# 生成诊断报告
function New-DiagnosisReport {
    Log-Step "生成诊断报告..."
    
    $ReportFile = "login-diagnosis-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
    
    $report = @"
登录问题诊断报告
生成时间: $(Get-Date)
容器: $script:ContainerName ($script:ContainerID)

=== 容器状态 ===
$(docker inspect $script:ContainerID --format "{{.Name}}: {{.State.Status}}")
$(docker port $script:ContainerID)

=== API测试结果 ===
健康检查: $(try { (Invoke-WebRequest -Uri "http://192.168.1.115:8000/api/health" -UseBasicParsing).StatusCode } catch { $_.Exception.Response.StatusCode.value__ })
登录接口: $(try { (Invoke-WebRequest -Uri "http://192.168.1.115:8000/api/v1/auth/login" -Method POST -Body '{"username":"test","password":"test"}' -ContentType "application/json" -UseBasicParsing).StatusCode } catch { $_.Exception.Response.StatusCode.value__ })

=== 最近容器日志 ===
$(docker logs --tail 30 $script:ContainerID)

=== Nginx日志 ===
$(try { docker exec $script:ContainerID tail -10 /var/log/nginx/access.log } catch { "无法读取访问日志" })
$(try { docker exec $script:ContainerID tail -10 /var/log/nginx/error.log } catch { "无法读取错误日志" })
"@
    
    $report | Out-File -FilePath $ReportFile -Encoding UTF8
    Log-Info "诊断报告已保存到: $ReportFile"
}

# 主函数
function Invoke-Diagnosis {
    Show-Header
    Find-Container
    Test-ContainerStatus
    Get-ContainerLogs
    Get-NginxLogs
    Test-ApiEndpoints
    Test-NginxConfig
    Test-RuntimeConfig
    
    Write-Host ""
    Log-Info "诊断完成！"
    Log-Info "如需生成报告，请运行: .\scripts\diagnose-login-issue.ps1 -Action report"
    Log-Info "如需查看日志，请运行: .\scripts\diagnose-login-issue.ps1 -Action logs"
}

# 处理命令行参数
switch ($Action.ToLower()) {
    "report" {
        Find-Container
        New-DiagnosisReport
    }
    "logs" {
        Find-Container
        Get-NginxLogs
    }
    default {
        Invoke-Diagnosis
    }
}
