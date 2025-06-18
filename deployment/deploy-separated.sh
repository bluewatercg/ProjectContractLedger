#!/bin/bash

# 前后端分离部署脚本
# 支持多种部署模式：基础模式、带代理模式
# 使用方法: ./deploy-separated.sh [选项]
# 选项:
#   --basic     基础部署（默认）
#   --proxy     带Nginx代理的部署
#   --update    更新现有部署
#   --stop      停止服务
#   --logs      查看日志
#   --status    查看状态

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="contract-ledger"
COMPOSE_FILE="docker-compose.yml"
COMPOSE_FILE_SEPARATED="docker-compose.separated.yml"
ENV_FILE=".env"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    log_info "检查Docker环境..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker守护进程未运行，请启动Docker"
        exit 1
    fi

    log_success "Docker环境检查通过"
}

# 检查环境变量文件
check_env_file() {
    log_info "检查环境变量配置..."

    if [ ! -f "${ENV_FILE}" ]; then
        log_warning "环境变量文件 ${ENV_FILE} 不存在"

        if [ -f ".env.template" ]; then
            log_info "复制模板文件..."
            cp .env.template "${ENV_FILE}"
            log_warning "请编辑 ${ENV_FILE} 文件，填写正确的配置值"
            log_warning "特别注意以下配置项："
            echo "  - DB_USERNAME, DB_PASSWORD: 数据库用户名和密码"
            echo "  - REDIS_PASSWORD: Redis密码（如果有）"
            echo "  - JWT_SECRET: JWT密钥"
            echo "  - BACKEND_HOST: 后端服务地址"
            read -p "配置完成后按回车继续..."
        else
            log_error "环境变量模板文件不存在"
            exit 1
        fi
    fi

    # 检查必需的环境变量
    # 先转换文件格式，移除Windows回车符
    if command -v dos2unix &> /dev/null; then
        dos2unix "${ENV_FILE}" 2>/dev/null || true
    else
        # 如果没有dos2unix，使用sed替代
        sed -i 's/\r$//' "${ENV_FILE}" 2>/dev/null || true
    fi

    # 安全地读取环境变量，避免特殊字符问题
    set -a  # 自动导出变量
    while IFS= read -r line || [[ -n "$line" ]]; do
        # 跳过注释行和空行
        if [[ "$line" =~ ^[[:space:]]*# ]] || [[ "$line" =~ ^[[:space:]]*$ ]]; then
            continue
        fi

        # 处理配置行
        if [[ "$line" =~ ^[[:space:]]*([^=]+)=(.*)$ ]]; then
            local key="${BASH_REMATCH[1]}"
            local value="${BASH_REMATCH[2]}"

            # 移除前后空格
            key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

            # 移除值周围的引号（如果有）
            if [[ "$value" =~ ^[\"\'](.*)[\"\']$ ]]; then
                value="${BASH_REMATCH[1]}"
            fi

            # 导出变量
            export "$key"="$value"
        fi
    done < "${ENV_FILE}"
    set +a  # 停止自动导出

    if [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
        log_error "必需的环境变量未设置，请检查 ${ENV_FILE} 文件"
        exit 1
    fi

    log_success "环境变量文件检查通过"
}

# 拉取最新镜像
pull_images() {
    local compose_file="$1"
    log_info "拉取最新镜像..."

    cd "${SCRIPT_DIR}"
    docker-compose -f "${compose_file}" --env-file "${ENV_FILE}" pull

    log_success "镜像拉取完成"
}

# 停止现有服务
stop_services() {
    local compose_file="$1"
    log_info "停止现有服务..."

    cd "${SCRIPT_DIR}"
    docker-compose -f "${compose_file}" --env-file "${ENV_FILE}" down

    log_success "服务停止完成"
}

# 启动服务
start_services() {
    local compose_file="$1"
    local profile="$2"

    log_info "启动前后端分离服务..."

    cd "${SCRIPT_DIR}"
    if [ -n "$profile" ]; then
        docker-compose -f "${compose_file}" --env-file "${ENV_FILE}" --profile "$profile" up -d
    else
        docker-compose -f "${compose_file}" --env-file "${ENV_FILE}" up -d
    fi

    log_success "服务启动完成"
}

# 检查服务状态
check_services() {
    local compose_file="$1"
    log_info "检查服务状态..."

    cd "${SCRIPT_DIR}"
    sleep 15

    # 安全地读取环境变量
    local BACKEND_PORT_VAL=8080
    local FRONTEND_PORT_VAL=80

    # 从环境变量文件中提取端口配置
    if [ -f "${ENV_FILE}" ]; then
        BACKEND_PORT_VAL=$(grep "^BACKEND_PORT=" "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
        FRONTEND_PORT_VAL=$(grep "^FRONTEND_PORT=" "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)

        # 使用默认值如果提取失败
        BACKEND_PORT_VAL=${BACKEND_PORT_VAL:-8080}
        FRONTEND_PORT_VAL=${FRONTEND_PORT_VAL:-80}
    fi

    # 检查后端健康状态
    log_info "检查后端服务 (端口 $BACKEND_PORT_VAL)..."

    for i in {1..5}; do
        if curl -f http://localhost:$BACKEND_PORT_VAL/health &> /dev/null; then
            log_success "后端服务运行正常"
            break
        else
            log_info "等待后端服务启动... ($i/5)"
            sleep 5
        fi
    done

    # 检查前端服务
    log_info "检查前端服务 (端口 $FRONTEND_PORT_VAL)..."

    for i in {1..5}; do
        if curl -f http://localhost:$FRONTEND_PORT_VAL &> /dev/null; then
            log_success "前端服务运行正常"
            break
        else
            log_info "等待前端服务启动... ($i/5)"
            sleep 5
        fi
    done

    # 显示容器状态
    log_info "容器状态:"
    docker-compose -f "${compose_file}" --env-file "${ENV_FILE}" ps
}

# 显示访问信息
show_access_info() {
    local mode="$1"

    # 安全地读取环境变量
    local FRONTEND_PORT_VAL=80
    local BACKEND_PORT_VAL=8080
    local PROXY_PORT_VAL=8000

    # 从环境变量文件中提取端口配置
    if [ -f "${ENV_FILE}" ]; then
        FRONTEND_PORT_VAL=$(grep "^FRONTEND_PORT=" "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
        BACKEND_PORT_VAL=$(grep "^BACKEND_PORT=" "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
        PROXY_PORT_VAL=$(grep "^PROXY_PORT=" "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)

        # 使用默认值如果提取失败
        FRONTEND_PORT_VAL=${FRONTEND_PORT_VAL:-80}
        BACKEND_PORT_VAL=${BACKEND_PORT_VAL:-8080}
        PROXY_PORT_VAL=${PROXY_PORT_VAL:-8000}
    fi

    echo ""
    log_success "=== 部署完成 ==="

    if [ "$mode" = "proxy" ]; then
        echo "统一入口地址: http://localhost:$PROXY_PORT_VAL"
        echo "前端直接访问: http://localhost:$FRONTEND_PORT_VAL"
        echo "后端直接访问: http://localhost:$BACKEND_PORT_VAL"
    else
        echo "前端访问地址: http://localhost:$FRONTEND_PORT_VAL"
        echo "后端API地址: http://localhost:$BACKEND_PORT_VAL"
    fi

    echo "后端健康检查: http://localhost:$BACKEND_PORT_VAL/health"
    echo ""
    echo "管理命令:"
    echo "  查看日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
}

# 显示帮助信息
show_help() {
    echo "前后端分离部署脚本"
    echo ""
    echo "使用方法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --basic     基础部署（默认）"
    echo "  --proxy     带Nginx代理的部署"
    echo "  --update    更新现有部署"
    echo "  --stop      停止服务"
    echo "  --logs      查看日志"
    echo "  --status    查看状态"
    echo "  --help      显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                # 基础部署"
    echo "  $0 --basic        # 基础部署"
    echo "  $0 --proxy        # 带代理的部署"
    echo "  $0 --update       # 更新部署"
    echo "  $0 --logs         # 查看日志"
}

# 基础部署
deploy_basic() {
    log_info "开始基础部署..."

    check_docker
    check_env_file
    pull_images "${COMPOSE_FILE}"
    stop_services "${COMPOSE_FILE}"
    start_services "${COMPOSE_FILE}"
    check_services "${COMPOSE_FILE}"
    show_access_info "basic"

    log_success "基础部署完成！"
}

# 代理部署
deploy_proxy() {
    log_info "开始代理部署..."

    check_docker
    check_env_file
    pull_images "${COMPOSE_FILE_SEPARATED}"
    stop_services "${COMPOSE_FILE_SEPARATED}"
    start_services "${COMPOSE_FILE_SEPARATED}" "proxy"
    check_services "${COMPOSE_FILE_SEPARATED}"
    show_access_info "proxy"

    log_success "代理部署完成！"
}

# 更新部署
update_deployment() {
    log_info "开始更新部署..."

    # 检测当前使用的compose文件
    if docker ps --format "table {{.Names}}" | grep -q "nginx-proxy"; then
        log_info "检测到代理模式，更新代理部署..."
        deploy_proxy
    else
        log_info "检测到基础模式，更新基础部署..."
        deploy_basic
    fi
}

# 停止服务
stop_all_services() {
    log_info "停止所有服务..."

    cd "${SCRIPT_DIR}"

    # 尝试停止两种模式的服务
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" down 2>/dev/null || true
    docker-compose -f "${COMPOSE_FILE_SEPARATED}" --env-file "${ENV_FILE}" down 2>/dev/null || true

    log_success "所有服务已停止"
}

# 查看日志
show_logs() {
    cd "${SCRIPT_DIR}"

    # 检测当前运行的服务
    if docker ps --format "table {{.Names}}" | grep -q "nginx-proxy"; then
        docker-compose -f "${COMPOSE_FILE_SEPARATED}" --env-file "${ENV_FILE}" logs -f
    else
        docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" logs -f
    fi
}

# 查看状态
show_status() {
    cd "${SCRIPT_DIR}"

    log_info "服务状态:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep contract-ledger || echo "没有运行的服务"

    echo ""
    log_info "系统资源使用:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep contract-ledger || echo "没有运行的服务"
}

# 主函数
main() {
    # 切换到脚本目录
    cd "${SCRIPT_DIR}"

    case "$1" in
        --basic|"")
            deploy_basic
            ;;
        --proxy)
            deploy_proxy
            ;;
        --update)
            update_deployment
            ;;
        --stop)
            stop_all_services
            ;;
        --logs)
            show_logs
            ;;
        --status)
            show_status
            ;;
        --help)
            show_help
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
