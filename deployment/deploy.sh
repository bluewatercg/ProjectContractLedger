#!/bin/bash

# 客户合同管理系统 - 生产环境部署脚本
# 使用方法: ./deploy.sh [选项]
# 选项:
#   --init      初始化部署环境
#   --update    更新应用
#   --backup    备份数据
#   --restore   恢复数据
#   --logs      查看日志
#   --status    查看服务状态

set -e

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="contract-ledger"
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"
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
        log_info "请复制 .env.production.template 为 ${ENV_FILE} 并填写配置"
        exit 1
    fi
    
    # 检查必需的环境变量
    source "${SCRIPT_DIR}/${ENV_FILE}"
    
    if [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ] || [ -z "$MYSQL_ROOT_PASSWORD" ]; then
        log_error "必需的环境变量未设置，请检查 ${ENV_FILE} 文件"
        exit 1
    fi
    
    log_success "环境配置检查通过"
}

# 初始化部署环境
init_deployment() {
    log_info "初始化部署环境..."
    
    # 创建必要的目录
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "${SCRIPT_DIR}/database/scripts"
    mkdir -p "${SCRIPT_DIR}/nginx/conf.d"
    mkdir -p "${SCRIPT_DIR}/ssl"
    mkdir -p "${SCRIPT_DIR}/monitoring"
    
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
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
    
    # 创建备份目录
    mkdir -p "${BACKUP_DIR}"
    
    # 备份数据库
    cd "${SCRIPT_DIR}"
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" exec -T db \
        mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" "${DB_DATABASE}" > "${BACKUP_FILE}"
    
    # 压缩备份文件
    gzip "${BACKUP_FILE}"
    
    # 清理旧备份（保留30天）
    find "${BACKUP_DIR}" -name "backup_*.sql.gz" -mtime +30 -delete
    
    log_success "数据备份完成: ${BACKUP_FILE}.gz"
}

# 恢复数据
restore_data() {
    if [ -z "$1" ]; then
        log_error "请指定备份文件路径"
        log_info "使用方法: $0 --restore /path/to/backup.sql.gz"
        exit 1
    fi
    
    BACKUP_FILE="$1"
    
    if [ ! -f "${BACKUP_FILE}" ]; then
        log_error "备份文件不存在: ${BACKUP_FILE}"
        exit 1
    fi
    
    log_warning "即将恢复数据，这将覆盖现有数据！"
    read -p "确认继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "操作已取消"
        exit 0
    fi
    
    log_info "开始恢复数据..."
    
    cd "${SCRIPT_DIR}"
    
    # 停止应用服务（保持数据库运行）
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" stop app
    
    # 恢复数据库
    if [[ "${BACKUP_FILE}" == *.gz ]]; then
        gunzip -c "${BACKUP_FILE}" | docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" exec -T db \
            mysql -u root -p"${MYSQL_ROOT_PASSWORD}" "${DB_DATABASE}"
    else
        docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" exec -T db \
            mysql -u root -p"${MYSQL_ROOT_PASSWORD}" "${DB_DATABASE}" < "${BACKUP_FILE}"
    fi
    
    # 重启应用服务
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" start app
    
    log_success "数据恢复完成"
}

# 部署应用
deploy_application() {
    log_info "开始部署应用..."
    
    cd "${SCRIPT_DIR}"
    
    # 停止现有服务
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" down
    
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

# 清理系统
cleanup_system() {
    log_info "清理系统资源..."
    
    # 清理未使用的镜像
    docker image prune -f
    
    # 清理未使用的卷
    docker volume prune -f
    
    # 清理未使用的网络
    docker network prune -f
    
    log_success "系统清理完成"
}

# 显示帮助信息
show_help() {
    echo "客户合同管理系统 - 生产环境部署脚本"
    echo
    echo "使用方法: $0 [选项]"
    echo
    echo "选项:"
    echo "  --init              初始化部署环境"
    echo "  --deploy            部署应用"
    echo "  --update            更新应用"
    echo "  --backup            备份数据"
    echo "  --restore <file>    恢复数据"
    echo "  --status            查看服务状态"
    echo "  --logs [service]    查看日志"
    echo "  --cleanup           清理系统资源"
    echo "  --help              显示帮助信息"
    echo
    echo "示例:"
    echo "  $0 --init                           # 初始化部署环境"
    echo "  $0 --deploy                         # 部署应用"
    echo "  $0 --update                         # 更新应用"
    echo "  $0 --backup                         # 备份数据"
    echo "  $0 --restore /path/to/backup.sql.gz # 恢复数据"
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
        --deploy)
            check_dependencies
            check_environment
            init_deployment
            pull_images
            deploy_application
            ;;
        --update)
            check_dependencies
            check_environment
            update_application
            ;;
        --backup)
            check_dependencies
            check_environment
            backup_data
            ;;
        --restore)
            check_dependencies
            check_environment
            restore_data "$2"
            ;;
        --status)
            show_status
            ;;
        --logs)
            show_logs "$2"
            ;;
        --cleanup)
            cleanup_system
            ;;
        --help|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"
