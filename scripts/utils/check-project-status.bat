@echo off
echo Project Status Check
echo ===================

echo.
echo Checking project structure...

REM Check main directories
echo Main directories:
if exist "apps" (echo [OK] apps/) else (echo [MISSING] apps/)
if exist "apps\backend" (echo [OK] apps\backend/) else (echo [MISSING] apps\backend/)
if exist "apps\frontend" (echo [OK] apps\frontend/) else (echo [MISSING] apps\frontend/)
if exist "database" (echo [OK] database/) else (echo [MISSING] database/)
if exist "docs" (echo [OK] docs/) else (echo [MISSING] docs/)
if exist "scripts" (echo [OK] scripts/) else (echo [MISSING] scripts/)
if exist "testing" (echo [OK] testing/) else (echo [MISSING] testing/)
if exist "tools" (echo [OK] tools/) else (echo [MISSING] tools/)

echo.
echo 📦 检查依赖安装状态...

REM 检查依赖
if exist "apps\backend\node_modules" (
    echo ✅ 后端依赖已安装
) else (
    echo ❌ 后端依赖未安装
)

if exist "apps\frontend\node_modules" (
    echo ✅ 前端依赖已安装
) else (
    echo ❌ 前端依赖未安装
)

echo.
echo 🔧 检查配置文件...

REM 检查配置文件
if exist "package.json" (echo ✅ package.json) else (echo ❌ package.json)
if exist "apps\backend\package.json" (echo ✅ 后端 package.json) else (echo ❌ 后端 package.json)
if exist "apps\frontend\package.json" (echo ✅ 前端 package.json) else (echo ❌ 前端 package.json)

echo.
echo 📜 检查启动脚本...

REM 检查启动脚本
if exist "scripts\dev\start-dev.bat" (echo ✅ start-dev.bat) else (echo ❌ start-dev.bat)
if exist "scripts\dev\start-dev.ps1" (echo ✅ start-dev.ps1) else (echo ❌ start-dev.ps1)
if exist "scripts\dev\start-dev.sh" (echo ✅ start-dev.sh) else (echo ❌ start-dev.sh)
if exist "scripts\dev\start-simple.bat" (echo ✅ start-simple.bat) else (echo ❌ start-simple.bat)

echo.
echo 🐳 检查Docker配置...

REM 检查Docker配置
if exist "tools\docker\Dockerfile" (echo ✅ Dockerfile) else (echo ❌ Dockerfile)
if exist "tools\docker\docker-compose.yml" (echo ✅ docker-compose.yml) else (echo ❌ docker-compose.yml)

echo.
echo 📚 检查文档...

REM 检查文档
if exist "docs\user-guide\启动指南.md" (echo ✅ 启动指南) else (echo ❌ 启动指南)
if exist "docs\user-guide\项目结构说明-新版.md" (echo ✅ 项目结构说明) else (echo ❌ 项目结构说明)
if exist "docs\user-guide\Yarn命令指南.md" (echo ✅ Yarn命令指南) else (echo ❌ Yarn命令指南)

echo.
echo 🚀 可用的yarn命令：
echo   yarn install-all    # 安装所有依赖
echo   yarn start-ps       # 启动开发环境 (PowerShell)
echo   yarn start          # 启动开发环境 (批处理)
echo   yarn build-all      # 构建所有应用
echo   yarn clean          # 清理项目
echo   yarn test-login     # 测试登录
echo   yarn apply-indexes  # 应用数据库索引

echo.
echo 检查完成！
pause
