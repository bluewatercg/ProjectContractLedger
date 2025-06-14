#!/bin/bash

# Docker镜像构建脚本
# 用于构建客户合同管理系统的Docker镜像

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 脚本参数
IMAGE_NAME="${1:-contract-ledger}"
IMAGE_TAG="${2:-latest}"
REGISTRY="${3:-}"
PUSH="${4:-false}"

echo "=== Docker镜像构建脚本 ==="
echo "时间: $(date)"
echo "镜像名称: $IMAGE_NAME"
echo "镜像标签: $IMAGE_TAG"
if [ -n "$REGISTRY" ]; then
    echo "镜像仓库: $REGISTRY"
fi
echo ""

# 检查Docker环境
print_info "检查Docker环境..."
if ! command -v docker &> /dev/null; then
    print_error "Docker未安装或不在PATH中"
    exit 1
fi

print_success "Docker版本: $(docker --version)"

# 检查Docker守护进程
if ! docker info &> /dev/null; then
    print_error "Docker守护进程未运行"
    exit 1
fi

print_success "Docker守护进程运行正常"
echo ""

# 检查必要文件
print_info "检查必要文件..."
required_files=(
    "tools/docker/Dockerfile"
    "apps/backend/package.json"
    "apps/frontend/package.json"
    "scripts/dev/start.sh"
    "tools/nginx/nginx.conf"
    ".dockerignore"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file 存在"
    else
        print_error "$file 不存在"
        exit 1
    fi
done
echo ""

# 检查构建上下文大小
print_info "检查构建上下文大小..."
context_size=$(du -sh . | cut -f1)
print_info "构建上下文大小: $context_size"

if [ -f ".dockerignore" ]; then
    print_success ".dockerignore 文件存在，有助于减少构建上下文"
else
    print_warning ".dockerignore 文件不存在，构建上下文可能较大"
fi
echo ""

# 构建镜像
print_info "开始构建Docker镜像..."
FULL_IMAGE_NAME="$IMAGE_NAME:$IMAGE_TAG"
if [ -n "$REGISTRY" ]; then
    FULL_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:$IMAGE_TAG"
fi

print_info "完整镜像名称: $FULL_IMAGE_NAME"

# 记录构建开始时间
BUILD_START=$(date +%s)

# 执行构建
if docker build -f tools/docker/Dockerfile -t "$FULL_IMAGE_NAME" .; then
    BUILD_END=$(date +%s)
    BUILD_TIME=$((BUILD_END - BUILD_START))
    print_success "镜像构建成功！"
    print_info "构建耗时: ${BUILD_TIME}秒"
else
    print_error "镜像构建失败"
    exit 1
fi
echo ""

# 验证构建结果
print_info "验证构建结果..."
if docker images "$FULL_IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | grep -v REPOSITORY; then
    print_success "镜像验证成功"
else
    print_error "镜像验证失败"
    exit 1
fi
echo ""

# 显示镜像详情
print_info "镜像详情:"
docker images "$FULL_IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
echo ""

# 推送镜像（如果指定）
if [ "$PUSH" = "true" ] && [ -n "$REGISTRY" ]; then
    print_info "推送镜像到仓库..."
    if docker push "$FULL_IMAGE_NAME"; then
        print_success "镜像推送成功"
    else
        print_error "镜像推送失败"
        exit 1
    fi
    echo ""
fi

# 清理悬空镜像
print_info "清理悬空镜像..."
if docker image prune -f; then
    print_success "悬空镜像清理完成"
else
    print_warning "悬空镜像清理失败"
fi
echo ""

# 显示使用建议
print_success "=== 构建完成 ==="
echo ""
print_info "使用建议:"
echo "  1. 测试运行:"
echo "     docker run --rm -p 8000:80 -p 8080:8080 $FULL_IMAGE_NAME"
echo ""
echo "  2. 生产部署:"
echo "     docker run -d --name contract-ledger \\"
echo "       -p 8000:80 -p 8080:8080 \\"
echo "       -e DB_HOST=your_db_host \\"
echo "       -e REDIS_HOST=your_redis_host \\"
echo "       -v app_logs:/app/logs \\"
echo "       -v app_uploads:/app/uploads \\"
echo "       $FULL_IMAGE_NAME"
echo ""
echo "  3. 使用Docker Compose:"
echo "     docker-compose -f deployment/docker-compose.production.yml up -d"
echo ""

# 显示镜像信息
print_info "镜像信息:"
echo "  名称: $FULL_IMAGE_NAME"
echo "  大小: $(docker images "$FULL_IMAGE_NAME" --format "{{.Size}}")"
echo "  创建时间: $(docker images "$FULL_IMAGE_NAME" --format "{{.CreatedAt}}")"
echo "  构建耗时: ${BUILD_TIME}秒"

print_success "构建脚本执行完成！"
