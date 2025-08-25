# 停止 PDF Base64 代理服务

Write-Host "🛑 停止 PDF Base64 代理服务..." -ForegroundColor Red

# 停止所有Node.js进程
$processes = Get-Process -Name node -ErrorAction SilentlyContinue

if ($processes) {
    Write-Host "发现 $($processes.Count) 个Node.js进程，正在停止..." -ForegroundColor Yellow
    $processes | Stop-Process -Force
    Write-Host "✅ 所有Node.js服务已停止" -ForegroundColor Green
} else {
    Write-Host "✅ 没有发现运行中的Node.js服务" -ForegroundColor Green
}

# 显示端口占用情况
Write-Host ""
Write-Host "📋 检查端口占用情况:" -ForegroundColor Cyan

$port3001 = netstat -an | Select-String ":3001"
$port3003 = netstat -an | Select-String ":3003"

if ($port3001) {
    Write-Host "⚠️  端口3001仍被占用" -ForegroundColor Yellow
} else {
    Write-Host "✅ 端口3001已释放" -ForegroundColor Green
}

if ($port3003) {
    Write-Host "⚠️  端口3003仍被占用" -ForegroundColor Yellow  
} else {
    Write-Host "✅ 端口3003已释放" -ForegroundColor Green
}

Write-Host ""
Read-Host "按回车键退出"