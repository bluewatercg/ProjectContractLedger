# PDF Base64 代理服务 - 快速启动脚本
# 一键启动前后端服务

Write-Host "🚀 PDF Base64 代理服务 - 快速启动" -ForegroundColor Green

# 停止已存在的服务
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 启动后端服务 (后台)
Write-Host "🌐 启动后端服务..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "pdf-base64-server.js" -WindowStyle Hidden

# 等待后端启动
Start-Sleep -Seconds 3

# 启动前端服务 (前台)
Write-Host "⚡ 启动前端服务..." -ForegroundColor Magenta
Write-Host ""
Write-Host "📋 访问地址:" -ForegroundColor Yellow
Write-Host "  前端Vue应用: http://localhost:3001" -ForegroundColor Cyan
Write-Host "  后端API/静态页: http://localhost:3003" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 前端服务将在此窗口运行，关闭窗口将停止前端服务"
Write-Host "   后端服务在后台运行，需要手动停止"
Write-Host ""

# 前端服务在前台运行，便于查看日志和停止
npm run dev