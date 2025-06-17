#!/bin/bash

# GitHub 构建发布脚本
# 用于触发GitHub Actions构建并发布新版本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 显示脚本信息
show_header() {
    echo "=================================================================="
    echo "                    GitHub 构建发布脚本"
    echo "=================================================================="
    echo "时间: $(date)"
    echo "目标: 触发GitHub Actions构建并发布新版本"
    echo "=================================================================="
    echo ""
}

# 检查Git状态
check_git_status() {
    log_step "检查Git状态..."
    
    # 检查是否在Git仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "当前目录不是Git仓库"
        exit 1
    fi
    
    # 检查当前分支
    CURRENT_BRANCH=$(git branch --show-current)
    log_info "当前分支: $CURRENT_BRANCH"
    
    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        log_warn "检测到未提交的更改"
        git status --short
        echo ""
        read -p "是否继续？(y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "操作已取消"
            exit 0
        fi
    else
        log_info "工作目录干净"
    fi
    
    # 检查远程仓库
    REMOTE_URL=$(git remote get-url origin)
    log_info "远程仓库: $REMOTE_URL"
}

# 检查GitHub Actions配置
check_github_actions() {
    log_step "检查GitHub Actions配置..."
    
    # 检查工作流文件
    if [ ! -d ".github/workflows" ]; then
        log_error ".github/workflows 目录不存在"
        exit 1
    fi
    
    log_info "GitHub Actions工作流文件:"
    ls -la .github/workflows/*.yml .github/workflows/*.yaml 2>/dev/null || {
        log_error "未找到工作流文件"
        exit 1
    }
    
    # 检查主要工作流
    MAIN_WORKFLOW=".github/workflows/docker-build-push.yml"
    if [ -f "$MAIN_WORKFLOW" ]; then
        log_info "✅ 主构建工作流存在: $MAIN_WORKFLOW"
        
        # 检查分支配置
        log_info "分支触发配置:"
        grep -A 5 "branches:" "$MAIN_WORKFLOW" || log_warn "未找到分支配置"
    else
        log_error "主构建工作流不存在: $MAIN_WORKFLOW"
        exit 1
    fi
}

# 检查修复内容
check_fixes() {
    log_step "检查修复内容..."
    
    # 检查nginx配置修复
    if grep -q "proxy_pass http://backend/api/" tools/nginx/nginx.conf; then
        log_info "✅ nginx代理配置已修复"
    else
        log_warn "⚠️  nginx代理配置可能需要修复"
    fi
    
    # 检查前端API配置
    if grep -q "API_BASE_URL: '/api/v1'" scripts/dev/start.sh; then
        log_info "✅ 前端API配置已修复"
    else
        log_warn "⚠️  前端API配置可能需要修复"
    fi
    
    # 检查环境变量配置
    if grep -q "FRONTEND_API_BASE_URL=/api/v1" .env.production.template; then
        log_info "✅ 环境变量配置已修复"
    else
        log_warn "⚠️  环境变量配置可能需要修复"
    fi
}

# 提交修复内容
commit_fixes() {
    log_step "提交修复内容..."
    
    # 检查是否有更改需要提交
    if git diff-index --quiet HEAD --; then
        log_info "没有新的更改需要提交"
        return 0
    fi
    
    # 显示更改内容
    log_info "待提交的更改:"
    git status --short
    echo ""
    
    # 确认提交
    read -p "是否提交这些更改？(y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "跳过提交"
        return 0
    fi
    
    # 添加所有更改
    git add .
    
    # 提交更改
    COMMIT_MESSAGE="fix: 修复nginx代理配置和API路径问题

- 修复nginx代理配置，解决登录404问题
- 修复前端API基础URL配置
- 修复文件上传路径配置
- 更新健康检查路径
- 移除Docker资源预留配置警告"
    
    git commit -m "$COMMIT_MESSAGE"
    log_info "✅ 更改已提交"
}

# 推送到GitHub
push_to_github() {
    log_step "推送到GitHub..."
    
    CURRENT_BRANCH=$(git branch --show-current)
    
    # 确认推送
    echo ""
    log_info "准备推送到分支: $CURRENT_BRANCH"
    read -p "是否推送到GitHub？(y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "推送已取消"
        return 0
    fi
    
    # 推送到远程仓库
    log_info "推送到远程仓库..."
    git push origin "$CURRENT_BRANCH"
    
    if [ $? -eq 0 ]; then
        log_info "✅ 推送成功"
    else
        log_error "❌ 推送失败"
        exit 1
    fi
}

# 创建版本标签（可选）
create_version_tag() {
    log_step "创建版本标签（可选）..."
    
    echo ""
    read -p "是否创建版本标签？(y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "跳过版本标签创建"
        return 0
    fi
    
    # 获取版本号
    echo ""
    read -p "请输入版本号 (例如: v1.0.1): " VERSION_TAG
    
    if [ -z "$VERSION_TAG" ]; then
        log_warn "版本号为空，跳过标签创建"
        return 0
    fi
    
    # 创建标签
    git tag -a "$VERSION_TAG" -m "Release $VERSION_TAG - 修复nginx代理和API路径问题"
    
    # 推送标签
    git push origin "$VERSION_TAG"
    
    if [ $? -eq 0 ]; then
        log_info "✅ 版本标签 $VERSION_TAG 创建并推送成功"
    else
        log_error "❌ 版本标签推送失败"
        exit 1
    fi
}

# 监控GitHub Actions
monitor_github_actions() {
    log_step "监控GitHub Actions..."
    
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//')
    ACTIONS_URL="$REPO_URL/actions"
    
    log_info "GitHub Actions页面: $ACTIONS_URL"
    log_info "请在浏览器中打开上述链接查看构建状态"
    
    echo ""
    log_info "构建完成后，您可以："
    log_info "1. 检查构建日志确认没有错误"
    log_info "2. 确认新镜像已推送到GitHub Container Registry"
    log_info "3. 在生产环境运行: docker-compose pull && docker-compose up -d"
}

# 显示部署指令
show_deployment_instructions() {
    log_step "显示部署指令..."
    
    echo ""
    echo "=== 生产环境部署指令 ==="
    echo ""
    echo "1. 等待GitHub Actions构建完成"
    echo "2. 在生产服务器上运行以下命令:"
    echo ""
    echo "   # 拉取最新镜像"
    echo "   docker-compose pull"
    echo ""
    echo "   # 重启服务"
    echo "   docker-compose down"
    echo "   docker-compose up -d"
    echo ""
    echo "3. 验证部署:"
    echo "   # 检查健康状态"
    echo "   curl http://192.168.1.115:8000/api/health"
    echo ""
    echo "   # 测试登录API"
    echo "   curl -X POST http://192.168.1.115:8000/api/v1/auth/login \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     -d '{\"username\":\"admin\",\"password\":\"admin123\"}'"
    echo ""
    echo "4. 或使用部署脚本:"
    echo "   ./scripts/deploy-production.sh"
    echo ""
}

# 主函数
main() {
    show_header
    check_git_status
    check_github_actions
    check_fixes
    commit_fixes
    push_to_github
    create_version_tag
    monitor_github_actions
    show_deployment_instructions
    
    echo ""
    log_info "🎉 GitHub构建发布流程完成！"
    log_info "请查看GitHub Actions页面确认构建状态"
}

# 处理命令行参数
case "${1:-}" in
    "check")
        check_git_status
        check_github_actions
        check_fixes
        ;;
    "commit")
        commit_fixes
        ;;
    "push")
        push_to_github
        ;;
    *)
        main
        ;;
esac
