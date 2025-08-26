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

# 添加简化版Dockerfile
git add apps/backend/Dockerfile.simple
git add apps/frontend/Dockerfile.simple

# 添加新的.dockerignore文件
git add apps/backend/.dockerignore
git add apps/frontend/.dockerignore

# 添加ARM64优化版本
git add apps/backend/Dockerfile.arm64

# 添加优化后的GitHub Actions工作流
git add .github/workflows/docker-build-push.yml
git add .github/workflows/docker-build-fallback.yml
git add .github/workflows/emergency-docker-fix.yml

# 添加调试脚本
git add tools/docker/debug-build.sh
git add tools/docker/debug-build.bat

# 添加文档
git add DOCKER_BUILD_OPTIMIZATION.md

Write-Host ""
Write-Host "查看即将提交的更改..." -ForegroundColor Yellow
git diff --cached --name-only

Write-Host ""
Write-Host "提交更改..." -ForegroundColor Yellow
git commit -m @"
进一步优化Docker构建配置解决依赖安装失败问题

主要改进:
- 强化Dockerfile: 增加多重安装策略、NPM备用方案、超时机制
- 新增简化版Dockerfile: 提供最基础但可靠的构建方案
- 紧急修复工作流: 多种构建策略选择（保守、NPM、预构建）
- 增强容错机制: 详细的环境检查和错误诊断
- 优化构建流程: 支持Yarn失败时自动切换到NPM

解决问题:
- 修复streams/readable模块异常
- 解决yarn网络流处理错误
- 提供多种备用构建策略
- 增强构建过程的稳定性和可靠性

新增文件:
- apps/backend/Dockerfile.simple: 简化版后端构建
- apps/frontend/Dockerfile.simple: 简化版前端构建
- .github/workflows/emergency-docker-fix.yml: 紧急修复工作流
- DOCKER_BUILD_OPTIMIZATION.md: 完整的优化文档
"@

Write-Host ""
Write-Host "推送到远程仓库..." -ForegroundColor Yellow
git push

Write-Host ""
Write-Host "=== 提交完成 ===" -ForegroundColor Green
Write-Host "请到GitHub Actions页面查看构建结果:" -ForegroundColor Cyan
Write-Host "https://github.com/bluewatercg/projectcontractledger/actions" -ForegroundColor Blue

Read-Host "按任意键继续..."