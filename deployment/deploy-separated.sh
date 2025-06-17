#!/bin/bash

# 分离式前后端部署脚本
# 用于部署分离的前后端容器

set -e

# 颜色定义
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

# 检查Docker是否安装
check_docker() {
    log_info "检查Docker环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
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
    
    if [ ! -f ".env.separated" ]; then
        log_warning "环境变量文件 .env.separated 不存在"
        
        if [ -f ".env.separated.template" ]; then
            log_info "复制模板文件..."
            cp .env.separated.template .env.separated
            log_warning "请编辑 .env.separated 文件，填写正确的配置值"
            log_warning "特别注意以下配置项："
            echo "  - DB_USERNAME, DB_PASSWORD: 数据库用户名和密码"
            echo "  - REDIS_PASSWORD: Redis密码"
            echo "  - JWT_SECRET: JWT密钥"
            echo "  - BACKEND_HOST: 后端服务地址"
            read -p "配置完成后按回车继续..."
        else
            log_error "环境变量模板文件不存在"
            exit 1
        fi
    fi
    
    log_success "环境变量文件检查通过"
}

# 拉取最新镜像
pull_images() {
    log_info "拉取最新镜像..."
    
    docker-compose -f docker-compose.separated.yml pull
    
    log_success "镜像拉取完成"
}

# 停止现有服务
stop_services() {
    log_info "停止现有服务..."
    
    docker-compose -f docker-compose.separated.yml down
    
    log_success "服务停止完成"
}

# 启动服务
start_services() {
    log_info "启动分离式前后端服务..."
    
    docker-compose -f docker-compose.separated.yml --env-file .env.separated up -d
    
    log_success "服务启动完成"
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    sleep 10
    
    # 检查后端健康状态
    BACKEND_PORT=$(grep BACKEND_PORT .env.separated | cut -d'=' -f2 | tr -d ' ')
    BACKEND_PORT=${BACKEND_PORT:-8080}
    
    log_info "检查后端服务 (端口 $BACKEND_PORT)..."
    if curl -f http://localhost:$BACKEND_PORT/health &> /dev/null; then
        log_success "后端服务运行正常"
    else
        log_warning "后端服务可能未完全启动，请稍后检查"
    fi
    
    # 检查前端服务
    FRONTEND_PORT=$(grep FRONTEND_PORT .env.separated | cut -d'=' -f2 | tr -d ' ')
    FRONTEND_PORT=${FRONTEND_PORT:-80}
    
    log_info "检查前端服务 (端口 $FRONTEND_PORT)..."
    if curl -f http://localhost:$FRONTEND_PORT &> /dev/null; then
        log_success "前端服务运行正常"
    else
        log_warning "前端服务可能未完全启动，请稍后检查"
    fi
    
    # 显示容器状态
    log_info "容器状态:"
    docker-compose -f docker-compose.separated.yml ps
}

# 显示访问信息
show_access_info() {
    FRONTEND_PORT=$(grep FRONTEND_PORT .env.separated | cut -d'=' -f2 | tr -d ' ')
    FRONTEND_PORT=${FRONTEND_PORT:-80}
    
    BACKEND_PORT=$(grep BACKEND_PORT .env.separated | cut -d'=' -f2 | tr -d ' ')
    BACKEND_PORT=${BACKEND_PORT:-8080}
    
    echo ""
    log_success "=== 部署完成 ==="
    echo "前端访问地址: http://localhost:$FRONTEND_PORT"
    echo "后端API地址: http://localhost:$BACKEND_PORT"
    echo "后端健康检查: http://localhost:$BACKEND_PORT/health"
    echo ""
    echo "管理命令:"
    echo "  查看日志: docker-compose -f docker-compose.separated.yml logs -f"
    echo "  停止服务: docker-compose -f docker-compose.separated.yml down"
    echo "  重启服务: docker-compose -f docker-compose.separated.yml restart"
}

# 主函数
main() {
    echo "=== 分离式前后端部署脚本 ==="
    echo ""
    
    # 切换到部署目录
    cd "$(dirname "$0")"
    
    check_docker
    check_env_file
    pull_images
    stop_services
    start_services
    check_services
    show_access_info
    
    log_success "部署完成！"
}

# 执行主函数
main "$@"
