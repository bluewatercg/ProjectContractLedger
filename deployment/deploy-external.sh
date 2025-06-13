#!/bin/bash

# 客户合同管理系统 - 外部服务器部署脚本
# 适用于已有MySQL和Redis服务器的部署场景
# 使用方法: ./deploy-external.sh [选项]

set -e

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="contract-ledger"
COMPOSE_FILE="docker-compose.external-services.yml"
ENV_FILE=".env.external-services"
BACKUP_DIR="/opt/backups/${PROJECT_NAME}"

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
        log_info "请复制 .env.external-services.template 为 ${ENV_FILE} 并填写配置"
        exit 1
    fi
    
    # 检查必需的环境变量
    source "${SCRIPT_DIR}/${ENV_FILE}"
    
    if [ -z "$DB_HOST" ] || [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
        log_error "必需的环境变量未设置，请检查 ${ENV_FILE} 文件"
        log_error "必需变量: DB_HOST, DB_PASSWORD, JWT_SECRET"
        exit 1
    fi
    
    log_success "环境配置检查通过"
}

# 测试外部服务连接
test_external_services() {
    log_info "测试外部服务连接..."
    
    source "${SCRIPT_DIR}/${ENV_FILE}"
    
    # 测试MySQL连接
    log_info "测试MySQL连接 ${DB_HOST}:${DB_PORT:-3306}..."
    if command -v mysql &> /dev/null; then
        if mysql -h "${DB_HOST}" -P "${DB_PORT:-3306}" -u "${DB_USERNAME}" -p"${DB_PASSWORD}" -e "SELECT 1;" &> /dev/null; then
            log_success "MySQL连接测试成功"
        else
            log_error "MySQL连接测试失败，请检查数据库配置"
            exit 1
        fi
    else
        log_warning "未安装mysql客户端，跳过MySQL连接测试"
    fi
    
    # 测试Redis连接
    if [ -n "$REDIS_HOST" ]; then
        log_info "测试Redis连接 ${REDIS_HOST}:${REDIS_PORT:-6379}..."
        if command -v redis-cli &> /dev/null; then
            if redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT:-6379}" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} ping &> /dev/null; then
                log_success "Redis连接测试成功"
            else
                log_error "Redis连接测试失败，请检查Redis配置"
                exit 1
            fi
        else
            log_warning "未安装redis-cli，跳过Redis连接测试"
        fi
    fi
}

# 初始化部署环境
init_deployment() {
    log_info "初始化部署环境..."
    
    # 创建必要的目录
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "${SCRIPT_DIR}/nginx/conf.d"
    mkdir -p "${SCRIPT_DIR}/ssl"
    
    # 设置权限
    chmod 755 "${SCRIPT_DIR}"
    chmod 600 "${SCRIPT_DIR}/${ENV_FILE}"
    
    # 创建网络（如果不存在）
    docker network create contract-ledger-network 2>/dev/null || true
    
    log_success "部署环境初始化完成"
}

# 拉取最新镜像
pull_images() {
    log_info "拉取最新镜像..."
    
    cd "${SCRIPT_DIR}"
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" pull
    
    log_success "镜像拉取完成"
}

# 备份数据
backup_data() {
    log_info "开始备份数据..."
    
    source "${SCRIPT_DIR}/${ENV_FILE}"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
    
    # 创建备份目录
    mkdir -p "${BACKUP_DIR}"
    
    # 备份数据库
    if command -v mysqldump &> /dev/null; then
        mysqldump -h "${DB_HOST}" -P "${DB_PORT:-3306}" -u "${DB_USERNAME}" -p"${DB_PASSWORD}" "${DB_DATABASE}" > "${BACKUP_FILE}"
        
        # 压缩备份文件
        gzip "${BACKUP_FILE}"
        
        # 清理旧备份（保留7天）
        find "${BACKUP_DIR}" -name "backup_*.sql.gz" -mtime +7 -delete
        
        log_success "数据备份完成: ${BACKUP_FILE}.gz"
    else
        log_warning "未安装mysqldump，跳过数据备份"
    fi
}

# 部署应用
deploy_application() {
    log_info "开始部署应用..."
    
    cd "${SCRIPT_DIR}"
    
    # 停止现有服务
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" down 2>/dev/null || true
    
    # 启动服务
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    check_service_health
    
    log_success "应用部署完成"
}

# 更新应用
update_application() {
    log_info "开始更新应用..."
    
    # 备份数据
    backup_data
    
    # 拉取最新镜像
    pull_images
    
    # 重新部署
    deploy_application
    
    log_success "应用更新完成"
}

# 检查服务健康状态
check_service_health() {
    log_info "检查服务健康状态..."
    
    cd "${SCRIPT_DIR}"
    
    # 检查容器状态
    if ! docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" ps | grep -q "Up"; then
        log_error "部分服务未正常启动"
        docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" ps
        return 1
    fi
    
    # 检查应用健康检查
    for i in {1..10}; do
        if curl -f http://localhost/health >/dev/null 2>&1; then
            log_success "应用健康检查通过"
            return 0
        fi
        log_info "等待应用启动... ($i/10)"
        sleep 10
    done
    
    log_error "应用健康检查失败"
    return 1
}

# 查看服务状态
show_status() {
    log_info "服务状态:"
    
    cd "${SCRIPT_DIR}"
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" ps
    
    echo
    log_info "系统资源使用情况:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# 查看日志
show_logs() {
    cd "${SCRIPT_DIR}"
    
    if [ -n "$1" ]; then
        # 查看特定服务的日志
        docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" logs -f "$1"
    else
        # 查看所有服务的日志
        docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" logs -f
    fi
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    
    cd "${SCRIPT_DIR}"
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" down
    
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    
    cd "${SCRIPT_DIR}"
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" restart
    
    # 等待服务启动
    sleep 15
    check_service_health
    
    log_success "服务重启完成"
}

# 显示帮助信息
show_help() {
    echo "客户合同管理系统 - 外部服务器部署脚本"
    echo
    echo "使用方法: $0 [选项]"
    echo
    echo "选项:"
    echo "  --init              初始化部署环境"
    echo "  --test              测试外部服务连接"
    echo "  --deploy            部署应用"
    echo "  --update            更新应用"
    echo "  --backup            备份数据"
    echo "  --status            查看服务状态"
    echo "  --logs [service]    查看日志"
    echo "  --stop              停止服务"
    echo "  --restart           重启服务"
    echo "  --help              显示帮助信息"
    echo
    echo "示例:"
    echo "  $0 --init                           # 初始化部署环境"
    echo "  $0 --test                           # 测试外部服务连接"
    echo "  $0 --deploy                         # 部署应用"
    echo "  $0 --update                         # 更新应用"
    echo "  $0 --logs app                       # 查看应用日志"
}

# 主函数
main() {
    case "$1" in
        --init)
            check_dependencies
            check_environment
            init_deployment
            ;;
        --test)
            check_dependencies
            check_environment
            test_external_services
            ;;
        --deploy)
            check_dependencies
            check_environment
            test_external_services
            init_deployment
            pull_images
            deploy_application
            ;;
        --update)
            check_dependencies
            check_environment
            test_external_services
            update_application
            ;;
        --backup)
            check_dependencies
            check_environment
            backup_data
            ;;
        --status)
            show_status
            ;;
        --logs)
            show_logs "$2"
            ;;
        --stop)
            stop_services
            ;;
        --restart)
            restart_services
            ;;
        --help|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"
