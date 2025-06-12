@echo off
setlocal enabledelayedexpansion

REM GitHub Actions 诊断脚本 (Windows版本)

echo === GitHub Actions 诊断工具 ===
echo 时间: %date% %time%
echo.

REM 检查Git配置
echo 1. 检查Git配置
for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set current_branch=%%i
echo 当前分支: !current_branch!

for /f "tokens=*" %%i in ('git remote get-url origin 2^>nul') do set remote_url=%%i
if defined remote_url (
    echo 远程仓库: !remote_url!
) else (
    echo 远程仓库: 未配置
)

for /f "tokens=*" %%i in ('git log --oneline -1 2^>nul') do set last_commit=%%i
if defined last_commit (
    echo 最近提交: !last_commit!
) else (
    echo 最近提交: 无提交记录
)
echo.

REM 检查工作流文件
echo 2. 检查工作流文件
if exist ".github\workflows" (
    echo 工作流目录存在: ✅
    echo 工作流文件:
    dir /b .github\workflows\*.yml .github\workflows\*.yaml 2>nul
) else (
    echo 工作流目录不存在: ❌
    echo 请确保 .github\workflows 目录存在
)
echo.

REM 检查分支配置
echo 3. 检查分支触发配置
echo 当前分支: !current_branch!

if exist ".github\workflows\docker-build-push.yml" (
    echo 检查 docker-build-push.yml 中的分支配置:
    findstr /n "branches:" .github\workflows\docker-build-push.yml
) else (
    echo docker-build-push.yml 不存在
)

if exist ".github\workflows\test-build.yml" (
    echo 检查 test-build.yml 中的分支配置:
    findstr /n "branches:" .github\workflows\test-build.yml
) else (
    echo test-build.yml 不存在
)
echo.

REM 检查提交状态
echo 4. 检查提交和推送状态
git status --porcelain >nul 2>&1
if errorlevel 1 (
    echo Git状态检查失败
) else (
    for /f %%i in ('git status --porcelain ^| find /c /v ""') do set changes=%%i
    if !changes! gtr 0 (
        echo 有未提交的更改: ⚠️
        git status --short
    ) else (
        echo 工作目录干净: ✅
    )
)
echo.

REM 检查Docker文件
echo 5. 检查Docker配置
if exist "Dockerfile" (
    echo Dockerfile存在: ✅
    for /f %%i in ('find /c /v "" ^< Dockerfile') do echo Dockerfile大小: %%i 行
) else (
    echo Dockerfile不存在: ❌
)

if exist "docker-compose.yml" (
    echo docker-compose.yml存在: ✅
) else (
    echo docker-compose.yml不存在: ❌
)
echo.

REM 提供解决建议
echo 6. 解决建议
echo 如果GitHub Actions没有触发，请检查以下项目:
echo.
echo a) 确保当前分支在工作流的触发分支列表中
echo    当前分支: !current_branch!
echo    建议: 将 '!current_branch!' 添加到工作流的 branches 列表中
echo.
echo b) 确保所有更改已提交并推送到GitHub
echo    命令: git add . ^&^& git commit -m "trigger actions" ^&^& git push
echo.
echo c) 检查GitHub仓库设置
echo    - 访问仓库的 Settings ^> Actions
echo    - 确保Actions已启用
echo    - 检查工作流权限设置
echo.
echo d) 手动触发工作流（如果支持）
echo    - 访问仓库的 Actions 页面
echo    - 选择工作流并点击 'Run workflow'
echo.
echo e) 查看Actions日志
echo    - 访问仓库的 Actions 页面
echo    - 查看是否有失败的工作流运行
echo.

REM 检查是否需要推送更改
git status --porcelain >nul 2>&1
if not errorlevel 1 (
    for /f %%i in ('git status --porcelain ^| find /c /v ""') do set changes=%%i
    if !changes! gtr 0 (
        echo.
        echo ⚠️  检测到未提交的更改，是否现在提交并推送？
        set /p commit_choice="输入 y 提交并推送，或按任意键跳过: "
        if /i "!commit_choice!"=="y" (
            echo.
            echo 提交更改...
            git add .
            git commit -m "Update GitHub Actions configuration"
            echo 推送到远程仓库...
            git push
            echo.
            echo ✅ 更改已推送，请检查GitHub Actions是否触发
        )
    )
)

echo.
echo === 诊断完成 ===
echo.
echo 💡 提示: 如果问题仍然存在，请：
echo 1. 检查GitHub仓库的Actions页面是否有错误信息
echo 2. 确认仓库的Actions权限设置正确
echo 3. 尝试手动触发工作流进行测试
echo.
pause
