#!/bin/bash

# 快速启动脚本 - 客户合同管理系统

set -e

echo "=== 客户合同管理系统 - 快速启动 ==="
echo "时间: $(date)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：打印彩色消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    print_success "Docker 环境检查通过"
}

# 检查端口是否被占用
check_ports() {
    local ports=(80 3306 8080)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            occupied_ports+=($port)
        fi
    done
    
    if [ ${#occupied_ports[@]} -gt 0 ]; then
        print_warning "以下端口被占用: ${occupied_ports[*]}"
        print_info "请确保这些端口可用，或修改 docker-compose.yml 中的端口配置"
        read -p "是否继续启动？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 构建和启动服务
start_services() {
    print_info "开始构建和启动服务..."
    
    # 停止可能存在的旧容器
    print_info "清理旧容器..."
    docker-compose down 2>/dev/null || true
    
    # 构建并启动服务
    print_info "构建镜像（这可能需要几分钟）..."
    docker-compose build --no-cache
    
    print_info "启动服务..."
    docker-compose up -d
    
    print_success "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    print_info "等待服务启动..."
    
    # 等待MySQL
    print_info "等待数据库启动..."
    local mysql_ready=false
    for i in {1..60}; do
        if docker-compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
            mysql_ready=true
            break
        fi
        sleep 2
        echo -n "."
    done
    echo
    
    if [ "$mysql_ready" = false ]; then
        print_error "数据库启动超时"
        exit 1
    fi
    print_success "数据库已就绪"
    
    # 等待应用服务
    print_info "等待应用服务启动..."
    local app_ready=false
    for i in {1..60}; do
        if curl -s http://localhost/health >/dev/null 2>&1; then
            app_ready=true
            break
        fi
        sleep 2
        echo -n "."
    done
    echo
    
    if [ "$app_ready" = false ]; then
        print_error "应用服务启动超时"
        exit 1
    fi
    print_success "应用服务已就绪"
}

# 显示服务信息
show_service_info() {
    echo
    print_success "=== 服务启动成功 ==="
    echo
    echo "📱 前端应用:     http://localhost"
    echo "🔧 API文档:      http://localhost/api-docs"
    echo "❤️  健康检查:    http://localhost/health"
    echo "🗄️  数据库:      localhost:3306"
    echo
    echo "默认登录信息:"
    echo "  用户名: admin"
    echo "  密码: admin123"
    echo
    print_info "查看日志: docker-compose logs -f"
    print_info "停止服务: docker-compose down"
    print_info "重启服务: docker-compose restart"
    echo
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -d, --dev      开发模式启动"
    echo "  -p, --prod     生产模式启动"
    echo "  --stop         停止所有服务"
    echo "  --logs         查看服务日志"
    echo "  --status       查看服务状态"
    echo
}

# 停止服务
stop_services() {
    print_info "停止服务..."
    docker-compose down
    print_success "服务已停止"
}

# 查看日志
show_logs() {
    docker-compose logs -f
}

# 查看状态
show_status() {
    echo "=== 服务状态 ==="
    docker-compose ps
    echo
    echo "=== 健康检查 ==="
    curl -s http://localhost/health | jq . 2>/dev/null || curl -s http://localhost/health
}

# 主函数
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        --stop)
            stop_services
            exit 0
            ;;
        --logs)
            show_logs
            exit 0
            ;;
        --status)
            show_status
            exit 0
            ;;
        -p|--prod)
            export COMPOSE_FILE="docker-compose.prod.yml"
            print_info "使用生产环境配置"
            ;;
        -d|--dev|"")
            export COMPOSE_FILE="docker-compose.yml"
            print_info "使用开发环境配置"
            ;;
        *)
            print_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
    
    check_docker
    check_ports
    start_services
    wait_for_services
    show_service_info
}

# 捕获中断信号
trap 'print_info "正在停止..."; docker-compose down; exit 0' INT TERM

# 运行主函数
main "$@"
