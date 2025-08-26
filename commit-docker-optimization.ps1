# Docker构建优化配置提交脚本 - PowerShell版本

Write-Host "=== Docker构建优化配置提交 ===" -ForegroundColor Green

# 检查git状态
Write-Host "检查当前git状态..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "添加修改的文件到暂存区..." -ForegroundColor Yellow

# 添加优化后的Dockerfile
git add apps/backend/Dockerfile
git add apps/frontend/Dockerfile

# 添加新的.dockerignore文件
git add apps/backend/.dockerignore
git add apps/frontend/.dockerignore

# 添加ARM64优化版本
git add apps/backend/Dockerfile.arm64

# 添加优化后的GitHub Actions工作流
git add .github/workflows/docker-build-push.yml
git add .github/workflows/docker-build-fallback.yml

# 添加调试脚本
git add tools/docker/debug-build.sh
git add tools/docker/debug-build.bat

Write-Host ""
Write-Host "查看即将提交的更改..." -ForegroundColor Yellow
git diff --cached --name-only

Write-Host ""
Write-Host "提交更改..." -ForegroundColor Yellow
git commit -m @"
优化Docker构建配置解决ARM64架构构建失败问题

主要改进:
- 优化Dockerfile: 增加网络超时时间、重试机制和错误处理
- 改进GitHub Actions: 添加构建参数优化和provenance配置
- 新增备用构建策略: 支持单平台AMD64构建
- 创建ARM64专用Dockerfile: 针对ARM64架构优化
- 添加专门的.dockerignore: 减少构建上下文大小
- 提供调试工具: 本地构建调试脚本

修复问题:
- 解决yarn安装依赖网络超时问题
- 优化ARM64架构模拟构建性能
- 增强构建过程的容错性和稳定性
"@

Write-Host ""
Write-Host "推送到远程仓库..." -ForegroundColor Yellow
git push

Write-Host ""
Write-Host "=== 提交完成 ===" -ForegroundColor Green
Write-Host "请到GitHub Actions页面查看构建结果:" -ForegroundColor Cyan
Write-Host "https://github.com/bluewatercg/projectcontractledger/actions" -ForegroundColor Blue

Read-Host "按任意键继续..."