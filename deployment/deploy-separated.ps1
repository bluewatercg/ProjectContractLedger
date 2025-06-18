# 前后端分离部署脚本 (PowerShell版本)
# 支持多种部署模式：基础模式、带代理模式

param(
    [string]$Mode = "basic",  # basic, proxy, update, stop, logs, status
    [switch]$Help
)

# 配置变量
$ComposeFile = "docker-compose.yml"
$ComposeFileSeparated = "docker-compose.separated.yml"
$EnvFile = ".env"

# 显示帮助信息
if ($Help) {
    Write-Host "前后端分离部署脚本" -ForegroundColor Green
    Write-Host ""
    Write-Host "用法:"
    Write-Host "  .\deploy-separated.ps1                    # 基础部署（默认）"
    Write-Host "  .\deploy-separated.ps1 -Mode basic       # 基础部署"
    Write-Host "  .\deploy-separated.ps1 -Mode proxy       # 带代理的部署"
    Write-Host "  .\deploy-separated.ps1 -Mode update      # 更新部署"
    Write-Host "  .\deploy-separated.ps1 -Mode stop        # 停止服务"
    Write-Host "  .\deploy-separated.ps1 -Mode logs        # 查看日志"
    Write-Host "  .\deploy-separated.ps1 -Mode status      # 查看状态"
    Write-Host "  .\deploy-separated.ps1 -Help             # 显示帮助"
    Write-Host ""
    exit 0
}

# 日志函数
function Write-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# 检查Docker是否安装
function Test-Docker {
    Write-Info "检查Docker环境..."

    try {
        $dockerVersion = docker --version
        if (-not $dockerVersion) {
            throw "Docker未安装"
        }

        $composeVersion = docker-compose --version
        if (-not $composeVersion) {
            throw "Docker Compose未安装"
        }

        docker info | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Docker守护进程未运行"
        }

        Write-Success "Docker环境检查通过"
        return $true
    }
    catch {
        Write-Error "Docker检查失败: $_"
        return $false
    }
}

# 检查环境变量文件
function Test-EnvFile {
    Write-Info "检查环境变量配置..."

    if (-not (Test-Path $EnvFile)) {
        Write-Warning "环境变量文件 $EnvFile 不存在"

        if (Test-Path ".env.template") {
            Write-Info "复制模板文件..."
            Copy-Item ".env.template" $EnvFile
            Write-Warning "请编辑 $EnvFile 文件，填写正确的配置值"
            Write-Warning "特别注意以下配置项："
            Write-Host "  - DB_USERNAME, DB_PASSWORD: 数据库用户名和密码"
            Write-Host "  - REDIS_PASSWORD: Redis密码（如果有）"
            Write-Host "  - JWT_SECRET: JWT密钥"
            Write-Host "  - BACKEND_HOST: 后端服务地址"
            Read-Host "配置完成后按回车继续"
        }
        else {
            Write-Error "环境变量模板文件不存在"
            return $false
        }
    }

    # 检查必需的环境变量
    # 读取文件内容并处理可能的格式问题
    $envContent = Get-Content $EnvFile -ErrorAction SilentlyContinue

    # 处理Windows/Unix换行符问题
    if ($envContent) {
        $envContent = $envContent | ForEach-Object { $_.TrimEnd("`r") }
    }

    $hasDbUser = $false
    $hasDbPass = $false
    $hasJwtSecret = $false

    foreach ($line in $envContent) {
        $line = $line.Trim()
        if ($line -match "^DB_USERNAME=.+") { $hasDbUser = $true }
        if ($line -match "^DB_PASSWORD=.+") { $hasDbPass = $true }
        if ($line -match "^JWT_SECRET=.+") { $hasJwtSecret = $true }
    }

    if (-not ($hasDbUser -and $hasDbPass -and $hasJwtSecret)) {
        Write-Error "必需的环境变量未设置，请检查 $EnvFile 文件"
        return $false
    }

    Write-Success "环境变量文件检查通过"
    return $true
}

