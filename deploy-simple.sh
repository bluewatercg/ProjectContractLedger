#!/bin/bash

# 简化部署脚本 - 使用外部MySQL和Redis
# 适用于已有MySQL和Redis服务器的环境
# 镜像由GitHub Actions自动构建，本地只负责拉取和运行

set -e

# 脚本配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE=".env.external-simple"
COMPOSE_FILE="docker-compose.external-simple.yml"
GITHUB_REPO="bluewatercg/projectcontractledger"
GITHUB_RAW_URL="https://raw.githubusercontent.com/${GITHUB_REPO}/main"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 显示帮助信息
show_help() {
    echo "简化部署脚本 - 客户合同管理系统"
    echo "镜像由GitHub Actions自动构建，本地只负责拉取和运行"
    echo ""
    echo "使用方法:"
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  --init         初始化部署环境（下载配置文件）"
    echo "  --check        仅检查环境配置"
    echo "  --pull         仅拉取最新镜像"
    echo "  --restart      重启服务"
    echo "  --stop         停止服务"
    echo "  --logs         查看服务日志"
    echo "  --status       查看服务状态"
    echo ""
    echo "环境要求:"
    echo "  - Docker 和 Docker Compose"
    echo "  - 外部MySQL服务器"
    echo "  - 外部Redis服务器"
    echo "  - 配置文件: ${ENV_FILE}"
    echo ""
    echo "首次部署:"
    echo "  1. $0 --init     # 下载配置文件"
    echo "  2. 编辑 ${ENV_FILE} 文件，填写MySQL和Redis配置"
    echo "  3. $0            # 启动服务"
}

# 初始化部署环境
init_deployment() {
    log_info "初始化部署环境..."

    # 下载docker-compose文件
    if [ ! -f "${SCRIPT_DIR}/${COMPOSE_FILE}" ]; then
        log_info "下载 ${COMPOSE_FILE}..."
        if command -v wget &> /dev/null; then
            wget -O "${SCRIPT_DIR}/${COMPOSE_FILE}" "${GITHUB_RAW_URL}/${COMPOSE_FILE}"
        elif command -v curl &> /dev/null; then
            curl -o "${SCRIPT_DIR}/${COMPOSE_FILE}" "${GITHUB_RAW_URL}/${COMPOSE_FILE}"
        else
            log_error "需要 wget 或 curl 来下载配置文件"
            exit 1
        fi
        log_success "已下载 ${COMPOSE_FILE}"
    else
        log_info "${COMPOSE_FILE} 已存在"
    fi

    # 下载环境变量模板
    if [ ! -f "${SCRIPT_DIR}/${ENV_FILE}" ]; then
        log_info "下载环境变量模板..."
        if command -v wget &> /dev/null; then
            wget -O "${SCRIPT_DIR}/${ENV_FILE}" "${GITHUB_RAW_URL}/.env.external-simple.template"
        elif command -v curl &> /dev/null; then
            curl -o "${SCRIPT_DIR}/${ENV_FILE}" "${GITHUB_RAW_URL}/.env.external-simple.template"
        else
            log_error "需要 wget 或 curl 来下载配置文件"
            exit 1
        fi
        log_success "已下载环境变量模板为 ${ENV_FILE}"
        log_warning "请编辑 ${ENV_FILE} 文件，填写MySQL和Redis配置"
    else
        log_info "${ENV_FILE} 已存在"
    fi

    log_success "部署环境初始化完成"
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    log_success "系统依赖检查通过"
}

