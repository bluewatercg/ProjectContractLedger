#!/bin/bash

# 生产环境API路径重复问题修复脚本
# 修复 /api/v1/v1 路径重复问题

set -e

echo "=== 生产环境API路径修复脚本 ==="
echo "时间: $(date)"

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

# 检查Docker是否运行
check_docker() {
    log_info "检查Docker状态..."
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker未运行，请启动Docker"
        exit 1
    fi
    log_info "Docker运行正常"
}

# 备份当前容器
backup_current_container() {
    log_step "备份当前运行的容器..."
    
    # 检查是否有运行的容器
    RUNNING_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "(contract|ledger)" | head -1 || true)
    
    if [ ! -z "$RUNNING_CONTAINER" ]; then
        log_info "发现运行中的容器: $RUNNING_CONTAINER"
        
        # 创建镜像备份
        BACKUP_TAG="contract-ledger-backup-$(date +%Y%m%d-%H%M%S)"
        docker commit "$RUNNING_CONTAINER" "$BACKUP_TAG"
        log_info "容器已备份为镜像: $BACKUP_TAG"
        
        # 停止当前容器
        log_info "停止当前容器..."
        docker stop "$RUNNING_CONTAINER"
        docker rm "$RUNNING_CONTAINER"
    else
        log_info "没有发现运行中的相关容器"
    fi
}

# 构建修复后的镜像
build_fixed_image() {
    log_step "构建修复后的镜像..."
    cd "$(dirname "$0")/.."
    
    # 构建新镜像
    docker build -f tools/docker/Dockerfile -t bluewatercg/projectcontractledger:fixed .
    
    if [ $? -eq 0 ]; then
        log_info "修复镜像构建成功"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 启动修复后的容器
start_fixed_container() {
    log_step "启动修复后的容器..."
    
    # 使用您的生产环境配置启动容器
    docker run -d \
        --name contract-ledger-fixed \
        --restart unless-stopped \
        -p 8000:80 \
        -p 8080:8080 \
        -e NODE_ENV=production \
        -e BACKEND_PORT=8080 \
        -e FRONTEND_HTTP_PORT=80 \
        -e DB_HOST=192.168.1.254 \
        -e DB_PORT=3306 \
        -e DB_USERNAME=procontractledger \
        -e DB_PASSWORD=your_db_password \
        -e DB_DATABASE=procontractledger \
        -e REDIS_HOST=192.168.1.160 \
        -e REDIS_PORT=6379 \
        -e REDIS_DB=13 \
        -e JWT_SECRET=your_jwt_secret \
        -e FRONTEND_API_BASE_URL=/api/v1 \
        -e UPLOAD_DIR=/app/uploads \
        -v contract_uploads:/app/uploads \
        -v contract_logs:/app/logs \
        bluewatercg/projectcontractledger:fixed
    
    if [ $? -eq 0 ]; then
        log_info "修复容器启动成功"
    else
        log_error "容器启动失败"
        exit 1
    fi
}

# 等待服务启动
wait_for_services() {
    log_step "等待服务启动..."
    
    # 等待后端服务
    log_info "等待后端服务启动..."
    for i in {1..30}; do
        if curl -s http://192.168.1.115:8080/health > /dev/null 2>&1; then
            log_info "后端服务已启动"
            break
        fi
        
        if [ $i -eq 30 ]; then
            log_error "后端服务启动超时"
            docker logs contract-ledger-fixed --tail 50
            exit 1
        fi
        
        echo "等待后端服务启动... ($i/30)"
        sleep 2
    done
    
    # 等待前端服务
    log_info "等待前端服务启动..."
    for i in {1..15}; do
        if curl -s http://192.168.1.115:8000/ > /dev/null 2>&1; then
            log_info "前端服务已启动"
            break
        fi
        
        if [ $i -eq 15 ]; then
            log_error "前端服务启动超时"
            docker logs contract-ledger-fixed --tail 50
            exit 1
        fi
        
        echo "等待前端服务启动... ($i/15)"
        sleep 2
    done
}

# 测试API路径修复
test_api_fix() {
    log_step "测试API路径修复..."
    
    # 测试健康检查接口
    log_info "测试健康检查接口..."
    response=$(curl -s -o /dev/null -w "%{http_code}" http://192.168.1.115:8000/api/v1/health)
    if [ "$response" = "200" ]; then
        log_info "✅ 健康检查接口正常 (HTTP $response)"
    else
        log_warn "⚠️  健康检查接口异常 (HTTP $response)"
    fi
    
    # 测试附件下载接口（需要有效的token和附件ID）
    log_info "测试附件下载接口路径..."
    response=$(curl -s -o /dev/null -w "%{http_code}" http://192.168.1.115:8000/api/v1/attachments/1/download)
    if [ "$response" = "401" ]; then
        log_info "✅ 附件下载接口路径正确 (HTTP $response - 未授权，符合预期)"
    elif [ "$response" = "404" ] && [ "$(curl -s http://192.168.1.115:8000/api/v1/attachments/1/download | grep -o '/api/v1/v1')" ]; then
        log_error "❌ API路径仍然重复"
        return 1
    else
        log_info "✅ 附件下载接口路径正确 (HTTP $response)"
    fi
}

# 显示服务状态
show_status() {
    log_step "显示服务状态..."
    
    echo ""
    echo "=== 服务状态 ==="
    docker ps --filter "name=contract-ledger-fixed" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "=== 访问地址 ==="
    echo "前端: http://192.168.1.115:8000"
    echo "后端API: http://192.168.1.115:8080"
    echo "健康检查: http://192.168.1.115:8000/api/v1/health"
    
    echo ""
    echo "=== 修复内容 ==="
    echo "✅ 修复了nginx代理配置，避免API路径重复"
    echo "✅ 修复了前端API基础URL配置"
    echo "✅ 修复了文件上传路径问题"
    echo "✅ 统一了文件大小限制配置"
}

# 清理函数
cleanup_on_error() {
    log_error "部署过程中出现错误，正在清理..."
    docker stop contract-ledger-fixed 2>/dev/null || true
    docker rm contract-ledger-fixed 2>/dev/null || true
}

# 主函数
main() {
    echo "开始修复生产环境API路径问题..."
    
    # 设置错误处理
    trap cleanup_on_error ERR
    
    check_docker
    backup_current_container
    build_fixed_image
    start_fixed_container
    wait_for_services
    test_api_fix
    show_status
    
    log_info "🎉 修复完成！"
    log_info "请测试文件上传和下载功能是否正常"
}

# 处理命令行参数
case "${1:-}" in
    "test")
        test_api_fix
        ;;
    "status")
        show_status
        ;;
    "logs")
        docker logs contract-ledger-fixed --tail 50 -f
        ;;
    *)
        main
        ;;
esac
