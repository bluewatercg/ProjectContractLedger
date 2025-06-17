#!/bin/bash

# 测试文件上传修复脚本
# 用于验证前后端合并镜像中的文件上传功能

set -e

echo "=== 文件上传修复测试脚本 ==="
echo "时间: $(date)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 检查Docker是否运行
check_docker() {
    log_info "检查Docker状态..."
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker未运行，请启动Docker"
        exit 1
    fi
    log_info "Docker运行正常"
}

# 构建镜像
build_image() {
    log_info "构建修复后的镜像..."
    cd "$(dirname "$0")/.."
    
    # 使用主Dockerfile构建
    docker build -f tools/docker/Dockerfile -t contract-ledger-fixed:test .
    
    if [ $? -eq 0 ]; then
        log_info "镜像构建成功"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 启动测试容器
start_test_container() {
    log_info "启动测试容器..."
    
    # 停止并删除现有测试容器
    docker stop contract-ledger-test 2>/dev/null || true
    docker rm contract-ledger-test 2>/dev/null || true
    
    # 启动新的测试容器
    docker run -d \
        --name contract-ledger-test \
        -p 8080:8080 \
        -p 80:80 \
        -e NODE_ENV=production \
        -e DB_HOST=host.docker.internal \
        -e DB_PORT=3306 \
        -e DB_USERNAME=test_user \
        -e DB_PASSWORD=test_pass \
        -e DB_DATABASE=test_db \
        -e REDIS_HOST=host.docker.internal \
        -e REDIS_PORT=6379 \
        -e JWT_SECRET=test_secret \
        -e UPLOAD_DIR=/app/uploads \
        -v contract_test_uploads:/app/uploads \
        -v contract_test_logs:/app/logs \
        contract-ledger-fixed:test
    
    if [ $? -eq 0 ]; then
        log_info "测试容器启动成功"
    else
        log_error "测试容器启动失败"
        exit 1
    fi
}

# 等待服务启动
wait_for_services() {
    log_info "等待服务启动..."
    
    # 等待后端服务
    for i in {1..30}; do
        if curl -s http://localhost:8080/health > /dev/null 2>&1; then
            log_info "后端服务已启动"
            break
        fi
        
        if [ $i -eq 30 ]; then
            log_error "后端服务启动超时"
            docker logs contract-ledger-test
            exit 1
        fi
        
        echo "等待后端服务启动... ($i/30)"
        sleep 2
    done
    
    # 等待前端服务
    for i in {1..10}; do
        if curl -s http://localhost/ > /dev/null 2>&1; then
            log_info "前端服务已启动"
            break
        fi
        
        if [ $i -eq 10 ]; then
            log_error "前端服务启动超时"
            docker logs contract-ledger-test
            exit 1
        fi
        
        echo "等待前端服务启动... ($i/10)"
        sleep 2
    done
}

# 检查上传目录结构
check_upload_directory() {
    log_info "检查容器内上传目录结构..."
    
    # 检查上传目录是否存在
    docker exec contract-ledger-test ls -la /app/uploads 2>/dev/null || {
        log_error "上传目录 /app/uploads 不存在"
        return 1
    }
    
    # 检查目录权限
    docker exec contract-ledger-test ls -ld /app/uploads
    
    # 检查工作目录
    log_info "检查后端工作目录..."
    docker exec contract-ledger-test pwd
    
    # 测试创建子目录
    log_info "测试创建上传子目录..."
    docker exec contract-ledger-test mkdir -p /app/uploads/contracts/test
    docker exec contract-ledger-test mkdir -p /app/uploads/invoices/test
    
    if [ $? -eq 0 ]; then
        log_info "上传目录结构正常"
    else
        log_error "上传目录权限问题"
        return 1
    fi
}

# 测试文件上传API
test_upload_api() {
    log_info "测试文件上传API..."
    
    # 创建测试文件
    echo "这是一个测试PDF文件" > test.pdf
    
    # 测试合同附件上传（需要先有合同数据）
    log_info "测试合同附件上传API端点..."
    
    # 这里只测试API端点是否可访问，实际上传需要数据库数据
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -F "file=@test.pdf" \
        http://localhost/api/contracts/1/attachments)
    
    log_info "合同附件上传API响应码: $response"
    
    # 清理测试文件
    rm -f test.pdf
}

# 查看日志
show_logs() {
    log_info "显示容器日志..."
    echo "=== 容器启动日志 ==="
    docker logs contract-ledger-test --tail 50
}

# 清理测试环境
cleanup() {
    log_info "清理测试环境..."
    docker stop contract-ledger-test 2>/dev/null || true
    docker rm contract-ledger-test 2>/dev/null || true
    docker volume rm contract_test_uploads contract_test_logs 2>/dev/null || true
    log_info "清理完成"
}

# 主函数
main() {
    echo "开始文件上传修复测试..."
    
    check_docker
    build_image
    start_test_container
    wait_for_services
    check_upload_directory
    test_upload_api
    show_logs
    
    log_info "测试完成！"
    log_warn "容器仍在运行，可以手动测试上传功能"
    log_warn "完成测试后运行: $0 cleanup"
}

# 处理命令行参数
case "${1:-}" in
    "cleanup")
        cleanup
        ;;
    *)
        main
        ;;
esac
