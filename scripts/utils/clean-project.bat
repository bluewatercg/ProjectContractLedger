@echo off
chcp 65001 > nul
echo 清理项目依赖和构建文件
echo ========================

echo.
echo 正在清理以下内容：
echo - 根目录 node_modules
echo - 根目录 yarn.lock
echo - 后端 node_modules 和 yarn.lock
echo - 前端 node_modules 和 yarn.lock
echo - 后端 dist 目录
echo - 前端 dist 目录

echo.
set /p confirm=确认清理？(y/N): 
if /i not "%confirm%"=="y" (
    echo 取消清理操作
    pause
    exit /b 0
)

echo.
echo 开始清理...

REM 清理根目录
if exist "node_modules" (
    echo 删除根目录 node_modules...
    rmdir /s /q "node_modules"
)

if exist "yarn.lock" (
    echo 删除根目录 yarn.lock...
    del "yarn.lock"
)

REM 清理后端
if exist "apps\backend\node_modules" (
    echo 删除后端 node_modules...
    rmdir /s /q "apps\backend\node_modules"
)

if exist "apps\backend\yarn.lock" (
    echo 删除后端 yarn.lock...
    del "apps\backend\yarn.lock"
)

if exist "apps\backend\dist" (
    echo 删除后端 dist...
    rmdir /s /q "apps\backend\dist"
)

REM 清理前端
if exist "apps\frontend\node_modules" (
    echo 删除前端 node_modules...
    rmdir /s /q "apps\frontend\node_modules"
)

if exist "apps\frontend\yarn.lock" (
    echo 删除前端 yarn.lock...
    del "apps\frontend\yarn.lock"
)

if exist "apps\frontend\dist" (
    echo 删除前端 dist...
    rmdir /s /q "apps\frontend\dist"
)

echo.
echo ✅ 清理完成！
echo.
echo 现在可以运行以下命令重新安装依赖：
echo   yarn install-all
echo.
pause
