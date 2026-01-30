#!/bin/bash

# 前后端分离部署脚本
# 支持多种部署模式：基础模式、带代理模式
# 使用方法: ./deploy-separated.sh [选项]
# 选项:
#   --basic       基础部署（默认）
#   --proxy       带Nginx代理的部署
#   --update      更新现有部署
#   --stop        停止服务
#   --logs        查看日志
#   --status      查看状态
#   --cleanup     清理临时和旧镜像
#   --backup      手动备份数据库和上传文件
#   --rollback    回滚到上一个备份
#   --rotate-logs 手动执行日志轮转

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
BACKUP_DIR="${SCRIPT_DIR}/backups"
BACKUP_RETENTION_DAYS=7
HEALTH_CHECK_RETRIES=5
HEALTH_CHECK_INTERVAL=5
LOG_MAX_SIZE_MB=100
LOG_RETENTION_DAYS=30

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

# 备份数据库
backup_database() {
    log_info "开始备份数据库..."

    # 创建备份目录
    mkdir -p "${BACKUP_DIR}/database"

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/database/db_backup_${timestamp}.sql"

    # 从环境变量文件读取数据库配置
    set -a
    source "${ENV_FILE}"
    set +a

    # 检查数据库容器是否运行
    if ! docker ps --format "{{.Names}}" | grep -q "contract-ledger-db"; then
        log_warning "数据库容器未运行，跳过数据库备份"
        return 0
    fi

    # 执行数据库备份
    log_info "备份文件: ${backup_file}"
    if docker exec contract-ledger-db mysqldump -u"${DB_USERNAME}" -p"${DB_PASSWORD}" "${DB_DATABASE}" > "${backup_file}" 2>/dev/null; then
        # 压缩备份文件
        gzip "${backup_file}"
        log_success "数据库备份完成: ${backup_file}.gz"
        echo "${backup_file}.gz"
    else
        log_error "数据库备份失败"
        return 1
    fi
}

# 备份上传文件
backup_uploads() {
    log_info "开始备份上传文件..."

    # 创建备份目录
    mkdir -p "${BACKUP_DIR}/uploads"

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/uploads/uploads_backup_${timestamp}.tar.gz"

    # 解析上传目录路径
    local volume_info
    volume_info=$(parse_volume_mappings)
    local uploads_host_path
    uploads_host_path=$(echo "$volume_info" | grep "UPLOADS_HOST_PATH=" | cut -d'=' -f2)

    if [ -z "$uploads_host_path" ]; then
        log_warning "未找到上传目录配置，跳过文件备份"
        return 0
    fi

    if [ ! -d "$uploads_host_path" ]; then
        log_warning "上传目录不存在: $uploads_host_path，跳过文件备份"
        return 0
    fi

    # 备份上传文件
    log_info "备份文件: ${backup_file}"
    if tar -czf "${backup_file}" -C "$(dirname "$uploads_host_path")" "$(basename "$uploads_host_path")" 2>/dev/null; then
        log_success "上传文件备份完成: ${backup_file}"
        echo "${backup_file}"
    else
        log_error "上传文件备份失败"
        return 1
    fi
}

# 清理旧备份
cleanup_old_backups() {
    log_info "清理旧备份文件..."

    if [ ! -d "${BACKUP_DIR}" ]; then
        return 0
    fi

    # 清理旧的数据库备份
    if [ -d "${BACKUP_DIR}/database" ]; then
        local deleted_count=0
        while IFS= read -r file; do
            rm -f "$file"
            ((deleted_count++))
        done < <(find "${BACKUP_DIR}/database" -name "*.sql.gz" -type f -mtime +${BACKUP_RETENTION_DAYS})

        if [ $deleted_count -gt 0 ]; then
            log_success "清理了 ${deleted_count} 个旧数据库备份"
        fi
    fi

    # 清理旧的上传文件备份
    if [ -d "${BACKUP_DIR}/uploads" ]; then
        local deleted_count=0
        while IFS= read -r file; do
            rm -f "$file"
            ((deleted_count++))
        done < <(find "${BACKUP_DIR}/uploads" -name "*.tar.gz" -type f -mtime +${BACKUP_RETENTION_DAYS})

        if [ $deleted_count -gt 0 ]; then
            log_success "清理了 ${deleted_count} 个旧上传文件备份"
        fi
    fi
}

