#!/bin/bash

# Docker构建测试脚本

echo "=== Docker构建测试 ==="
echo "时间: $(date)"
echo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否可用
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker 服务未运行"
        exit 1
    fi
    
    print_success "Docker 环境正常"
}

# 清理旧镜像
cleanup_old_images() {
    print_info "清理旧的测试镜像..."
    docker rmi contract-ledger-test:latest 2>/dev/null || true
    docker system prune -f &>/dev/null || true
}

# 构建镜像
build_image() {
    print_info "开始构建Docker镜像..."
    echo "这可能需要几分钟时间..."
    
    if docker build -t contract-ledger-test:latest . --no-cache; then
        print_success "镜像构建成功"
        return 0
    else
        print_error "镜像构建失败"
        return 1
    fi
}

# 测试镜像
test_image() {
    print_info "测试镜像基本功能..."
    
    # 检查镜像是否存在
    if ! docker images | grep -q "contract-ledger-test"; then
        print_error "镜像不存在"
        return 1
    fi
    
    # 检查镜像大小
    local image_size=$(docker images contract-ledger-test:latest --format "{{.Size}}")
    print_info "镜像大小: $image_size"
    
    # 运行容器进行基本测试
    print_info "启动测试容器..."
    local container_id=$(docker run -d --name contract-ledger-test-container \
        -p 8081:80 \
        -p 8082:8080 \
        -e NODE_ENV=production \
        contract-ledger-test:latest)
    
    if [ $? -eq 0 ]; then
        print_success "容器启动成功 (ID: ${container_id:0:12})"
        
        # 等待服务启动
        print_info "等待服务启动..."
        sleep 30
        
        # 测试健康检查
        print_info "测试健康检查端点..."
        if curl -f http://localhost:8081/health &>/dev/null; then
            print_success "健康检查通过"
        else
            print_warning "健康检查失败，查看容器日志:"
            docker logs contract-ledger-test-container --tail 20
        fi
        
        # 清理测试容器
        print_info "清理测试容器..."
        docker stop contract-ledger-test-container &>/dev/null
        docker rm contract-ledger-test-container &>/dev/null
        
        return 0
    else
        print_error "容器启动失败"
        return 1
    fi
}

# 显示构建信息
show_build_info() {
    echo
    print_success "=== 构建信息 ==="
    echo "镜像名称: contract-ledger-test:latest"
    echo "镜像大小: $(docker images contract-ledger-test:latest --format '{{.Size}}')"
    echo "创建时间: $(docker images contract-ledger-test:latest --format '{{.CreatedAt}}')"
    echo
    echo "测试命令:"
    echo "  docker run -d -p 80:80 -p 8080:8080 contract-ledger-test:latest"
    echo
    echo "访问地址:"
    echo "  前端: http://localhost"
    echo "  健康检查: http://localhost/health"
    echo
}

# 主函数
main() {
    case "${1:-}" in
        --help|-h)
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  --help, -h    显示帮助"
            echo "  --no-cache    强制重新构建（不使用缓存）"
            echo "  --test-only   只运行测试，不重新构建"
            exit 0
            ;;
        --test-only)
            print_info "只运行测试模式"
            check_docker
            test_image
            exit $?
            ;;
        --no-cache)
            print_info "强制重新构建模式"
            ;;
    esac
    
    check_docker
    cleanup_old_images
    
    if build_image; then
        if test_image; then
            show_build_info
            print_success "Docker构建测试完成！"
        else
            print_error "镜像测试失败"
            exit 1
        fi
    else
        print_error "镜像构建失败"
        exit 1
    fi
}

# 捕获中断信号
trap 'print_info "清理测试环境..."; docker stop contract-ledger-test-container 2>/dev/null; docker rm contract-ledger-test-container 2>/dev/null; exit 0' INT TERM

main "$@"
