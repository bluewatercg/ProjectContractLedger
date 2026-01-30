@echo off
echo ========================================
echo   启动本地测试环境
echo ========================================
echo.

echo [1/3] 检查环境配置...
if not exist "apps\backend\.env" (
    echo 错误: 后端环境配置文件不存在
    pause
    exit /b 1
)
echo ✓ 环境配置正常

echo.
echo [2/3] 启动后端服务 (端口 8010)...
cd apps\backend
start "Contract-Ledger-Backend" cmd /k "echo 后端服务启动中... && yarn dev"
cd ..\..

echo.
echo 等待后端服务启动...
timeout /t 5 /nobreak > nul

echo.
echo [3/3] 启动前端服务 (端口 8000)...
cd apps\frontend
start "Contract-Ledger-Frontend" cmd /k "echo 前端服务启动中... && yarn dev"
cd ..\..

echo.
echo ========================================
echo   服务启动完成！
echo ========================================
echo.
echo 前端地址: http://localhost:8000
echo 后端地址: http://localhost:8010
echo 健康检查: http://localhost:8010/health
echo.
echo 默认登录账号:
echo   用户名: admin
echo   密码: admin123
echo.
echo 测试新功能:
echo   1. 客户管理 - 新建客户时选择套账
echo   2. 合同管理 - 创建合同自动继承客户套账
echo   3. 发票管理 - 创建发票自动继承合同套账
echo   4. 支付管理 - 记录支付自动继承发票套账
echo   5. 列表页面 - 打开"查看全部套账"开关
echo.
echo 按任意键打开浏览器...
pause > nul

start http://localhost:8000

echo.
echo 提示: 关闭此窗口不会停止服务
echo 要停止服务，请关闭后端和前端的命令行窗口
echo.
pause
