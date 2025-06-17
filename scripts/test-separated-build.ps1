# 测试分离式前后端容器构建脚本 (PowerShell版本)

param(
    [switch]$Help,
    [switch]$SkipCleanup
)

# 显示帮助信息
if ($Help) {
    Write-Host "分离式前后端容器构建测试脚本" -ForegroundColor Green
    Write-Host ""
    Write-Host "用法:"
    Write-Host "  .\test-separated-build.ps1              # 运行所有测试"
    Write-Host "  .\test-separated-build.ps1 -SkipCleanup # 跳过清理步骤"
    Write-Host "  .\test-separated-build.ps1 -Help        # 显示帮助"
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

# 检查Docker环境
function Test-DockerEnvironment {
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
        
        Write-Success "Docker环境正常"
        return $true
    }
    catch {
        Write-Error "Docker检查失败: $_"
        return $false
    }
}

# 测试后端容器构建
function Test-BackendBuild {
    Write-Info "测试后端容器构建..."
    
    try {
        Set-Location "apps/backend"
        
        # 构建后端镜像
        Write-Info "构建后端镜像..."
        docker build -t test-backend:latest .
        if ($LASTEXITCODE -ne 0) {
            throw "后端镜像构建失败"
        }
        Write-Success "后端镜像构建成功"
        
        # 测试后端容器启动
        Write-Info "测试后端容器启动..."
        docker run -d --name test-backend-container `
            -p 18080:8080 `
            -e NODE_ENV=production `
            -e DB_HOST=localhost `
            -e DB_USERNAME=test `
            -e DB_PASSWORD=test `
            -e DB_DATABASE=test `
            -e REDIS_HOST=localhost `
            -e JWT_SECRET=test-secret `
            test-backend:latest
        
        if ($LASTEXITCODE -ne 0) {
            throw "后端容器启动失败"
        }
        
        # 等待容器启动
        Write-Info "等待后端容器启动..."
        Start-Sleep -Seconds 15
        
        # 检查容器状态
        $containerStatus = docker ps --filter "name=test-backend-container" --format "{{.Status}}"
        if ($containerStatus -and $containerStatus.Contains("Up")) {
            Write-Success "后端容器运行正常"
        }
        else {
            Write-Error "后端容器未正常运行"
            docker logs test-backend-container
            throw "后端容器状态异常"
        }
        
        Set-Location "../.."
        return $true
    }
    catch {
        Write-Error "后端构建测试失败: $_"
        Set-Location "../.."
        return $false
    }
}

# 测试前端容器构建
function Test-FrontendBuild {
    Write-Info "测试前端容器构建..."
    
    try {
        Set-Location "apps/frontend"
        
        # 构建前端镜像
        Write-Info "构建前端镜像..."
        docker build -t test-frontend:latest .
        if ($LASTEXITCODE -ne 0) {
            throw "前端镜像构建失败"
        }
        Write-Success "前端镜像构建成功"
        
        # 测试前端容器启动
        Write-Info "测试前端容器启动..."
        docker run -d --name test-frontend-container `
            -p 18081:80 `
            -e BACKEND_HOST=localhost `
            -e BACKEND_PORT=8080 `
            test-frontend:latest
        
        if ($LASTEXITCODE -ne 0) {
            throw "前端容器启动失败"
        }
        
        # 等待容器启动
        Write-Info "等待前端容器启动..."
        Start-Sleep -Seconds 10
        
        # 检查容器状态
        $containerStatus = docker ps --filter "name=test-frontend-container" --format "{{.Status}}"
        if ($containerStatus -and $containerStatus.Contains("Up")) {
            Write-Success "前端容器运行正常"
        }
        else {
            Write-Error "前端容器未正常运行"
            docker logs test-frontend-container
            throw "前端容器状态异常"
        }
        
        # 测试前端访问
        Write-Info "测试前端访问..."
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:18081" -TimeoutSec 5 -ErrorAction Stop
            Write-Success "前端服务可访问"
        }
        catch {
            Write-Warning "前端服务可能未完全启动"
        }
        
        Set-Location "../.."
        return $true
    }
    catch {
        Write-Error "前端构建测试失败: $_"
        Set-Location "../.."
        return $false
    }
}

# 测试分离部署配置
function Test-SeparatedDeployment {
    Write-Info "测试分离部署配置..."
    
    try {
        Set-Location "deployment"
        
        # 检查配置文件
        if (-not (Test-Path "docker-compose.separated.yml")) {
            throw "分离部署配置文件不存在"
        }
        
        if (-not (Test-Path ".env.separated.template")) {
            throw "环境变量模板文件不存在"
        }
        
        # 验证docker-compose配置
        Write-Info "验证docker-compose配置..."
        docker-compose -f docker-compose.separated.yml config | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "docker-compose配置无效"
        }
        Write-Success "docker-compose配置有效"
        
        Set-Location ".."
        return $true
    }
    catch {
        Write-Error "分离部署配置测试失败: $_"
        Set-Location ".."
        return $false
    }
}

# 清理测试资源
function Clear-TestResources {
    if ($SkipCleanup) {
        Write-Info "跳过清理步骤"
        return
    }
    
    Write-Info "清理测试资源..."
    
    # 清理后端测试资源
    docker stop test-backend-container 2>$null | Out-Null
    docker rm test-backend-container 2>$null | Out-Null
    docker rmi test-backend:latest 2>$null | Out-Null
    
    # 清理前端测试资源
    docker stop test-frontend-container 2>$null | Out-Null
    docker rm test-frontend-container 2>$null | Out-Null
    docker rmi test-frontend:latest 2>$null | Out-Null
    
    Write-Success "清理完成"
}

# 显示测试结果
function Show-TestResults {
    Write-Host ""
    Write-Success "=== 测试完成 ==="
    Write-Host "✅ Docker环境检查"
    Write-Host "✅ 后端容器构建和启动"
    Write-Host "✅ 前端容器构建和启动"
    Write-Host "✅ 分离部署配置验证"
    Write-Host ""
    Write-Host "下一步:"
    Write-Host "1. 提交代码到GitHub触发自动构建"
    Write-Host "2. 使用 deployment\deploy-separated.ps1 进行生产部署"
    Write-Host "3. 或使用 docker-compose -f deployment\docker-compose.separated.yml up -d"
}

# 主函数
function Main {
    Write-Host "=== 分离式前后端容器构建测试 ===" -ForegroundColor Green
    Write-Host ""
    
    # 切换到脚本所在目录的上级目录（项目根目录）
    Set-Location (Split-Path $PSScriptRoot -Parent)
    
    $allTestsPassed = $true
    
    try {
        # 执行测试
        if (-not (Test-DockerEnvironment)) {
            $allTestsPassed = $false
        }
        
        if ($allTestsPassed -and -not (Test-BackendBuild)) {
            Write-Error "后端构建测试失败"
            $allTestsPassed = $false
        }
        
        if ($allTestsPassed -and -not (Test-FrontendBuild)) {
            Write-Error "前端构建测试失败"
            $allTestsPassed = $false
        }
        
        if ($allTestsPassed -and -not (Test-SeparatedDeployment)) {
            Write-Error "分离部署配置测试失败"
            $allTestsPassed = $false
        }
        
        if ($allTestsPassed) {
            Show-TestResults
            Write-Success "所有测试通过！"
        }
        else {
            Write-Error "部分测试失败"
            exit 1
        }
    }
    finally {
        Clear-TestResources
    }
}

# 执行主函数
Main