# 检查环境配置
check_environment() {
    log_info "检查环境配置..."
    
    if [ ! -f "${SCRIPT_DIR}/${ENV_FILE}" ]; then
        log_error "环境配置文件 ${ENV_FILE} 不存在"
        log_info "请复制 .env.external-simple.template 为 ${ENV_FILE} 并填写配置"
        exit 1
    fi
    
    # 检查必需的环境变量
    source "${SCRIPT_DIR}/${ENV_FILE}"
    
    if [ -z "$DB_HOST" ] || [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
        log_error "必需的环境变量未设置，请检查 ${ENV_FILE} 文件"
        log_error "必需变量: DB_HOST, DB_PASSWORD, JWT_SECRET"
        exit 1
    fi
    
    if [ -z "$REDIS_HOST" ]; then
        log_warning "REDIS_HOST 未设置，Redis功能将不可用"
    fi
    
    log_success "环境配置检查通过"
}

# 拉取最新镜像
pull_images() {
    log_info "拉取最新镜像..."
    
    cd "${SCRIPT_DIR}"
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" pull
    
    log_success "镜像拉取完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    cd "${SCRIPT_DIR}"
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d
    
    log_success "服务启动完成"
    
    # 等待服务就绪
    log_info "等待服务就绪..."
    sleep 10
    
    # 检查服务状态
    if docker-compose -f "${COMPOSE_FILE}" ps | grep -q "Up"; then
        log_success "服务运行正常"
        show_service_info
    else
        log_error "服务启动失败，请检查日志"
        docker-compose -f "${COMPOSE_FILE}" logs --tail=50
        exit 1
    fi
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    
    cd "${SCRIPT_DIR}"
    docker-compose -f "${COMPOSE_FILE}" down
    
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    
    stop_services
    start_services
}

# 查看日志
show_logs() {
    cd "${SCRIPT_DIR}"
    docker-compose -f "${COMPOSE_FILE}" logs -f
}

# 查看服务状态
show_status() {
    log_info "服务状态检查..."

    cd "${SCRIPT_DIR}"

    # 检查容器状态
    echo ""
    echo "=== 容器状态 ==="
    docker-compose -f "${COMPOSE_FILE}" ps

    # 检查服务健康状态
    echo ""
    echo "=== 健康检查 ==="

    # 检查前端
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:${FRONTEND_HTTP_PORT:-80}/health | grep -q "200"; then
        log_success "前端服务正常"
    else
        log_error "前端服务异常"
    fi

    # 检查后端API
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:${BACKEND_PORT:-8080}/health | grep -q "200"; then
        log_success "后端API服务正常"
    else
        log_error "后端API服务异常"
    fi

    echo ""
    echo "=== 访问地址 ==="
    echo "前端应用: http://localhost:${FRONTEND_HTTP_PORT:-80}"
    echo "后端API:  http://localhost:${BACKEND_PORT:-8080}"
    echo "健康检查: http://localhost:${FRONTEND_HTTP_PORT:-80}/health"
    echo "API文档:  http://localhost:${FRONTEND_HTTP_PORT:-80}/api-docs"
}

# 显示服务信息
show_service_info() {
    echo ""
    log_success "=== 服务部署完成 ==="
    echo ""
    echo "访问地址:"
    echo "  前端应用: http://localhost:${FRONTEND_HTTP_PORT:-80}"
    echo "  后端API:  http://localhost:${BACKEND_PORT:-8080}"
    echo "  健康检查: http://localhost:${FRONTEND_HTTP_PORT:-80}/health"
    echo "  API文档:  http://localhost:${FRONTEND_HTTP_PORT:-80}/api-docs"
    echo ""
    echo "管理命令:"
    echo "  查看日志: $0 --logs"
    echo "  重启服务: $0 --restart"
    echo "  停止服务: $0 --stop"
    echo ""
}

# 主函数
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        --init)
            init_deployment
            exit 0
            ;;
        --check)
            check_dependencies
            check_environment
            log_success "环境检查完成"
            exit 0
            ;;
        --pull)
            check_dependencies
            check_environment
            pull_images
            exit 0
            ;;
        --restart)
            check_dependencies
            check_environment
            restart_services
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
        "")
            # 默认部署流程
            check_dependencies
            check_environment
            pull_images
            start_services
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