# 创建部署快照
create_deployment_snapshot() {
    log_info "创建部署快照..."

    mkdir -p "${BACKUP_DIR}/snapshots"

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local snapshot_file="${BACKUP_DIR}/snapshots/snapshot_${timestamp}.txt"

    {
        echo "=== 部署快照 ==="
        echo "时间: $(date)"
        echo ""
        echo "=== 运行的容器 ==="
        docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
        echo ""
        echo "=== 镜像版本 ==="
        docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}" | grep "projectcontractledger"
        echo ""
        echo "=== 环境变量 ==="
        cat "${ENV_FILE}" | grep -v "PASSWORD" | grep -v "SECRET"
    } > "${snapshot_file}"

    log_success "部署快照已保存: ${snapshot_file}"
    echo "${snapshot_file}"
}

# 恢复数据库
restore_database() {
    local backup_file="$1"

    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        return 1
    fi

    log_info "恢复数据库: ${backup_file}"

    # 从环境变量文件读取数据库配置
    set -a
    source "${ENV_FILE}"
    set +a

    # 解压并恢复
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "${backup_file}" | docker exec -i contract-ledger-db mysql -u"${DB_USERNAME}" -p"${DB_PASSWORD}" "${DB_DATABASE}"
    else
        docker exec -i contract-ledger-db mysql -u"${DB_USERNAME}" -p"${DB_PASSWORD}" "${DB_DATABASE}" < "${backup_file}"
    fi

    if [ $? -eq 0 ]; then
        log_success "数据库恢复成功"
        return 0
    else
        log_error "数据库恢复失败"
        return 1
    fi
}

# 恢复上传文件
restore_uploads() {
    local backup_file="$1"

    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        return 1
    fi

    log_info "恢复上传文件: ${backup_file}"

    # 解析上传目录路径
    local volume_info
    volume_info=$(parse_volume_mappings)
    local uploads_host_path
    uploads_host_path=$(echo "$volume_info" | grep "UPLOADS_HOST_PATH=" | cut -d'=' -f2)

    if [ -z "$uploads_host_path" ]; then
        log_error "未找到上传目录配置"
        return 1
    fi

    # 解压恢复
    tar -xzf "${backup_file}" -C "$(dirname "$uploads_host_path")"

    if [ $? -eq 0 ]; then
        log_success "上传文件恢复成功"
        return 0
    else
        log_error "上传文件恢复失败"
        return 1
    fi
}

# 回滚到上一个版本
rollback_deployment() {
    log_warning "开始回滚部署..."

    # 查找最新的备份
    local latest_db_backup=$(find "${BACKUP_DIR}/database" -name "*.sql.gz" -type f | sort -r | head -1)
    local latest_uploads_backup=$(find "${BACKUP_DIR}/uploads" -name "*.tar.gz" -type f | sort -r | head -1)

    if [ -z "$latest_db_backup" ] && [ -z "$latest_uploads_backup" ]; then
        log_error "未找到备份文件，无法回滚"
        return 1
    fi

    # 停止当前服务
    log_info "停止当前服务..."
    stop_all_services

    # 恢复数据库
    if [ -n "$latest_db_backup" ]; then
        restore_database "$latest_db_backup"
    fi

    # 恢复上传文件
    if [ -n "$latest_uploads_backup" ]; then
        restore_uploads "$latest_uploads_backup"
    fi

    # 重启服务
    log_info "重启服务..."
    if docker ps --format "table {{.Names}}" | grep -q "nginx-proxy"; then
        start_services "${COMPOSE_FILE_SEPARATED}" "proxy"
    else
        start_services "${COMPOSE_FILE}"
    fi

    log_success "回滚完成"
}

