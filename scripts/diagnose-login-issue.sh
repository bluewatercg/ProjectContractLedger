#!/bin/bash

# 登录问题诊断脚本
# 用于查看nginx日志和诊断登录API问题

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
    echo "                    登录问题诊断脚本"
    echo "=================================================================="
    echo "时间: $(date)"
    echo "目标: 诊断登录API问题并查看nginx日志"
    echo "=================================================================="
    echo ""
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
    CONTAINER_NAME=""
    
    for name in "${CONTAINER_NAMES[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "$name"; then
            CONTAINER_NAME="$name"
            CONTAINER_ID=$(docker ps --filter "name=$name" --format "{{.ID}}")
            break
        fi
    done
    
    # 如果没找到，尝试通过镜像名查找
    if [ -z "$CONTAINER_ID" ]; then
        CONTAINER_ID=$(docker ps --filter "ancestor=ghcr.milu.moe/bluewatercg/projectcontractledger" --format "{{.ID}}" | head -1)
        if [ ! -z "$CONTAINER_ID" ]; then
            CONTAINER_NAME=$(docker ps --filter "id=$CONTAINER_ID" --format "{{.Names}}")
        fi
    fi
    
    if [ -z "$CONTAINER_ID" ]; then
        log_error "未找到运行中的容器"
        log_info "当前运行的容器："
        docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
        exit 1
    fi
    
    log_info "找到容器: $CONTAINER_NAME ($CONTAINER_ID)"
}

# 检查容器状态
check_container_status() {
    log_step "检查容器状态..."
    
    # 容器基本信息
    log_info "容器信息："
    docker inspect "$CONTAINER_ID" --format "{{.Name}}: {{.State.Status}} ({{.State.Health.Status}})"
    
    # 端口映射
    log_info "端口映射："
    docker port "$CONTAINER_ID"
    
    # 资源使用
    log_info "资源使用："
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" "$CONTAINER_ID"
}

# 查看容器日志
view_container_logs() {
    log_step "查看容器启动日志..."
    
    echo "=== 最近50行容器日志 ==="
    docker logs --tail 50 "$CONTAINER_ID"
    echo ""
}

# 查看nginx日志
view_nginx_logs() {
    log_step "查看nginx日志..."
    
    # 检查nginx日志文件是否存在
    log_info "检查nginx日志文件..."
    docker exec "$CONTAINER_ID" ls -la /var/log/nginx/ 2>/dev/null || {
        log_warn "nginx日志目录不存在，尝试其他位置..."
        docker exec "$CONTAINER_ID" find / -name "access.log" -o -name "error.log" 2>/dev/null | head -10
    }
    
    echo ""
    echo "=== Nginx访问日志 (最近20行) ==="
    docker exec "$CONTAINER_ID" tail -20 /var/log/nginx/access.log 2>/dev/null || {
        log_warn "无法读取nginx访问日志"
    }
    
    echo ""
    echo "=== Nginx错误日志 (最近20行) ==="
    docker exec "$CONTAINER_ID" tail -20 /var/log/nginx/error.log 2>/dev/null || {
        log_warn "无法读取nginx错误日志"
    }
}

# 测试API接口
test_api_endpoints() {
    log_step "测试API接口..."
    
    BASE_URL="http://192.168.1.115:8000"
    
    # 测试健康检查
    log_info "测试健康检查接口..."
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
    if [ "$response" = "200" ]; then
        log_info "✅ 健康检查正常 (HTTP $response)"
    else
        log_error "❌ 健康检查异常 (HTTP $response)"
    fi
    
    # 测试登录接口
    log_info "测试登录接口..."
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test"}' \
        "$BASE_URL/api/v1/auth/login")
    
    if [ "$response" = "401" ] || [ "$response" = "400" ]; then
        log_info "✅ 登录接口路径正确 (HTTP $response - 认证失败，符合预期)"
    elif [ "$response" = "404" ]; then
        log_error "❌ 登录接口404 - 路径问题"
    else
        log_warn "⚠️  登录接口异常 (HTTP $response)"
    fi
    
    # 获取详细响应
    log_info "获取登录接口详细响应..."
    echo "=== 登录接口响应 ==="
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test"}' \
        "$BASE_URL/api/v1/auth/login" | jq . 2>/dev/null || \
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test"}' \
        "$BASE_URL/api/v1/auth/login"
    echo ""
}

