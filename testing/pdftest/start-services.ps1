# PDF Base64 代理服务启动脚本
# 同时启动前端Vue应用和后端PDF代理服务器

Write-Host "🚀 启动 PDF Base64 代理服务..." -ForegroundColor Green
Write-Host "=" * 50

# 检查Node.js是否安装
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误: 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按回车键退出"
    exit 1
}

# 检查npm依赖是否安装
if (!(Test-Path "node_modules")) {
    Write-Host "📦 首次运行，正在安装依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        Read-Host "按回车键退出"
        exit 1
    }
    Write-Host "✅ 依赖安装完成" -ForegroundColor Green
}

# 停止已存在的Node.js进程
Write-Host "🔄 停止已存在的服务..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 启动后端PDF代理服务器
Write-Host "🌐 启动后端PDF代理服务器 (端口3003)..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node pdf-base64-server.js
}

# 等待后端服务启动
Start-Sleep -Seconds 3

# 检查后端服务是否启动成功
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3003" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ 后端服务启动成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 后端服务启动失败" -ForegroundColor Red
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Read-Host "按回车键退出"
    exit 1
}

# 启动前端Vue应用
Write-Host "⚡ 启动前端Vue应用 (端口3001)..." -ForegroundColor Magenta
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
}

# 等待前端服务启动
Start-Sleep -Seconds 5

# 检查前端服务是否启动成功
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ 前端服务启动成功" -ForegroundColor Green
} catch {
    Write-Host "⚠️  前端服务可能仍在启动中..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 服务启动完成!" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "📋 服务信息:"
Write-Host "  🔗 前端Vue应用: http://localhost:3001" -ForegroundColor Cyan
Write-Host "  🔗 后端API服务: http://localhost:3003" -ForegroundColor Cyan
Write-Host "  📄 静态测试页: http://localhost:3003" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 使用说明:"
Write-Host "  • 主要使用Vue前端: http://localhost:3001"
Write-Host "  • 也可使用静态页面: http://localhost:3003"
Write-Host "  • 两个页面功能相同，Vue版本更现代"
Write-Host ""
Write-Host "🔧 功能特性:"
Write-Host "  ✅ Base64编码防IDM拦截"
Write-Host "  ✅ 支持本地和外部PDF文件"
Write-Host "  ✅ CORS跨域支持"
Write-Host "  ✅ 响应式Vue3界面"
Write-Host ""

# 显示实时日志选项
Write-Host "📊 选择操作:" -ForegroundColor Yellow
Write-Host "  1. 查看后端日志"
Write-Host "  2. 查看前端日志" 
Write-Host "  3. 打开前端页面"
Write-Host "  4. 打开静态页面"
Write-Host "  5. 停止所有服务"
Write-Host "  6. 保持后台运行"

do {
    $choice = Read-Host "请选择 (1-6)"
    
    switch ($choice) {
        "1" {
            Write-Host "📋 后端日志 (Ctrl+C 返回菜单):" -ForegroundColor Cyan
            Receive-Job $backendJob -Wait
        }
        "2" {
            Write-Host "📋 前端日志 (Ctrl+C 返回菜单):" -ForegroundColor Magenta
            Receive-Job $frontendJob -Wait
        }
        "3" {
            Write-Host "🌐 正在打开前端页面..." -ForegroundColor Green
            Start-Process "http://localhost:3001"
        }
        "4" {
            Write-Host "🌐 正在打开静态页面..." -ForegroundColor Green
            Start-Process "http://localhost:3003"
        }
        "5" {
            Write-Host "🛑 正在停止所有服务..." -ForegroundColor Red
            Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
            Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
            Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
            Write-Host "✅ 所有服务已停止" -ForegroundColor Green
            exit 0
        }
        "6" {
            Write-Host "🔄 服务将在后台继续运行..." -ForegroundColor Green
            Write-Host "💡 要停止服务，请运行: Get-Process -Name node | Stop-Process -Force" -ForegroundColor Yellow
            exit 0
        }
        default {
            Write-Host "❌ 无效选择，请输入 1-6" -ForegroundColor Red
        }
    }
} while ($true)