#!/bin/bash

# 生产环境部署脚本 - 确保拉取最新镜像并启动
# 适用于通过 GitHub 构建镜像的部署流程

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
CONTAINER_NAME="contract-ledger"
BACKEND_IMAGE="ghcr.io/bluewatercg/projectcontractledger-backend"
FRONTEND_IMAGE="ghcr.io/bluewatercg/projectcontractledger-frontend"
HEALTH_URL="http://192.168.1.115:8080/health"
FRONTEND_URL="http://192.168.1.115:8000"

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
    echo "           生产环境部署脚本 - 项目合同管理系统"
    echo "=================================================================="
    echo "时间: $(date)"
    echo "镜像: $IMAGE_NAME"
    echo "健康检查: $HEALTH_URL"
    echo "前端地址: $FRONTEND_URL"
    echo "=================================================================="
    echo ""
}

# 检查必要文件
check_prerequisites() {
    log_step "检查部署环境..."
    
    # 检查 docker-compose 文件
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "未找到 $COMPOSE_FILE 文件"
        exit 1
    fi
    
    # 检查环境变量文件
    if [ ! -f "$ENV_FILE" ]; then
        log_warn "未找到 $ENV_FILE 文件，将使用默认配置"
    fi
    
    # 检查 Docker 是否运行
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker 未运行，请启动 Docker"
        exit 1
    fi
    
    # 检查 docker-compose 是否可用
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose 未安装或不在 PATH 中"
        exit 1
    fi
    
    log_info "环境检查通过"
}

# 备份当前运行的容器
backup_current_deployment() {
    log_step "备份当前部署..."
    
    # 检查是否有运行的容器
    if docker-compose ps | grep -q "Up"; then
        # 创建镜像备份
        BACKUP_TAG="backup-$(date +%Y%m%d-%H%M%S)"
        
        # 获取当前运行的镜像ID
        CURRENT_IMAGE=$(docker-compose images -q | head -1)
        if [ ! -z "$CURRENT_IMAGE" ]; then
            docker tag "$CURRENT_IMAGE" "${IMAGE_NAME}:${BACKUP_TAG}"
            log_info "当前镜像已备份为: ${IMAGE_NAME}:${BACKUP_TAG}"
        fi
        
        # 导出当前配置
        docker-compose config > "docker-compose.backup.$(date +%Y%m%d-%H%M%S).yml"
        log_info "当前配置已备份"
    else
        log_info "没有运行中的容器需要备份"
    fi
}

# 清理旧镜像缓存
cleanup_old_images() {
    log_step "清理旧镜像缓存..."
    
    # 停止并删除容器（保留数据卷）
    log_info "停止当前服务..."
    docker-compose down --remove-orphans
    
    # 删除旧的镜像（强制拉取最新版本）
    log_info "删除本地镜像缓存..."
    docker rmi "${IMAGE_NAME}:latest" 2>/dev/null || log_warn "本地镜像不存在或已删除"
    
    # 清理未使用的镜像
    log_info "清理未使用的镜像..."
    docker image prune -f
    
    log_info "镜像缓存清理完成"
}

# 拉取最新镜像
pull_latest_image() {
    log_step "拉取最新镜像..."
    
    # 强制拉取最新镜像
    log_info "从 GitHub Container Registry 拉取最新镜像..."
    docker-compose pull --ignore-pull-failures
    
    # 验证镜像拉取成功
    if docker images | grep -q "$IMAGE_NAME"; then
        # 显示镜像信息
        log_info "镜像拉取成功，镜像信息："
        docker images | grep "$IMAGE_NAME" | head -1
        
        # 显示镜像创建时间
        IMAGE_ID=$(docker images --format "{{.ID}}" "$IMAGE_NAME:latest" | head -1)
        if [ ! -z "$IMAGE_ID" ]; then
            CREATED=$(docker inspect --format='{{.Created}}' "$IMAGE_ID" | cut -d'T' -f1)
            log_info "镜像创建时间: $CREATED"
        fi
    else
        log_error "镜像拉取失败"
        exit 1
    fi
}

# 启动服务
start_services() {
    log_step "启动服务..."
    
    # 启动服务
    log_info "启动容器..."
    docker-compose up -d
    
    # 显示容器状态
    log_info "容器状态："
    docker-compose ps
}

