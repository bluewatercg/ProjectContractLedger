@echo off
setlocal enabledelayedexpansion

REM 快速启动脚本 - 客户合同管理系统 (Windows版本)

echo === 客户合同管理系统 - 快速启动 ===
echo 时间: %date% %time%
echo.

REM 检查Docker是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 未安装，请先安装 Docker Desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose 未安装，请先安装 Docker Compose
    pause
    exit /b 1
)

echo [SUCCESS] Docker 环境检查通过

REM 处理命令行参数
if "%1"=="--help" goto :show_help
if "%1"=="-h" goto :show_help
if "%1"=="--stop" goto :stop_services
if "%1"=="--logs" goto :show_logs
if "%1"=="--status" goto :show_status
if "%1"=="--prod" (
    set COMPOSE_FILE=docker-compose.prod.yml
    echo [INFO] 使用生产环境配置
) else (
    set COMPOSE_FILE=docker-compose.yml
    echo [INFO] 使用开发环境配置
)

REM 检查端口占用（简化版）
echo [INFO] 检查端口占用...
netstat -an | findstr ":80 " >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] 端口 80 可能被占用
)

netstat -an | findstr ":3306 " >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] 端口 3306 可能被占用
)

netstat -an | findstr ":8080 " >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] 端口 8080 可能被占用
)

REM 停止可能存在的旧容器
echo [INFO] 清理旧容器...
docker-compose down >nul 2>&1

REM 构建并启动服务
echo [INFO] 构建镜像（这可能需要几分钟）...
docker-compose build --no-cache
if errorlevel 1 (
    echo [ERROR] 镜像构建失败
    pause
    exit /b 1
)

echo [INFO] 启动服务...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] 服务启动失败
    pause
    exit /b 1
)

echo [SUCCESS] 服务启动完成

REM 等待服务就绪
echo [INFO] 等待服务启动...
timeout /t 10 /nobreak >nul

REM 等待应用服务（简化版检查）
echo [INFO] 等待应用服务启动...
set /a count=0
:wait_loop
set /a count+=1
if !count! gtr 30 (
    echo [ERROR] 应用服务启动超时
    goto :show_logs_and_exit
)

REM 使用curl检查健康状态（如果可用）
curl -s http://localhost/health >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] 应用服务已就绪
    goto :show_info
)

timeout /t 2 /nobreak >nul
goto :wait_loop

:show_info
echo.
echo [SUCCESS] === 服务启动成功 ===
echo.
echo 📱 前端应用:     http://localhost
echo 🔧 API文档:      http://localhost/api-docs
echo ❤️  健康检查:    http://localhost/health
echo 🗄️  数据库:      localhost:3306
echo.
echo 默认登录信息:
echo   用户名: admin
echo   密码: admin123
echo.
echo [INFO] 查看日志: docker-compose logs -f
echo [INFO] 停止服务: docker-compose down
echo [INFO] 重启服务: docker-compose restart
echo.
echo 按任意键打开浏览器...
pause >nul
start http://localhost
goto :end

:show_help
echo 用法: %0 [选项]
echo.
echo 选项:
echo   -h, --help     显示帮助信息
echo   --prod         生产模式启动
echo   --stop         停止所有服务
echo   --logs         查看服务日志
echo   --status       查看服务状态
echo.
pause
goto :end

:stop_services
echo [INFO] 停止服务...
docker-compose down
echo [SUCCESS] 服务已停止
pause
goto :end

:show_logs
docker-compose logs -f
goto :end

:show_status
echo === 服务状态 ===
docker-compose ps
echo.
echo === 健康检查 ===
curl -s http://localhost/health 2>nul || echo 健康检查失败
pause
goto :end

:show_logs_and_exit
echo.
echo [INFO] 查看服务日志以了解详细信息:
docker-compose logs
pause
exit /b 1

:end
endlocal
