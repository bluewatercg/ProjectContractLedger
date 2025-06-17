#!/bin/bash

# 测试分离式前后端容器构建脚本

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

# 检查Docker环境
check_docker() {
    log_info "检查Docker环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker守护进程未运行"
        return 1
    fi
    
    log_success "Docker环境正常"
    return 0
}

# 测试后端容器构建
test_backend_build() {
    log_info "测试后端容器构建..."
    
    cd apps/backend
    
    # 构建后端镜像
    log_info "构建后端镜像..."
    if docker build -t test-backend:latest .; then
        log_success "后端镜像构建成功"
    else
        log_error "后端镜像构建失败"
        cd ../..
        return 1
    fi
    
    # 测试后端容器启动
    log_info "测试后端容器启动..."
    docker run -d --name test-backend-container \
        -p 18080:8080 \
        -e NODE_ENV=production \
        -e DB_HOST=localhost \
        -e DB_USERNAME=test \
        -e DB_PASSWORD=test \
        -e DB_DATABASE=test \
        -e REDIS_HOST=localhost \
        -e JWT_SECRET=test-secret \
        test-backend:latest || {
        log_error "后端容器启动失败"
        cd ../..
        return 1
    }
    
    # 等待容器启动
    log_info "等待后端容器启动..."
    sleep 15
    
    # 检查容器状态
    if docker ps | grep test-backend-container &> /dev/null; then
        log_success "后端容器运行正常"
    else
        log_error "后端容器未正常运行"
        docker logs test-backend-container
        cleanup_backend
        cd ../..
        return 1
    fi
    
    # 清理测试容器
    cleanup_backend
    cd ../..
    return 0
}

# 测试前端容器构建
test_frontend_build() {
    log_info "测试前端容器构建..."
    
    cd apps/frontend
    
    # 构建前端镜像
    log_info "构建前端镜像..."
    if docker build -t test-frontend:latest .; then
        log_success "前端镜像构建成功"
    else
        log_error "前端镜像构建失败"
        cd ../..
        return 1
    fi
    
    # 测试前端容器启动
    log_info "测试前端容器启动..."
    docker run -d --name test-frontend-container \
        -p 18081:80 \
        -e BACKEND_HOST=localhost \
        -e BACKEND_PORT=8080 \
        test-frontend:latest || {
        log_error "前端容器启动失败"
        cd ../..
        return 1
    }
    
    # 等待容器启动
    log_info "等待前端容器启动..."
    sleep 10
    
    # 检查容器状态
    if docker ps | grep test-frontend-container &> /dev/null; then
        log_success "前端容器运行正常"
    else
        log_error "前端容器未正常运行"
        docker logs test-frontend-container
        cleanup_frontend
        cd ../..
        return 1
    fi
    
    # 测试前端访问
    log_info "测试前端访问..."
    if curl -f http://localhost:18081 &> /dev/null; then
        log_success "前端服务可访问"
    else
        log_warning "前端服务可能未完全启动"
    fi
    
    # 清理测试容器
    cleanup_frontend
    cd ../..
    return 0
}

# 测试分离部署配置
test_separated_deployment() {
    log_info "测试分离部署配置..."
    
    cd deployment
    
    # 检查配置文件
    if [ ! -f "docker-compose.separated.yml" ]; then
        log_error "分离部署配置文件不存在"
        cd ..
        return 1
    fi
    
    if [ ! -f ".env.separated.template" ]; then
        log_error "环境变量模板文件不存在"
        cd ..
        return 1
    fi
    
    # 验证docker-compose配置
    log_info "验证docker-compose配置..."
    if docker-compose -f docker-compose.separated.yml config &> /dev/null; then
        log_success "docker-compose配置有效"
    else
        log_error "docker-compose配置无效"
        cd ..
        return 1
    fi
    
    cd ..
    return 0
}

# 清理后端测试资源
cleanup_backend() {
    log_info "清理后端测试资源..."
    docker stop test-backend-container &> /dev/null || true
    docker rm test-backend-container &> /dev/null || true
    docker rmi test-backend:latest &> /dev/null || true
}

# 清理前端测试资源
cleanup_frontend() {
    log_info "清理前端测试资源..."
    docker stop test-frontend-container &> /dev/null || true
    docker rm test-frontend-container &> /dev/null || true
    docker rmi test-frontend:latest &> /dev/null || true
}

# 清理所有测试资源
cleanup_all() {
    log_info "清理所有测试资源..."
    cleanup_backend
    cleanup_frontend
}

# 显示测试结果
show_results() {
    echo ""
    log_success "=== 测试完成 ==="
    echo "✅ Docker环境检查"
    echo "✅ 后端容器构建和启动"
    echo "✅ 前端容器构建和启动"
    echo "✅ 分离部署配置验证"
    echo ""
    echo "下一步："
    echo "1. 提交代码到GitHub触发自动构建"
    echo "2. 使用 deployment/deploy-separated.sh 进行生产部署"
    echo "3. 或使用 docker-compose -f deployment/docker-compose.separated.yml up -d"
}

# 主函数
main() {
    echo "=== 分离式前后端容器构建测试 ==="
    echo ""
    
    # 切换到项目根目录
    cd "$(dirname "$0")/.."
    
    # 设置错误处理
    trap cleanup_all EXIT
    
    # 执行测试
    if ! check_docker; then
        exit 1
    fi
    
    if ! test_backend_build; then
        log_error "后端构建测试失败"
        exit 1
    fi
    
    if ! test_frontend_build; then
        log_error "前端构建测试失败"
        exit 1
    fi
    
    if ! test_separated_deployment; then
        log_error "分离部署配置测试失败"
        exit 1
    fi
    
    show_results
    log_success "所有测试通过！"
}

# 执行主函数
main "$@"
