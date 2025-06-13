@echo off
REM 代码格式化脚本 - Windows版本

setlocal enabledelayedexpansion

echo === 代码格式化工具 ===
echo 修复后端和前端的代码格式问题
echo.

REM 检查是否在项目根目录
if not exist "midway-backend" (
    echo 错误: 请在项目根目录运行此脚本
    exit /b 1
)
if not exist "midway-frontend" (
    echo 错误: 请在项目根目录运行此脚本
    exit /b 1
)

REM 修复后端代码格式
echo === 修复后端代码格式 ===
cd midway-backend

if not exist "node_modules" (
    echo 安装后端依赖...
    yarn install
    if !errorlevel! neq 0 (
        echo 后端依赖安装失败
        exit /b 1
    )
)

echo 运行后端代码格式化...
yarn lint:fix
if !errorlevel! neq 0 (
    echo 后端代码格式化失败
    exit /b 1
)

echo 检查后端代码格式...
yarn lint
if !errorlevel! equ 0 (
    echo ✅ 后端代码格式检查通过
) else (
    echo ❌ 后端代码格式仍有问题，请手动检查
)

cd ..

REM 修复前端代码格式
echo.
echo === 修复前端代码格式 ===
cd midway-frontend

if not exist "node_modules" (
    echo 安装前端依赖...
    yarn install
    if !errorlevel! neq 0 (
        echo 前端依赖安装失败
        exit /b 1
    )
)

echo 运行前端代码格式化...
yarn lint
if !errorlevel! neq 0 (
    echo 前端代码格式化失败
    exit /b 1
)

echo ✅ 前端代码格式化完成

cd ..

echo.
echo === 格式化完成 ===
echo 所有代码格式问题已修复，可以提交代码了
echo.
echo 提交命令:
echo   git add .
echo   git commit -m "fix: 修复代码格式问题"
echo   git push

endlocal