# 检查nginx配置
check_nginx_config() {
    log_step "检查nginx配置..."
    
    # 测试nginx配置
    log_info "测试nginx配置语法..."
    docker exec "$CONTAINER_ID" nginx -t 2>&1 || log_warn "nginx配置测试失败"
    
    # 查看nginx配置文件
    log_info "查看nginx主配置..."
    echo "=== nginx.conf (关键部分) ==="
    docker exec "$CONTAINER_ID" grep -A 10 -B 2 "location /api" /etc/nginx/nginx.conf 2>/dev/null || {
        log_warn "无法读取nginx配置，尝试其他位置..."
        docker exec "$CONTAINER_ID" find /etc -name "nginx.conf" 2>/dev/null | head -5
    }
    echo ""
}

# 检查运行时配置
check_runtime_config() {
    log_step "检查前端运行时配置..."
    
    # 查看前端配置文件
    log_info "查看前端运行时配置..."
    echo "=== 前端运行时配置 ==="
    docker exec "$CONTAINER_ID" cat /usr/share/nginx/html/config.js 2>/dev/null || {
        log_warn "无法读取前端配置文件"
        docker exec "$CONTAINER_ID" find /usr/share/nginx/html -name "config.js" -o -name "*.js" | head -5
    }
    echo ""
    
    # 检查环境变量
    log_info "检查关键环境变量..."
    echo "=== 关键环境变量 ==="
    docker exec "$CONTAINER_ID" env | grep -E "(API|FRONTEND|NODE_ENV)" || log_warn "未找到相关环境变量"
    echo ""
}

# 实时监控日志
monitor_logs() {
    log_step "开始实时监控日志..."
    log_info "请在另一个终端尝试登录，然后观察日志输出"
    log_info "按 Ctrl+C 停止监控"
    
    echo ""
    echo "=== 实时日志监控 ==="
    
    # 同时监控容器日志和nginx日志
    {
        docker logs -f "$CONTAINER_ID" 2>&1 | sed 's/^/[CONTAINER] /' &
        docker exec "$CONTAINER_ID" tail -f /var/log/nginx/access.log 2>/dev/null | sed 's/^/[NGINX-ACCESS] /' &
        docker exec "$CONTAINER_ID" tail -f /var/log/nginx/error.log 2>/dev/null | sed 's/^/[NGINX-ERROR] /' &
        wait
    }
}

# 生成诊断报告
generate_report() {
    log_step "生成诊断报告..."
    
    REPORT_FILE="login-diagnosis-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "登录问题诊断报告"
        echo "生成时间: $(date)"
        echo "容器: $CONTAINER_NAME ($CONTAINER_ID)"
        echo ""
        
        echo "=== 容器状态 ==="
        docker inspect "$CONTAINER_ID" --format "{{.Name}}: {{.State.Status}}"
        docker port "$CONTAINER_ID"
        echo ""
        
        echo "=== API测试结果 ==="
        curl -s -o /dev/null -w "健康检查: %{http_code}\n" "http://192.168.1.115:8000/api/health"
        curl -s -o /dev/null -w "登录接口: %{http_code}\n" -X POST \
            -H "Content-Type: application/json" \
            -d '{"username":"test","password":"test"}' \
            "http://192.168.1.115:8000/api/v1/auth/login"
        echo ""
        
        echo "=== 最近容器日志 ==="
        docker logs --tail 30 "$CONTAINER_ID"
        echo ""
        
        echo "=== Nginx日志 ==="
        docker exec "$CONTAINER_ID" tail -10 /var/log/nginx/access.log 2>/dev/null || echo "无法读取访问日志"
        docker exec "$CONTAINER_ID" tail -10 /var/log/nginx/error.log 2>/dev/null || echo "无法读取错误日志"
        
    } > "$REPORT_FILE"
    
    log_info "诊断报告已保存到: $REPORT_FILE"
}

# 主函数
main() {
    show_header
    find_container
    check_container_status
    view_container_logs
    view_nginx_logs
    test_api_endpoints
    check_nginx_config
    check_runtime_config
    
    echo ""
    log_info "诊断完成！"
    log_info "如需实时监控日志，请运行: $0 monitor"
    log_info "如需生成报告，请运行: $0 report"
}

# 处理命令行参数
case "${1:-}" in
    "monitor")
        find_container
        monitor_logs
        ;;
    "report")
        find_container
        generate_report
        ;;
    "logs")
        find_container
        view_nginx_logs
        ;;
    *)
        main
        ;;
esac
