# 分离式前后端部署脚本 (PowerShell版本)
# 用于部署分离的前后端容器

param(
    [switch]$Help,
    [switch]$Force
)

# 显示帮助信息
if ($Help) {
    Write-Host "分离式前后端部署脚本" -ForegroundColor Green
    Write-Host ""
    Write-Host "用法:"
    Write-Host "  .\deploy-separated.ps1          # 正常部署"
    Write-Host "  .\deploy-separated.ps1 -Force   # 强制重新部署"
    Write-Host "  .\deploy-separated.ps1 -Help    # 显示帮助"
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
    
    if (-not (Test-Path ".env.separated")) {
        Write-Warning "环境变量文件 .env.separated 不存在"
        
        if (Test-Path ".env.separated.template") {
            Write-Info "复制模板文件..."
            Copy-Item ".env.separated.template" ".env.separated"
            Write-Warning "请编辑 .env.separated 文件，填写正确的配置值"
            Write-Warning "特别注意以下配置项："
            Write-Host "  - DB_USERNAME, DB_PASSWORD: 数据库用户名和密码"
            Write-Host "  - REDIS_PASSWORD: Redis密码"
            Write-Host "  - JWT_SECRET: JWT密钥"
            Write-Host "  - BACKEND_HOST: 后端服务地址"
            Read-Host "配置完成后按回车继续"
        }
        else {
            Write-Error "环境变量模板文件不存在"
            return $false
        }
    }
    
    Write-Success "环境变量文件检查通过"
    return $true
}

# 拉取最新镜像
function Update-Images {
    Write-Info "拉取最新镜像..."
    
    try {
        docker-compose -f docker-compose.separated.yml pull
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
    Write-Info "停止现有服务..."
    
    try {
        docker-compose -f docker-compose.separated.yml down
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
    Write-Info "启动分离式前后端服务..."
    
    try {
        docker-compose -f docker-compose.separated.yml --env-file .env.separated up -d
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
    Write-Info "检查服务状态..."
    
    Start-Sleep -Seconds 10
    
    # 读取端口配置
    $envContent = Get-Content ".env.separated" -ErrorAction SilentlyContinue
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
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$backendPort/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Success "后端服务运行正常"
    }
    catch {
        Write-Warning "后端服务可能未完全启动，请稍后检查"
    }
    
    # 检查前端服务
    Write-Info "检查前端服务 (端口 $frontendPort)..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$frontendPort" -TimeoutSec 5 -ErrorAction Stop
        Write-Success "前端服务运行正常"
    }
    catch {
        Write-Warning "前端服务可能未完全启动，请稍后检查"
    }
    
    # 显示容器状态
    Write-Info "容器状态:"
    docker-compose -f docker-compose.separated.yml ps
}

# 显示访问信息
function Show-AccessInfo {
    # 读取端口配置
    $envContent = Get-Content ".env.separated" -ErrorAction SilentlyContinue
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
    
    Write-Host ""
    Write-Success "=== 部署完成 ==="
    Write-Host "前端访问地址: http://localhost:$frontendPort"
    Write-Host "后端API地址: http://localhost:$backendPort"
    Write-Host "后端健康检查: http://localhost:$backendPort/health"
    Write-Host ""
    Write-Host "管理命令:"
    Write-Host "  查看日志: docker-compose -f docker-compose.separated.yml logs -f"
    Write-Host "  停止服务: docker-compose -f docker-compose.separated.yml down"
    Write-Host "  重启服务: docker-compose -f docker-compose.separated.yml restart"
}

# 主函数
function Main {
    Write-Host "=== 分离式前后端部署脚本 ===" -ForegroundColor Green
    Write-Host ""
    
    # 切换到脚本所在目录
    Set-Location $PSScriptRoot
    
    # 执行部署步骤
    if (-not (Test-Docker)) { exit 1 }
    if (-not (Test-EnvFile)) { exit 1 }
    if (-not (Update-Images)) { exit 1 }
    if (-not (Stop-Services)) { exit 1 }
    if (-not (Start-Services)) { exit 1 }
    
    Test-Services
    Show-AccessInfo
    
    Write-Success "部署完成！"
}

# 执行主函数
Main