# 拉取最新镜像
function Update-Images {
    param($ComposeFile)
    Write-Info "拉取最新镜像..."

    try {
        docker-compose -f $ComposeFile --env-file $EnvFile pull
        if ($LASTEXITCODE -ne 0) {
            throw "镜像拉取失败"
        }
        Write-Success "镜像拉取完成"
        return $true
    }
    catch {
        Write-Error "镜像拉取失败: $_"
        return $false
    }
}

# 停止现有服务
function Stop-Services {
    param($ComposeFile)
    Write-Info "停止现有服务..."

    try {
        docker-compose -f $ComposeFile --env-file $EnvFile down
        Write-Success "服务停止完成"
        return $true
    }
    catch {
        Write-Warning "停止服务时出现警告: $_"
        return $true
    }
}

# 启动服务
function Start-Services {
    param($ComposeFile, $Profile)
    Write-Info "启动前后端分离服务..."

    try {
        if ($Profile) {
            docker-compose -f $ComposeFile --env-file $EnvFile --profile $Profile up -d
        } else {
            docker-compose -f $ComposeFile --env-file $EnvFile up -d
        }

        if ($LASTEXITCODE -ne 0) {
            throw "服务启动失败"
        }
        Write-Success "服务启动完成"
        return $true
    }
    catch {
        Write-Error "服务启动失败: $_"
        return $false
    }
}

# 检查服务状态
function Test-Services {
    param($ComposeFile)
    Write-Info "检查服务状态..."

    Start-Sleep -Seconds 15

    # 读取端口配置
    $envContent = Get-Content $EnvFile -ErrorAction SilentlyContinue
    $backendPort = 8080
    $frontendPort = 80

    foreach ($line in $envContent) {
        if ($line -match "^BACKEND_PORT=(.+)") {
            $backendPort = $matches[1].Trim()
        }
        if ($line -match "^FRONTEND_PORT=(.+)") {
            $frontendPort = $matches[1].Trim()
        }
    }

    # 检查后端服务
    Write-Info "检查后端服务 (端口 $backendPort)..."
    for ($i = 1; $i -le 5; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$backendPort/health" -TimeoutSec 5 -ErrorAction Stop
            Write-Success "后端服务运行正常"
            break
        }
        catch {
            Write-Info "等待后端服务启动... ($i/5)"
            Start-Sleep -Seconds 5
        }
    }

    # 检查前端服务
    Write-Info "检查前端服务 (端口 $frontendPort)..."
    for ($i = 1; $i -le 5; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$frontendPort" -TimeoutSec 5 -ErrorAction Stop
            Write-Success "前端服务运行正常"
            break
        }
        catch {
            Write-Info "等待前端服务启动... ($i/5)"
            Start-Sleep -Seconds 5
        }
    }

    # 显示容器状态
    Write-Info "容器状态:"
    docker-compose -f $ComposeFile --env-file $EnvFile ps
}

# 显示访问信息
function Show-AccessInfo {
    param($Mode)

    # 读取端口配置
    $envContent = Get-Content $EnvFile -ErrorAction SilentlyContinue
    $backendPort = 8080
    $frontendPort = 80
    $proxyPort = 8000

    foreach ($line in $envContent) {
        if ($line -match "^BACKEND_PORT=(.+)") {
            $backendPort = $matches[1].Trim()
        }
        if ($line -match "^FRONTEND_PORT=(.+)") {
            $frontendPort = $matches[1].Trim()
        }
        if ($line -match "^PROXY_PORT=(.+)") {
            $proxyPort = $matches[1].Trim()
        }
    }

    Write-Host ""
    Write-Success "=== 部署完成 ==="

    if ($Mode -eq "proxy") {
        Write-Host "统一入口地址: http://localhost:$proxyPort"
        Write-Host "前端直接访问: http://localhost:$frontendPort"
        Write-Host "后端直接访问: http://localhost:$backendPort"
    } else {
        Write-Host "前端访问地址: http://localhost:$frontendPort"
        Write-Host "后端API地址: http://localhost:$backendPort"
    }

    Write-Host "后端健康检查: http://localhost:$backendPort/health"
    Write-Host ""
    Write-Host "管理命令:"
    Write-Host "  查看日志: docker-compose logs -f"
    Write-Host "  停止服务: docker-compose down"
    Write-Host "  重启服务: docker-compose restart"
}

