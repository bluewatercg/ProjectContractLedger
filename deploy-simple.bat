@echo off
REM 简化部署脚本 - Windows版本
REM 使用外部MySQL和Redis，镜像由GitHub Actions自动构建

setlocal enabledelayedexpansion

REM 脚本配置
set "SCRIPT_DIR=%~dp0"
set "ENV_FILE=.env.external-simple"
set "COMPOSE_FILE=docker-compose.external-simple.yml"
set "GITHUB_REPO=bluewatercg/projectcontractledger"
set "GITHUB_RAW_URL=https://raw.githubusercontent.com/%GITHUB_REPO%/main"

REM 颜色定义（Windows不支持颜色，使用简单文本）
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

REM 显示帮助信息
if "%1"=="--help" goto :show_help
if "%1"=="-h" goto :show_help

REM 检查参数
if "%1"=="--init" goto :init_deployment
if "%1"=="--check" goto :check_environment
if "%1"=="--pull" goto :pull_images
if "%1"=="--restart" goto :restart_services
if "%1"=="--stop" goto :stop_services
if "%1"=="--logs" goto :show_logs
if "%1"=="--status" goto :show_status

REM 默认部署流程
goto :main_deploy

:show_help
echo 简化部署脚本 - 客户合同管理系统 (Windows版本)
echo 镜像由GitHub Actions自动构建，本地只负责拉取和运行
echo.
echo 使用方法:
echo   %~nx0 [选项]
echo.
echo 选项:
echo   -h, --help     显示此帮助信息
echo   --init         初始化部署环境（下载配置文件）
echo   --check        仅检查环境配置
echo   --pull         仅拉取最新镜像
echo   --restart      重启服务
echo   --stop         停止服务
echo   --logs         查看服务日志
echo   --status       查看服务状态
echo.
echo 环境要求:
echo   - Docker 和 Docker Compose
echo   - 外部MySQL服务器
echo   - 外部Redis服务器
echo   - 配置文件: %ENV_FILE%
echo.
echo 首次部署:
echo   1. %~nx0 --init     # 下载配置文件
echo   2. 编辑 %ENV_FILE% 文件，填写MySQL和Redis配置
echo   3. %~nx0            # 启动服务
goto :eof

:init_deployment
echo %INFO% 初始化部署环境...

REM 下载docker-compose文件
if not exist "%SCRIPT_DIR%%COMPOSE_FILE%" (
    echo %INFO% 下载 %COMPOSE_FILE%...
    powershell -Command "Invoke-WebRequest -Uri '%GITHUB_RAW_URL%/%COMPOSE_FILE%' -OutFile '%SCRIPT_DIR%%COMPOSE_FILE%'"
    if !errorlevel! equ 0 (
        echo %SUCCESS% 已下载 %COMPOSE_FILE%
    ) else (
        echo %ERROR% 下载 %COMPOSE_FILE% 失败
        goto :eof
    )
) else (
    echo %INFO% %COMPOSE_FILE% 已存在
)

REM 下载环境变量模板
if not exist "%SCRIPT_DIR%%ENV_FILE%" (
    echo %INFO% 下载环境变量模板...
    powershell -Command "Invoke-WebRequest -Uri '%GITHUB_RAW_URL%/.env.external-simple.template' -OutFile '%SCRIPT_DIR%%ENV_FILE%'"
    if !errorlevel! equ 0 (
        echo %SUCCESS% 已下载环境变量模板为 %ENV_FILE%
        echo %WARNING% 请编辑 %ENV_FILE% 文件，填写MySQL和Redis配置
    ) else (
        echo %ERROR% 下载环境变量模板失败
        goto :eof
    )
) else (
    echo %INFO% %ENV_FILE% 已存在
)

echo %SUCCESS% 部署环境初始化完成
goto :eof

:check_dependencies
echo %INFO% 检查系统依赖...

REM 检查Docker
docker --version >nul 2>&1
if !errorlevel! neq 0 (
    echo %ERROR% Docker 未安装，请先安装 Docker
    exit /b 1
)

REM 检查Docker Compose
docker-compose --version >nul 2>&1
if !errorlevel! neq 0 (
    echo %ERROR% Docker Compose 未安装，请先安装 Docker Compose
    exit /b 1
)

echo %SUCCESS% 系统依赖检查通过
goto :eof

:check_environment
call :check_dependencies
if !errorlevel! neq 0 exit /b 1

echo %INFO% 检查环境配置...

if not exist "%SCRIPT_DIR%%ENV_FILE%" (
    echo %ERROR% 环境配置文件 %ENV_FILE% 不存在
    echo %INFO% 请运行 %~nx0 --init 初始化部署环境
    exit /b 1
)

echo %SUCCESS% 环境配置检查通过
goto :eof

:pull_images
call :check_environment
if !errorlevel! neq 0 exit /b 1

echo %INFO% 拉取最新镜像...
cd /d "%SCRIPT_DIR%"
docker-compose -f "%COMPOSE_FILE%" --env-file "%ENV_FILE%" pull
if !errorlevel! equ 0 (
    echo %SUCCESS% 镜像拉取完成
) else (
    echo %ERROR% 镜像拉取失败
    exit /b 1
)
goto :eof

:start_services
echo %INFO% 启动服务...
cd /d "%SCRIPT_DIR%"
docker-compose -f "%COMPOSE_FILE%" --env-file "%ENV_FILE%" up -d
if !errorlevel! equ 0 (
    echo %SUCCESS% 服务启动完成
    echo %INFO% 等待服务就绪...
    timeout /t 10 /nobreak >nul
    call :show_service_info
) else (
    echo %ERROR% 服务启动失败
    exit /b 1
)
goto :eof

:stop_services
echo %INFO% 停止服务...
cd /d "%SCRIPT_DIR%"
docker-compose -f "%COMPOSE_FILE%" down
echo %SUCCESS% 服务已停止
goto :eof

:restart_services
call :stop_services
call :start_services
goto :eof

:show_logs
cd /d "%SCRIPT_DIR%"
docker-compose -f "%COMPOSE_FILE%" logs -f
goto :eof

:show_status
echo %INFO% 服务状态检查...
cd /d "%SCRIPT_DIR%"

echo.
echo === 容器状态 ===
docker-compose -f "%COMPOSE_FILE%" ps

echo.
echo === 访问地址 ===
echo 前端应用: http://localhost:80
echo 后端API:  http://localhost:8080
echo 健康检查: http://localhost/health
echo API文档:  http://localhost/api-docs
goto :eof

:show_service_info
echo.
echo %SUCCESS% === 服务部署完成 ===
echo.
echo 访问地址:
echo   前端应用: http://localhost:80
echo   后端API:  http://localhost:8080
echo   健康检查: http://localhost/health
echo   API文档:  http://localhost/api-docs
echo.
echo 管理命令:
echo   查看日志: %~nx0 --logs
echo   重启服务: %~nx0 --restart
echo   停止服务: %~nx0 --stop
echo   查看状态: %~nx0 --status
echo.
goto :eof

:main_deploy
call :check_environment
if !errorlevel! neq 0 exit /b 1

call :pull_images
if !errorlevel! neq 0 exit /b 1

call :start_services
goto :eof

endlocal
