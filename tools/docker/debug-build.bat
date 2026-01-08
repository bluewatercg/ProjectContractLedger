@echo off
REM Docker构建调试脚本 - Windows版本

echo === Docker构建调试脚本 ===

REM 检查Docker环境
echo 检查Docker环境...
docker --version
docker buildx version

REM 设置变量
set BACKEND_DIR=apps\backend
set FRONTEND_DIR=apps\frontend
set TAG_SUFFIX=%date:~0,4%%date:~5,2%%date:~8,2%%time:~0,2%%time:~3,2%%time:~6,2%
set TAG_SUFFIX=%TAG_SUFFIX: =0%

echo 使用标签后缀: %TAG_SUFFIX%

REM 检查项目结构
if not exist "%BACKEND_DIR%" (
    echo 错误：找不到后端目录 %BACKEND_DIR%
    exit /b 1
)

if not exist "%FRONTEND_DIR%" (
    echo 错误：找不到前端目录 %FRONTEND_DIR%
    exit /b 1
)

REM 构建后端
echo.
echo === 构建后端应用 ===
cd %BACKEND_DIR%

echo 后端构建上下文大小：
dir /s

echo 检查关键文件：
if exist package.json (
    echo package.json 存在
) else (
    echo 错误：package.json 不存在
    cd ..
    exit /b 1
)

if exist yarn.lock (
    echo yarn.lock 存在
) else (
    echo 警告：yarn.lock 不存在
)

echo 尝试AMD64构建...
docker buildx build ^
    --platform linux/amd64 ^
    --file Dockerfile ^
    --tag test-backend:amd64-%TAG_SUFFIX% ^
    --progress=plain ^
    --no-cache ^
    .

if %ERRORLEVEL% neq 0 (
    echo 后端AMD64构建失败
    cd ..
    exit /b 1
)

echo 后端AMD64构建成功

REM 如果存在ARM64版本的Dockerfile，尝试构建
if exist Dockerfile.arm64 (
    echo 尝试ARM64构建...
    timeout /t 1800 docker buildx build ^
        --platform linux/arm64 ^
        --file Dockerfile.arm64 ^
        --tag test-backend:arm64-%TAG_SUFFIX% ^
        --progress=plain ^
        --no-cache ^
        .
    
    if %ERRORLEVEL% equ 0 (
        echo 后端ARM64构建成功
    ) else (
        echo 后端ARM64构建失败或超时
    )
)

cd ..

REM 构建前端
echo.
echo === 构建前端应用 ===
cd %FRONTEND_DIR%

echo 前端构建上下文大小：
dir /s

echo 检查关键文件：
if exist package.json (
    echo package.json 存在
) else (
    echo 错误：package.json 不存在
    cd ..
    exit /b 1
)

echo 尝试AMD64构建...
docker buildx build ^
    --platform linux/amd64 ^
    --file Dockerfile ^
    --tag test-frontend:amd64-%TAG_SUFFIX% ^
    --progress=plain ^
    --no-cache ^
    .

if %ERRORLEVEL% neq 0 (
    echo 前端AMD64构建失败
    cd ..
    exit /b 1
)

echo 前端AMD64构建成功

cd ..

echo.
echo === 所有构建完成！===

REM 显示镜像信息
echo 构建的镜像：
docker images | findstr "test-"

REM 询问是否清理测试镜像
set /p cleanup=是否清理测试镜像？(y/N): 
if /i "%cleanup%"=="y" (
    echo 清理测试镜像...
    for /f "tokens=3" %%i in ('docker images ^| findstr "test-"') do docker rmi %%i
    echo 清理完成
)

echo 脚本执行完成
pause