# 基础部署
function Deploy-Basic {
    Write-Info "开始基础部署..."

    if (-not (Test-Docker)) { exit 1 }
    if (-not (Test-EnvFile)) { exit 1 }
    if (-not (Update-Images $ComposeFile)) { exit 1 }
    if (-not (Stop-Services $ComposeFile)) { exit 1 }
    if (-not (Start-Services $ComposeFile)) { exit 1 }

    Test-Services $ComposeFile
    Show-AccessInfo "basic"

    Write-Success "基础部署完成！"
}

# 代理部署
function Deploy-Proxy {
    Write-Info "开始代理部署..."

    if (-not (Test-Docker)) { exit 1 }
    if (-not (Test-EnvFile)) { exit 1 }
    if (-not (Update-Images $ComposeFileSeparated)) { exit 1 }
    if (-not (Stop-Services $ComposeFileSeparated)) { exit 1 }
    if (-not (Start-Services $ComposeFileSeparated "proxy")) { exit 1 }

    Test-Services $ComposeFileSeparated
    Show-AccessInfo "proxy"

    Write-Success "代理部署完成！"
}

# 更新部署
function Update-Deployment {
    Write-Info "开始更新部署..."

    # 检测当前使用的模式
    $containers = docker ps --format "table {{.Names}}" | Out-String
    if ($containers -match "nginx-proxy") {
        Write-Info "检测到代理模式，更新代理部署..."
        Deploy-Proxy
    } else {
        Write-Info "检测到基础模式，更新基础部署..."
        Deploy-Basic
    }
}

# 停止所有服务
function Stop-AllServices {
    Write-Info "停止所有服务..."

    # 尝试停止两种模式的服务
    try { docker-compose -f $ComposeFile --env-file $EnvFile down } catch {}
    try { docker-compose -f $ComposeFileSeparated --env-file $EnvFile down } catch {}

    Write-Success "所有服务已停止"
}

# 查看日志
function Show-Logs {
    # 检测当前运行的服务
    $containers = docker ps --format "table {{.Names}}" | Out-String
    if ($containers -match "nginx-proxy") {
        docker-compose -f $ComposeFileSeparated --env-file $EnvFile logs -f
    } else {
        docker-compose -f $ComposeFile --env-file $EnvFile logs -f
    }
}

# 查看状态
function Show-Status {
    Write-Info "服务状态:"
    $containers = docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}" | Select-String "contract-ledger"
    if ($containers) {
        $containers
    } else {
        Write-Host "没有运行的服务"
    }

    Write-Host ""
    Write-Info "系统资源使用:"
    $stats = docker stats --no-stream --format "table {{.Container}}`t{{.CPUPerc}}`t{{.MemUsage}}" | Select-String "contract-ledger"
    if ($stats) {
        $stats
    } else {
        Write-Host "没有运行的服务"
    }
}

# 主函数
function Main {
    # 切换到脚本所在目录
    Set-Location $PSScriptRoot

    switch ($Mode.ToLower()) {
        "basic" { Deploy-Basic }
        "proxy" { Deploy-Proxy }
        "update" { Update-Deployment }
        "stop" { Stop-AllServices }
        "logs" { Show-Logs }
        "status" { Show-Status }
        default {
            Write-Error "未知模式: $Mode"
            Write-Host "使用 -Help 查看帮助信息"
            exit 1
        }
    }
}

# 执行主函数
Main
