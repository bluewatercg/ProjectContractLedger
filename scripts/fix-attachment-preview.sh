#!/bin/bash

# 附件预览修复脚本
# 修复附件预览404问题

set -e

echo "=== 附件预览修复脚本 ==="
echo "修复附件预览404问题"
echo ""

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

# 检查Docker是否运行
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker未运行，请先启动Docker"
        exit 1
    fi
    log_success "Docker运行正常"
}

# 检查容器状态
check_containers() {
    log_info "检查容器状态..."
    
    # 检查前端容器
    if docker ps --format "table {{.Names}}" | grep -q "contract-ledger-frontend"; then
        log_success "前端容器运行中"
        FRONTEND_RUNNING=true
    else
        log_warning "前端容器未运行"
        FRONTEND_RUNNING=false
    fi
    
    # 检查后端容器
    if docker ps --format "table {{.Names}}" | grep -q "contract-ledger-backend"; then
        log_success "后端容器运行中"
        BACKEND_RUNNING=true
    else
        log_warning "后端容器未运行"
        BACKEND_RUNNING=false
    fi
}

# 重新构建前端镜像
rebuild_frontend() {
    log_info "重新构建前端镜像..."
    
    cd apps/frontend
    
    # 构建新镜像
    docker build -t ghcr.io/bluewatercg/projectcontractledger-frontend:fixed .
    
    if [ $? -eq 0 ]; then
        log_success "前端镜像构建成功"
    else
        log_error "前端镜像构建失败"
        exit 1
    fi
    
    cd ../..
}

# 更新容器
update_containers() {
    log_info "更新容器..."
    
    cd deployment
    
    # 停止现有容器
    if [ "$FRONTEND_RUNNING" = true ]; then
        log_info "停止前端容器..."
        docker stop contract-ledger-frontend || true
        docker rm contract-ledger-frontend || true
    fi
    
    # 更新镜像标签
    log_info "更新前端镜像标签..."
    docker tag ghcr.io/bluewatercg/projectcontractledger-frontend:fixed ghcr.io/bluewatercg/projectcontractledger-frontend:latest
    
    # 重新启动容器
    log_info "重新启动容器..."
    docker-compose up -d frontend
    
    if [ $? -eq 0 ]; then
        log_success "容器更新成功"
    else
        log_error "容器更新失败"
        exit 1
    fi
    
    cd ..
}

# 验证修复
verify_fix() {
    log_info "验证修复结果..."
    
    # 等待容器启动
    sleep 10
    
    # 检查前端容器状态
    if docker ps --format "table {{.Names}}" | grep -q "contract-ledger-frontend"; then
        log_success "前端容器启动成功"
    else
        log_error "前端容器启动失败"
        return 1
    fi
    
    # 检查前端健康状态
    log_info "检查前端健康状态..."
    for i in {1..30}; do
        if docker exec contract-ledger-frontend wget --no-verbose --tries=1 --spider http://localhost/ >/dev/null 2>&1; then
            log_success "前端服务健康检查通过"
            break
        fi
        
        if [ $i -eq 30 ]; then
            log_error "前端服务健康检查失败"
            return 1
        fi
        
        sleep 2
    done
    
    # 检查配置文件是否生成
    log_info "检查运行时配置文件..."
    if docker exec contract-ledger-frontend test -f /usr/share/nginx/html/config.js; then
        log_success "运行时配置文件存在"
        
        # 显示配置内容
        log_info "配置文件内容："
        docker exec contract-ledger-frontend cat /usr/share/nginx/html/config.js
    else
        log_warning "运行时配置文件不存在"
    fi
}

# 显示访问信息
show_access_info() {
    echo ""
    echo "=== 修复完成 ==="
    echo ""
    log_success "附件预览功能已修复"
    echo ""
    echo "访问地址："
    echo "  前端: http://localhost:8000"
    echo "  后端: http://localhost:8080"
    echo ""
    echo "测试步骤："
    echo "  1. 登录系统"
    echo "  2. 进入合同或发票详情页"
    echo "  3. 上传附件"
    echo "  4. 点击预览按钮测试"
    echo ""
    echo "如果仍有问题，请查看容器日志："
    echo "  docker logs contract-ledger-frontend"
    echo "  docker logs contract-ledger-backend"
}

# 主函数
main() {
    echo "开始修复附件预览问题..."
    echo ""
    
    # 检查环境
    check_docker
    check_containers
    
    # 重新构建和部署
    rebuild_frontend
    update_containers
    
    # 验证修复
    verify_fix
    
    # 显示访问信息
    show_access_info
}

# 执行主函数
main "$@"
