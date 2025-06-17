#!/bin/bash

# nginx代理配置修复脚本
# 修复登录API 404问题

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

# 查找容器
find_container() {
    log_step "查找运行中的容器..."
    
    # 查找可能的容器名称
    CONTAINER_NAMES=(
        "contract-ledger"
        "contract-ledger-app"
        "contract-ledger-fixed"
        "projectcontractledger"
    )
    
    CONTAINER_ID=""
    
    for name in "${CONTAINER_NAMES[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "$name"; then
            CONTAINER_ID=$(docker ps --filter "name=$name" --format "{{.ID}}")
            break
        fi
    done
    
    # 如果没找到，尝试通过镜像名查找
    if [ -z "$CONTAINER_ID" ]; then
        CONTAINER_ID=$(docker ps --filter "ancestor=ghcr.milu.moe/bluewatercg/projectcontractledger" --format "{{.ID}}" | head -1)
    fi
    
    if [ -z "$CONTAINER_ID" ]; then
        log_error "未找到运行中的容器"
        exit 1
    fi
    
    log_info "找到容器: $CONTAINER_ID"
}

# 检查当前nginx配置
check_current_config() {
    log_step "检查当前nginx配置..."
    
    echo "=== 当前nginx API代理配置 ==="
    docker exec "$CONTAINER_ID" grep -A 10 -B 2 "location /api" /etc/nginx/nginx.conf || {
        log_error "无法读取nginx配置"
        exit 1
    }
    echo ""
}

# 备份nginx配置
backup_nginx_config() {
    log_step "备份nginx配置..."
    
    docker exec "$CONTAINER_ID" cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    log_info "nginx配置已备份到 /etc/nginx/nginx.conf.backup"
}

# 修复nginx配置
fix_nginx_config() {
    log_step "修复nginx配置..."
    
    # 创建修复后的配置
    docker exec "$CONTAINER_ID" sh -c '
        sed "s|proxy_pass http://backend/;|proxy_pass http://backend/api/;|g" /etc/nginx/nginx.conf > /tmp/nginx.conf.fixed
        mv /tmp/nginx.conf.fixed /etc/nginx/nginx.conf
    '
    
    log_info "nginx配置已修复"
}

# 测试nginx配置
test_nginx_config() {
    log_step "测试nginx配置..."
    
    if docker exec "$CONTAINER_ID" nginx -t; then
        log_info "✅ nginx配置测试通过"
    else
        log_error "❌ nginx配置测试失败，恢复备份"
        docker exec "$CONTAINER_ID" cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
        exit 1
    fi
}

# 重新加载nginx
reload_nginx() {
    log_step "重新加载nginx配置..."
    
    if docker exec "$CONTAINER_ID" nginx -s reload; then
        log_info "✅ nginx配置重新加载成功"
    else
        log_error "❌ nginx重新加载失败"
        exit 1
    fi
}

# 测试修复效果
test_fix() {
    log_step "测试修复效果..."
    
    sleep 2  # 等待nginx重新加载
    
    # 测试登录API
    log_info "测试登录API..."
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin123"}' \
        "http://192.168.1.115:8000/api/v1/auth/login")
    
    if [ "$response" = "200" ] || [ "$response" = "401" ] || [ "$response" = "400" ]; then
        log_info "✅ 登录API修复成功 (HTTP $response)"
    elif [ "$response" = "404" ]; then
        log_error "❌ 登录API仍然404，修复失败"
        return 1
    else
        log_warn "⚠️  登录API状态异常 (HTTP $response)"
    fi
    
    # 测试健康检查
    log_info "测试健康检查..."
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://192.168.1.115:8000/api/health")
    if [ "$response" = "200" ]; then
        log_info "✅ 健康检查正常 (HTTP $response)"
    else
        log_warn "⚠️  健康检查异常 (HTTP $response)"
    fi
}

# 显示修复后的配置
show_fixed_config() {
    log_step "显示修复后的配置..."
    
    echo "=== 修复后的nginx API代理配置 ==="
    docker exec "$CONTAINER_ID" grep -A 10 -B 2 "location /api" /etc/nginx/nginx.conf
    echo ""
}

# 回滚配置
rollback_config() {
    log_step "回滚nginx配置..."
    
    docker exec "$CONTAINER_ID" cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
    docker exec "$CONTAINER_ID" nginx -s reload
    log_info "nginx配置已回滚"
}

# 主函数
main() {
    echo "=================================================================="
    echo "                    Nginx代理配置修复脚本"
    echo "=================================================================="
    echo "时间: $(date)"
    echo "目标: 修复登录API 404问题"
    echo "=================================================================="
    echo ""
    
    find_container
    check_current_config
    backup_nginx_config
    fix_nginx_config
    test_nginx_config
    reload_nginx
    test_fix
    show_fixed_config
    
    echo ""
    log_info "🎉 修复完成！"
    log_info "如果修复失败，可以运行: $0 rollback"
}

# 处理命令行参数
case "${1:-}" in
    "rollback")
        find_container
        rollback_config
        ;;
    "test")
        find_container
        test_fix
        ;;
    *)
        main
        ;;
esac
