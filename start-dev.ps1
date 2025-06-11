# PowerShell 启动脚本 - 客户合同管理系统
Write-Host "启动客户合同管理系统 - Midway版本" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 检查 Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "错误: 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
    pause
    exit 1
}

# 检查 Yarn
try {
    $yarnVersion = yarn --version
    Write-Host "Yarn 版本: $yarnVersion" -ForegroundColor Cyan
} catch {
    Write-Host "警告: 未找到 Yarn，将使用 npm" -ForegroundColor Yellow
    $useNpm = $true
}

Write-Host ""

# 安装后端依赖
if (-not (Test-Path "midway-backend\node_modules")) {
    Write-Host "正在安装后端依赖..." -ForegroundColor Yellow
    Set-Location "midway-backend"
    if ($useNpm) {
        npm install
    } else {
        yarn install
    }
    Set-Location ".."
    Write-Host "后端依赖安装完成" -ForegroundColor Green
}

# 安装前端依赖
if (-not (Test-Path "midway-frontend\node_modules")) {
    Write-Host "正在安装前端依赖..." -ForegroundColor Yellow
    Set-Location "midway-frontend"
    if ($useNpm) {
        npm install
    } else {
        yarn install
    }
    Set-Location ".."
    Write-Host "前端依赖安装完成" -ForegroundColor Green
}

Write-Host ""
Write-Host "启动服务..." -ForegroundColor Yellow

# 启动后端服务
Write-Host "1. 启动后端服务 (端口: 8080)..." -ForegroundColor Cyan
Set-Location "midway-backend"
if ($useNpm) {
    Start-Process -FilePath "cmd" -ArgumentList "/k", "npm run dev" -WindowStyle Normal
} else {
    Start-Process -FilePath "cmd" -ArgumentList "/k", "yarn dev" -WindowStyle Normal
}
Set-Location ".."

# 等待后端启动
Write-Host "等待后端服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 启动前端服务
Write-Host "2. 启动前端服务 (端口: 8000)..." -ForegroundColor Cyan
Set-Location "midway-frontend"
if ($useNpm) {
    Start-Process -FilePath "cmd" -ArgumentList "/k", "npm run dev" -WindowStyle Normal
} else {
    Start-Process -FilePath "cmd" -ArgumentList "/k", "yarn dev" -WindowStyle Normal
}
Set-Location ".."

Write-Host ""
Write-Host "服务启动完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "前端地址: http://localhost:8000" -ForegroundColor White
Write-Host "后端地址: http://localhost:8080" -ForegroundColor White
Write-Host "API文档:  http://localhost:8080/api-docs" -ForegroundColor White
Write-Host ""
Write-Host "数据库信息:" -ForegroundColor Cyan
Write-Host "主机: mysql.sqlpub.com:3306" -ForegroundColor White
Write-Host "数据库: procontractledger" -ForegroundColor White
Write-Host ""
Write-Host "默认登录账户:" -ForegroundColor Cyan
Write-Host "用户名: admin" -ForegroundColor White
Write-Host "密码: admin123" -ForegroundColor White
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
