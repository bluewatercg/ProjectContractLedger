@echo off
setlocal enabledelayedexpansion

REM Docker构建测试脚本 (Windows版本)

echo === Docker构建测试 ===
echo 时间: %date% %time%
echo.

REM 检查Docker是否可用
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 未安装
    pause
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 服务未运行，请启动 Docker Desktop
    pause
    exit /b 1
)

echo [SUCCESS] Docker 环境正常

REM 处理命令行参数
if "%1"=="--help" goto :show_help
if "%1"=="-h" goto :show_help
if "%1"=="--test-only" goto :test_only

REM 清理旧镜像
echo [INFO] 清理旧的测试镜像...
docker rmi contract-ledger-test:latest >nul 2>&1
docker system prune -f >nul 2>&1

REM 构建镜像
echo [INFO] 开始构建Docker镜像...
echo 这可能需要几分钟时间...

docker build -t contract-ledger-test:latest . --no-cache
if errorlevel 1 (
    echo [ERROR] 镜像构建失败
    pause
    exit /b 1
)

echo [SUCCESS] 镜像构建成功

:test_image
REM 测试镜像
echo [INFO] 测试镜像基本功能...

REM 检查镜像是否存在
docker images | findstr "contract-ledger-test" >nul
if errorlevel 1 (
    echo [ERROR] 镜像不存在
    pause
    exit /b 1
)

REM 获取镜像大小
for /f "tokens=*" %%i in ('docker images contract-ledger-test:latest --format "{{.Size}}"') do set image_size=%%i
echo [INFO] 镜像大小: !image_size!

REM 运行容器进行基本测试
echo [INFO] 启动测试容器...
for /f "tokens=*" %%i in ('docker run -d --name contract-ledger-test-container -p 8081:80 -p 8082:8080 -e NODE_ENV=production contract-ledger-test:latest') do set container_id=%%i

if errorlevel 1 (
    echo [ERROR] 容器启动失败
    pause
    exit /b 1
)

echo [SUCCESS] 容器启动成功 (ID: !container_id:~0,12!)

REM 等待服务启动
echo [INFO] 等待服务启动...
timeout /t 30 /nobreak >nul

REM 测试健康检查
echo [INFO] 测试健康检查端点...
curl -f http://localhost:8081/health >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] 健康检查通过
) else (
    echo [WARNING] 健康检查失败，查看容器日志:
    docker logs contract-ledger-test-container --tail 20
)

REM 清理测试容器
echo [INFO] 清理测试容器...
docker stop contract-ledger-test-container >nul 2>&1
docker rm contract-ledger-test-container >nul 2>&1

goto :show_build_info

:test_only
echo [INFO] 只运行测试模式
goto :test_image

:show_build_info
echo.
echo [SUCCESS] === 构建信息 ===
echo 镜像名称: contract-ledger-test:latest
for /f "tokens=*" %%i in ('docker images contract-ledger-test:latest --format "{{.Size}}"') do echo 镜像大小: %%i
for /f "tokens=*" %%i in ('docker images contract-ledger-test:latest --format "{{.CreatedAt}}"') do echo 创建时间: %%i
echo.
echo 测试命令:
echo   docker run -d -p 80:80 -p 8080:8080 contract-ledger-test:latest
echo.
echo 访问地址:
echo   前端: http://localhost
echo   健康检查: http://localhost/health
echo.
echo [SUCCESS] Docker构建测试完成！
pause
goto :end

:show_help
echo 用法: %0 [选项]
echo 选项:
echo   --help, -h    显示帮助
echo   --test-only   只运行测试，不重新构建
echo.
pause
goto :end

:end
endlocal