# 等待服务启动
wait_for_services() {
    log_step "等待服务启动..."
    
    # 等待后端服务
    log_info "等待后端服务启动..."
    for i in {1..60}; do
        if curl -s "$HEALTH_URL" > /dev/null 2>&1; then
            log_info "后端服务已启动 (耗时: ${i}秒)"
            break
        fi
        
        if [ $i -eq 60 ]; then
            log_error "后端服务启动超时 (60秒)"
            show_logs
            exit 1
        fi
        
        echo -n "."
        sleep 1
    done
    echo ""
    
    # 等待前端服务
    log_info "等待前端服务启动..."
    for i in {1..30}; do
        if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
            log_info "前端服务已启动 (耗时: ${i}秒)"
            break
        fi
        
        if [ $i -eq 30 ]; then
            log_error "前端服务启动超时 (30秒)"
            show_logs
            exit 1
        fi
        
        echo -n "."
        sleep 1
    done
    echo ""
}

# 健康检查
health_check() {
    log_step "执行健康检查..."
    
    # 检查后端健康状态
    log_info "检查后端健康状态..."
    HEALTH_RESPONSE=$(curl -s "$HEALTH_URL" || echo "failed")
    if echo "$HEALTH_RESPONSE" | grep -q "success\|ok\|healthy"; then
        log_info "✅ 后端健康检查通过"
    else
        log_warn "⚠️  后端健康检查异常: $HEALTH_RESPONSE"
    fi
    
    # 检查前端访问
    log_info "检查前端访问..."
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
    if [ "$FRONTEND_STATUS" = "200" ]; then
        log_info "✅ 前端访问正常"
    else
        log_warn "⚠️  前端访问异常 (HTTP $FRONTEND_STATUS)"
    fi
    
    # 检查API路径修复
    log_info "检查API路径修复..."
    LOGIN_API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/api/v1/auth/login")
    if [ "$LOGIN_API_STATUS" = "401" ] || [ "$LOGIN_API_STATUS" = "400" ]; then
        log_info "✅ 登录API路径正确 (HTTP $LOGIN_API_STATUS)"
    elif [ "$LOGIN_API_STATUS" = "404" ]; then
        log_error "❌ 登录API仍然404，修复未生效"
    else
        log_warn "⚠️  登录API状态异常 (HTTP $LOGIN_API_STATUS)"
    fi
}

# 显示日志
show_logs() {
    log_step "显示最近日志..."
    echo "=== 最近50行日志 ==="
    docker-compose logs --tail 50
}

# 显示部署结果
show_deployment_result() {
    log_step "部署结果总结..."
    
    echo ""
    echo "=================================================================="
    echo "                        部署完成"
    echo "=================================================================="
    echo "🌐 前端地址: $FRONTEND_URL"
    echo "🔧 后端API: http://192.168.1.115:8080"
    echo "❤️  健康检查: $HEALTH_URL"
    echo "📊 API文档: ${FRONTEND_URL}/api-docs"
    echo ""
    echo "🔍 验证步骤:"
    echo "1. 访问前端: $FRONTEND_URL"
    echo "2. 测试登录功能"
    echo "3. 测试文件上传功能"
    echo ""
    echo "📋 管理命令:"
    echo "- 查看日志: docker-compose logs -f"
    echo "- 查看状态: docker-compose ps"
    echo "- 重启服务: docker-compose restart"
    echo "- 停止服务: docker-compose down"
    echo "=================================================================="
}

# 错误处理
handle_error() {
    log_error "部署过程中出现错误"
    log_info "显示错误日志..."
    show_logs
    
    echo ""
    log_warn "如需回滚，可以使用备份镜像:"
    docker images | grep backup | head -3
    
    exit 1
}

# 主函数
main() {
    # 设置错误处理
    trap handle_error ERR
    
    show_header
    check_prerequisites
    backup_current_deployment
    cleanup_old_images
    pull_latest_image
    start_services
    wait_for_services
    health_check
    show_deployment_result
    
    log_info "🎉 部署成功完成！"
}

# 处理命令行参数
case "${1:-}" in
    "logs")
        docker-compose logs -f
        ;;
    "status")
        docker-compose ps
        ;;
    "health")
        health_check
        ;;
    "backup")
        backup_current_deployment
        ;;
    *)
        main
        ;;
esac
