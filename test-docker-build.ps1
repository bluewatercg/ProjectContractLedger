# Docker构建测试脚本 (PowerShell版本)

param(
    [switch]$Help,
    [switch]$TestOnly,
    [switch]$Simple
)

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

function Show-Help {
    Write-Host "用法: .\test-docker-build.ps1 [选项]"
    Write-Host "选项:"
    Write-Host "  -Help        显示帮助"
    Write-Host "  -TestOnly    只运行测试，不重新构建"
    Write-Host "  -Simple      使用简化的Dockerfile"
    Write-Host ""
    Write-Host "示例:"
    Write-Host "  .\test-docker-build.ps1"
    Write-Host "  .\test-docker-build.ps1 -Simple"
    Write-Host "  .\test-docker-build.ps1 -TestOnly"
}

function Test-Docker {
    Write-Info "检查Docker环境..."
    
    try {
        $null = docker --version
        $null = docker info
        Write-Success "Docker 环境正常"
        return $true
    }
    catch {
        Write-Error "Docker 未安装或未运行"
        return $false
    }
}

function Build-DockerImage {
    param($UseSimple = $false)
    
    $dockerfile = if ($UseSimple) { "Dockerfile.simple" } else { "Dockerfile" }
    $imageName = "contract-ledger-test:latest"
    
    Write-Info "开始构建Docker镜像 (使用 $dockerfile)..."
    Write-Info "这可能需要几分钟时间..."
    
    # 清理旧镜像
    Write-Info "清理旧的测试镜像..."
    docker rmi $imageName 2>$null
    
    # 构建镜像
    $buildResult = docker build -t $imageName -f $dockerfile . --no-cache
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "镜像构建成功"
        return $true
    }
    else {
        Write-Error "镜像构建失败"
        Write-Host "构建输出:" -ForegroundColor Yellow
        Write-Host $buildResult
        return $false
    }
}

function Test-DockerImage {
    $imageName = "contract-ledger-test:latest"
    $containerName = "contract-ledger-test-container"
    
    Write-Info "测试镜像基本功能..."
    
    # 检查镜像是否存在
    $imageExists = docker images $imageName --format "{{.Repository}}" | Select-String "contract-ledger-test"
    if (-not $imageExists) {
        Write-Error "镜像不存在"
        return $false
    }
    
    # 获取镜像大小
    $imageSize = docker images $imageName --format "{{.Size}}"
    Write-Info "镜像大小: $imageSize"
    
    # 运行容器进行基本测试
    Write-Info "启动测试容器..."
    
    # 停止并删除可能存在的旧容器
    docker stop $containerName 2>$null
    docker rm $containerName 2>$null
    
    $containerId = docker run -d --name $containerName -p 8081:80 -p 8082:8080 -e NODE_ENV=production $imageName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "容器启动成功 (ID: $($containerId.Substring(0, 12)))"
        
        # 等待服务启动
        Write-Info "等待服务启动..."
        Start-Sleep -Seconds 30
        
        # 测试健康检查
        Write-Info "测试健康检查端点..."
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8081/health" -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "健康检查通过"
            }
            else {
                Write-Warning "健康检查返回状态码: $($response.StatusCode)"
            }
        }
        catch {
            Write-Warning "健康检查失败: $($_.Exception.Message)"
            Write-Info "查看容器日志:"
            docker logs $containerName --tail 20
        }
        
        # 清理测试容器
        Write-Info "清理测试容器..."
        docker stop $containerName 2>$null
        docker rm $containerName 2>$null
        
        return $true
    }
    else {
        Write-Error "容器启动失败"
        return $false
    }
}

function Show-BuildInfo {
    $imageName = "contract-ledger-test:latest"
    
    Write-Host ""
    Write-Success "=== 构建信息 ==="
    Write-Host "镜像名称: $imageName"
    
    $imageSize = docker images $imageName --format "{{.Size}}"
    Write-Host "镜像大小: $imageSize"
    
    $createdAt = docker images $imageName --format "{{.CreatedAt}}"
    Write-Host "创建时间: $createdAt"
    
    Write-Host ""
    Write-Host "测试命令:"
    Write-Host "  docker run -d -p 80:80 -p 8080:8080 $imageName"
    Write-Host ""
    Write-Host "访问地址:"
    Write-Host "  前端: http://localhost"
    Write-Host "  健康检查: http://localhost/health"
    Write-Host ""
}

# 主逻辑
if ($Help) {
    Show-Help
    exit 0
}

Write-Host "=== Docker构建测试 ===" -ForegroundColor Cyan
Write-Host "时间: $(Get-Date)" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Docker)) {
    exit 1
}

if ($TestOnly) {
    Write-Info "只运行测试模式"
    if (Test-DockerImage) {
        Show-BuildInfo
        Write-Success "Docker测试完成！"
    }
    else {
        Write-Error "镜像测试失败"
        exit 1
    }
}
else {
    if (Build-DockerImage -UseSimple:$Simple) {
        if (Test-DockerImage) {
            Show-BuildInfo
            Write-Success "Docker构建测试完成！"
        }
        else {
            Write-Error "镜像测试失败"
            exit 1
        }
    }
    else {
        Write-Error "镜像构建失败"
        exit 1
    }
}

Write-Host ""
Write-Host "按任意键继续..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