# 日志轮转
rotate_logs() {
    log_info "开始日志轮转..."

    # 解析日志目录路径
    local volume_info
    volume_info=$(parse_volume_mappings)
    local logs_host_path
    logs_host_path=$(echo "$volume_info" | grep "LOGS_HOST_PATH=" | cut -d'=' -f2)

    if [ -z "$logs_host_path" ] || [ ! -d "$logs_host_path" ]; then
        log_warning "日志目录不存在，跳过日志轮转"
        return 0
    fi

    local rotated_count=0
    local deleted_count=0

    # 查找大于指定大小的日志文件
    while IFS= read -r logfile; do
        if [ -f "$logfile" ]; then
            local timestamp=$(date +%Y%m%d_%H%M%S)
            local rotated_file="${logfile}.${timestamp}"

            # 轮转日志
            mv "$logfile" "$rotated_file"
            gzip "$rotated_file"
            touch "$logfile"

            ((rotated_count++))
            log_info "轮转日志: $(basename "$logfile")"
        fi
    done < <(find "$logs_host_path" -name "*.log" -type f -size +${LOG_MAX_SIZE_MB}M)

    # 删除旧日志
    while IFS= read -r logfile; do
        rm -f "$logfile"
        ((deleted_count++))
    done < <(find "$logs_host_path" -name "*.log.*.gz" -type f -mtime +${LOG_RETENTION_DAYS})

    if [ $rotated_count -gt 0 ]; then
        log_success "轮转了 ${rotated_count} 个日志文件"
    fi

    if [ $deleted_count -gt 0 ]; then
        log_success "删除了 ${deleted_count} 个旧日志文件"
    fi

    if [ $rotated_count -eq 0 ] && [ $deleted_count -eq 0 ]; then
        log_info "没有需要轮转或删除的日志文件"
    fi
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

# 清理旧镜像
cleanup_old_images() {
    log_info "清理临时和旧镜像..."

    # 获取当前正在使用的镜像
    local current_images
    current_images=$(docker ps --format "table {{.Image}}" | grep -v "IMAGE" | sort | uniq)

    # 显示清理前的镜像状态
    log_info "清理前镜像统计："
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -10 | sed 's/^/  /'

    # 清理悬空镜像（dangling images）
    log_info "清理悬空镜像..."
    local dangling_count
    dangling_count=$(docker images -f "dangling=true" -q | wc -l)

    if [ "$dangling_count" -gt 0 ]; then
        docker rmi $(docker images -f "dangling=true" -q) 2>/dev/null || true
        log_success "清理了 $dangling_count 个悬空镜像"
    else
        log_info "没有悬空镜像需要清理"
    fi

    # 清理项目相关的旧镜像（保留最新的2个版本）
    log_info "清理项目旧镜像..."

    # 清理后端镜像
    local backend_images
    backend_images=$(docker images --format "{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedAt}}" | \
                    grep "projectcontractledger-backend" | \
                    sort -k3 -r | \
                    tail -n +3)

    if [ -n "$backend_images" ]; then
        echo "$backend_images" | while read -r line; do
            local image_id=$(echo "$line" | awk '{print $2}')
            local image_name=$(echo "$line" | awk '{print $1}')

            # 检查镜像是否正在使用
            if ! echo "$current_images" | grep -q "$image_name"; then
                log_info "删除旧后端镜像: $image_name"
                docker rmi "$image_id" 2>/dev/null || true
            fi
        done
    fi

    # 清理前端镜像
    local frontend_images
    frontend_images=$(docker images --format "{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedAt}}" | \
                     grep "projectcontractledger-frontend" | \
                     sort -k3 -r | \
                     tail -n +3)

    if [ -n "$frontend_images" ]; then
        echo "$frontend_images" | while read -r line; do
            local image_id=$(echo "$line" | awk '{print $2}')
            local image_name=$(echo "$line" | awk '{print $1}')

            # 检查镜像是否正在使用
            if ! echo "$current_images" | grep -q "$image_name"; then
                log_info "删除旧前端镜像: $image_name"
                docker rmi "$image_id" 2>/dev/null || true
            fi
        done
    fi

    # 清理未使用的网络
    log_info "清理未使用的Docker网络..."
    docker network prune -f >/dev/null 2>&1 || true

    # 清理未使用的卷（谨慎操作，只清理匿名卷）
    log_info "清理未使用的匿名卷..."
    docker volume prune -f >/dev/null 2>&1 || true

    # 显示清理后的状态
    log_info "清理后镜像统计："
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -10 | sed 's/^/  /'

    # 显示磁盘空间节省情况
    log_info "Docker系统空间使用情况："
    docker system df | sed 's/^/  /'

    log_success "镜像清理完成"
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

# 验证上传权限
verify_upload_permissions() {
    log_info "验证上传目录权限..."

    # 解析docker-compose.yml中的卷映射
    local volume_info
    volume_info=$(parse_volume_mappings)

    if [ $? -ne 0 ]; then
        log_warning "无法解析Docker Compose文件，跳过权限验证"
        return 0
    fi

    # 提取路径信息
    local uploads_host_path
    local logs_host_path
    uploads_host_path=$(echo "$volume_info" | grep "UPLOADS_HOST_PATH=" | cut -d'=' -f2)
    logs_host_path=$(echo "$volume_info" | grep "LOGS_HOST_PATH=" | cut -d'=' -f2)

    # 验证宿主机目录权限
    if [ -n "$uploads_host_path" ] && [ -d "$uploads_host_path" ]; then
        log_info "宿主机上传目录权限状态："
        ls -la "$(dirname "$uploads_host_path")" | grep "$(basename "$uploads_host_path")" | sed 's/^/  /'

        if [ -d "$uploads_host_path" ]; then
            ls -la "$uploads_host_path/" | sed 's/^/  /'
        fi
    elif [ -n "$uploads_host_path" ]; then
        log_warning "上传目录不存在: $uploads_host_path"
    fi

    if [ -n "$logs_host_path" ] && [ -d "$logs_host_path" ]; then
        log_info "宿主机日志目录权限状态："
        ls -la "$(dirname "$logs_host_path")" | grep "$(basename "$logs_host_path")" | sed 's/^/  /'
    elif [ -n "$logs_host_path" ]; then
        log_warning "日志目录不存在: $logs_host_path"
    fi

    # 如果后端容器正在运行，测试容器内权限
    if docker ps --format "table {{.Names}}" | grep -q "contract-ledger-backend"; then
        log_info "测试容器内权限..."

        # 检查容器内当前用户
        log_info "容器内用户信息："
        docker exec contract-ledger-backend whoami | sed 's/^/  用户: /'
        docker exec contract-ledger-backend id | sed 's/^/  ID: /'

        # 显示容器内目录权限
        log_info "容器内目录权限："
        docker exec contract-ledger-backend ls -la /app/uploads/ | sed 's/^/  /'

        # 测试目录创建权限
        if docker exec contract-ledger-backend mkdir -p /app/uploads/contracts/test 2>/dev/null; then
            log_success "contracts目录权限正常"
            docker exec contract-ledger-backend rmdir /app/uploads/contracts/test 2>/dev/null || true
        else
            log_error "contracts目录权限失败 - 无法创建子目录"
            log_error "这是导致 'EACCES: permission denied, mkdir' 错误的原因"
        fi

        # 测试文件创建权限
        if docker exec contract-ledger-backend touch /app/uploads/test.txt 2>/dev/null; then
            log_success "文件创建权限正常"
            docker exec contract-ledger-backend rm /app/uploads/test.txt 2>/dev/null || true
        else
            log_error "文件创建权限失败"
        fi
    else
        log_warning "后端容器未运行，无法测试容器内权限"
    fi
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
        # 优先使用新的HOST_PORT配置
        BACKEND_PORT_VAL=$(grep "^BACKEND_HOST_PORT=" "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
        FRONTEND_PORT_VAL=$(grep "^FRONTEND_HOST_PORT=" "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)

        # 如果没有HOST_PORT配置，回退到旧的PORT配置（向后兼容）
        if [ -z "$BACKEND_PORT_VAL" ]; then
            BACKEND_PORT_VAL=$(grep "^BACKEND_PORT=" "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
        fi
        if [ -z "$FRONTEND_PORT_VAL" ]; then
            FRONTEND_PORT_VAL=$(grep "^FRONTEND_PORT=" "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
        fi

        # 使用默认值如果提取失败
        BACKEND_PORT_VAL=${BACKEND_PORT_VAL:-8080}
        FRONTEND_PORT_VAL=${FRONTEND_PORT_VAL:-8000}
    fi

    # 检查后端健康状态
    log_info "检查后端服务 (端口 $BACKEND_PORT_VAL)..."

    local backend_healthy=false
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        if curl -f http://localhost:$BACKEND_PORT_VAL/health &> /dev/null; then
            log_success "后端服务运行正常"
            backend_healthy=true
            break
        else
            log_info "等待后端服务启动... ($i/$HEALTH_CHECK_RETRIES)"
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done

    if [ "$backend_healthy" = false ]; then
        log_error "后端服务健康检查失败"
        return 1
    fi

    # 检查前端服务
    log_info "检查前端服务 (端口 $FRONTEND_PORT_VAL)..."

    local frontend_healthy=false
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        if curl -f http://localhost:$FRONTEND_PORT_VAL &> /dev/null; then
            log_success "前端服务运行正常"
            frontend_healthy=true
            break
        else
            log_info "等待前端服务启动... ($i/$HEALTH_CHECK_RETRIES)"
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done

    if [ "$frontend_healthy" = false ]; then
        log_error "前端服务健康检查失败"
        return 1
    fi

    # 显示容器状态
    log_info "容器状态:"
    docker-compose -f "${compose_file}" --env-file "${ENV_FILE}" ps

    return 0
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
        # 优先使用新的HOST_PORT配置
        FRONTEND_PORT_VAL=$(grep "^FRONTEND_HOST_PORT=" "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
        BACKEND_PORT_VAL=$(grep "^BACKEND_HOST_PORT=" "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
        PROXY_PORT_VAL=$(grep "^PROXY_HOST_PORT=" "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)

        # 如果没有HOST_PORT配置，回退到旧的PORT配置（向后兼容）
        if [ -z "$FRONTEND_PORT_VAL" ]; then
            FRONTEND_PORT_VAL=$(grep "^FRONTEND_PORT=" "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
        fi
        if [ -z "$BACKEND_PORT_VAL" ]; then
            BACKEND_PORT_VAL=$(grep "^BACKEND_PORT=" "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
        fi
        if [ -z "$PROXY_PORT_VAL" ]; then
            PROXY_PORT_VAL=$(grep "^PROXY_PORT=" "${ENV_FILE}" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
        fi

        # 使用默认值如果提取失败
        FRONTEND_PORT_VAL=${FRONTEND_PORT_VAL:-8000}
        BACKEND_PORT_VAL=${BACKEND_PORT_VAL:-8080}
        PROXY_PORT_VAL=${PROXY_PORT_VAL:-8001}
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
    echo "  --cleanup   清理临时和旧镜像"
    echo "  --backup    手动备份数据库和上传文件"
    echo "  --rollback  回滚到上一个备份"
    echo "  --rotate-logs 手动执行日志轮转"
    echo "  --help      显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                # 基础部署"
    echo "  $0 --basic        # 基础部署"
    echo "  $0 --proxy        # 带代理的部署"
    echo "  $0 --update       # 更新部署"
    echo "  $0 --logs         # 查看日志"
    echo "  $0 --cleanup      # 清理旧镜像"
    echo "  $0 --backup       # 手动备份"
    echo "  $0 --rollback     # 回滚部署"
    echo "  $0 --rotate-logs  # 日志轮转"
    echo ""
    echo "配置参数（在脚本顶部修改）:"
    echo "  BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS}    # 备份保留天数"
    echo "  HEALTH_CHECK_RETRIES=${HEALTH_CHECK_RETRIES}     # 健康检查重试次数"
    echo "  HEALTH_CHECK_INTERVAL=${HEALTH_CHECK_INTERVAL}    # 健康检查间隔（秒）"
    echo "  LOG_MAX_SIZE_MB=${LOG_MAX_SIZE_MB}          # 日志文件最大大小（MB）"
    echo "  LOG_RETENTION_DAYS=${LOG_RETENTION_DAYS}      # 日志保留天数"
}

# 解析docker-compose.yml中的卷映射
parse_volume_mappings() {
    local compose_file="${1:-docker-compose.yml}"

    if [ ! -f "$compose_file" ]; then
        log_error "Docker Compose文件不存在: $compose_file"
        return 1
    fi

    # 提取后端服务的卷映射
    # 查找backend服务的volumes配置
    local in_backend_volumes=false
    local uploads_host_path=""
    local logs_host_path=""

    while IFS= read -r line; do
        # 检测是否进入backend服务的volumes部分
        if [[ "$line" =~ ^[[:space:]]*volumes:[[:space:]]*$ ]] && [ "$in_backend_volumes" = true ]; then
            continue
        elif [[ "$line" =~ ^[[:space:]]*-[[:space:]]*(.+):/app/uploads[[:space:]]*$ ]]; then
            uploads_host_path="${BASH_REMATCH[1]}"
        elif [[ "$line" =~ ^[[:space:]]*-[[:space:]]*(.+):/app/logs[[:space:]]*$ ]]; then
            logs_host_path="${BASH_REMATCH[1]}"
        elif [[ "$line" =~ ^[[:space:]]*backend:[[:space:]]*$ ]]; then
            in_backend_volumes=true
        elif [[ "$line" =~ ^[[:space:]]*[a-zA-Z_-]+:[[:space:]]*$ ]] && [ "$in_backend_volumes" = true ]; then
            # 进入其他服务，退出backend解析
            in_backend_volumes=false
        fi
    done < "$compose_file"

    # 输出解析结果
    echo "UPLOADS_HOST_PATH=$uploads_host_path"
    echo "LOGS_HOST_PATH=$logs_host_path"
}

# 初始化数据目录
init_data_directories() {
    log_info "初始化数据目录..."

    # 解析docker-compose.yml中的卷映射
    local volume_info
    volume_info=$(parse_volume_mappings)

    if [ $? -ne 0 ]; then
        log_error "解析Docker Compose文件失败"
        return 1
    fi

    # 提取路径信息
    local uploads_host_path
    local logs_host_path
    uploads_host_path=$(echo "$volume_info" | grep "UPLOADS_HOST_PATH=" | cut -d'=' -f2)
    logs_host_path=$(echo "$volume_info" | grep "LOGS_HOST_PATH=" | cut -d'=' -f2)

    log_info "检测到卷映射配置:"
    log_info "  上传目录: $uploads_host_path -> /app/uploads"
    log_info "  日志目录: $logs_host_path -> /app/logs"

    # 根据路径类型决定创建方式
    if [[ "$uploads_host_path" =~ ^/ ]]; then
        # 绝对路径 - 需要sudo权限
        log_info "检测到绝对路径映射，使用sudo创建目录..."

        if [ -n "$uploads_host_path" ]; then
            sudo mkdir -p "$uploads_host_path/contracts"
            sudo mkdir -p "$uploads_host_path/invoices"
            sudo mkdir -p "$uploads_host_path/temp"

            log_info "设置上传目录权限: $uploads_host_path"
            sudo chmod -R 777 "$uploads_host_path"
            sudo chown -R 1001:1001 "$uploads_host_path" 2>/dev/null || {
                log_warning "无法设置所有者，使用777权限模式"
            }
        fi

        if [ -n "$logs_host_path" ]; then
            sudo mkdir -p "$logs_host_path"

            log_info "设置日志目录权限: $logs_host_path"
            sudo chmod -R 755 "$logs_host_path"
            sudo chown -R 1001:1001 "$logs_host_path" 2>/dev/null || true
        fi

        log_success "绝对路径目录创建完成，权限已设置"

    else
        # 相对路径 - 直接创建
        log_info "检测到相对路径映射，直接创建目录..."

        if [ -n "$uploads_host_path" ]; then
            mkdir -p "$uploads_host_path/contracts"
            mkdir -p "$uploads_host_path/invoices"
            mkdir -p "$uploads_host_path/temp"
            chmod -R 777 "$uploads_host_path"
        fi

        if [ -n "$logs_host_path" ]; then
            mkdir -p "$logs_host_path"
            chmod -R 755 "$logs_host_path"
        fi

        log_success "相对路径目录创建完成，权限已设置"
    fi

    # 如果没有找到卷映射，使用默认方式
    if [ -z "$uploads_host_path" ] && [ -z "$logs_host_path" ]; then
        log_warning "未找到卷映射配置，使用默认方式..."

        if [ -f "./init-data-dirs.sh" ]; then
            chmod +x ./init-data-dirs.sh
            ./init-data-dirs.sh
        else
            mkdir -p ./data/logs
            mkdir -p ./data/uploads/contracts
            mkdir -p ./data/uploads/invoices
            mkdir -p ./data/uploads/temp
            chmod -R 755 ./data/logs
            chmod -R 777 ./data/uploads
            log_success "默认目录创建完成，权限已设置"
        fi
    fi
}

# 基础部署
deploy_basic() {
    log_info "开始基础部署..."

    check_docker
    check_env_file

    # 创建部署前备份
    log_info "创建部署前备份..."
    local db_backup=$(backup_database)
    local uploads_backup=$(backup_uploads)
    local snapshot=$(create_deployment_snapshot)

    # 清理旧备份
    cleanup_old_backups

    init_data_directories
    pull_images "${COMPOSE_FILE}"
    cleanup_old_images
    stop_services "${COMPOSE_FILE}"
    start_services "${COMPOSE_FILE}"

    # 检查服务健康状态
    if ! check_services "${COMPOSE_FILE}"; then
        log_error "服务健康检查失败，开始回滚..."
        rollback_deployment
        return 1
    fi

    verify_upload_permissions

    # 日志轮转
    rotate_logs

    show_access_info "basic"

    log_success "基础部署完成！"
}

# 代理部署
deploy_proxy() {
    log_info "开始代理部署..."

    check_docker
    check_env_file

    # 创建部署前备份
    log_info "创建部署前备份..."
    local db_backup=$(backup_database)
    local uploads_backup=$(backup_uploads)
    local snapshot=$(create_deployment_snapshot)

    # 清理旧备份
    cleanup_old_backups

    init_data_directories
    pull_images "${COMPOSE_FILE_SEPARATED}"
    cleanup_old_images
    stop_services "${COMPOSE_FILE_SEPARATED}"
    start_services "${COMPOSE_FILE_SEPARATED}" "proxy"

    # 检查服务健康状态
    if ! check_services "${COMPOSE_FILE_SEPARATED}"; then
        log_error "服务健康检查失败，开始回滚..."
        rollback_deployment
        return 1
    fi

    verify_upload_permissions

    # 日志轮转
    rotate_logs

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
        --cleanup)
            cleanup_old_images
            ;;
        --backup)
            log_info "开始手动备份..."
            backup_database
            backup_uploads
            create_deployment_snapshot
            cleanup_old_backups
            log_success "手动备份完成"
            ;;
        --rollback)
            rollback_deployment
            ;;
        --rotate-logs)
            rotate_logs
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
