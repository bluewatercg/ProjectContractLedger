@echo off
chcp 65001 > nul
echo 启动客户合同管理系统 - Midway版本
echo =====================================

echo.
echo 检查依赖安装...
if not exist "midway-backend\node_modules" (
    echo 正在安装后端依赖...
    cd midway-backend
    call yarn install
    cd ..
)

if not exist "midway-frontend\node_modules" (
    echo 正在安装前端依赖...
    cd midway-frontend
    call yarn install
    cd ..
)

echo.
echo 1. 启动后端服务...
cd midway-backend
start "Midway Backend - Port 8080" cmd /k "yarn dev"

echo.
echo 2. 等待5秒后启动前端服务...
timeout /t 5 /nobreak > nul

cd ..\midway-frontend
start "Midway Frontend - Port 8000" cmd /k "yarn dev"

echo.
echo 服务启动完成！
echo =====================================
echo 前端地址: http://localhost:8000
echo 后端地址: http://localhost:8080
echo API文档: http://localhost:8080/api-docs
echo.
echo 数据库信息:
echo 主机: mysql.sqlpub.com:3306
echo 数据库: procontractledger
echo.
echo 默认登录账户:
echo 用户名: admin
echo 密码: admin123
echo.
pause
