#!/bin/bash
# Docker构建调试脚本

set -e

echo "=== Docker构建调试脚本 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 检查Docker环境
echo -e "${YELLOW}检查Docker环境...${NC}"
docker --version
docker buildx version

# 设置变量
BACKEND_DIR="apps/backend"
FRONTEND_DIR="apps/frontend"
TAG_SUFFIX=$(date +%Y%m%d%H%M%S)

# 函数：构建单个应用
build_app() {
    local app_dir=$1
    local app_name=$2
    local dockerfile=$3
    
    echo -e "${YELLOW}开始构建 ${app_name}...${NC}"
    
    cd "$app_dir"
    
    # 显示构建上下文大小
    echo "构建上下文大小："
    du -sh .
    
    # 检查关键文件
    echo "检查关键文件："
    ls -la package.json yarn.lock 2>/dev/null || echo "缺少关键文件"
    
    # 尝试单平台构建 (AMD64)
    echo -e "${YELLOW}尝试AMD64构建...${NC}"
    if docker buildx build \
        --platform linux/amd64 \
        --file "$dockerfile" \
        --tag "test-${app_name}:amd64-${TAG_SUFFIX}" \
        --progress=plain \
        --no-cache \
        .; then
        echo -e "${GREEN}${app_name} AMD64构建成功${NC}"
    else
        echo -e "${RED}${app_name} AMD64构建失败${NC}"
        return 1
    fi
    
    # 尝试ARM64构建（如果有特殊Dockerfile）
    if [ -f "Dockerfile.arm64" ]; then
        echo -e "${YELLOW}尝试ARM64构建...${NC}"
        if timeout 1800 docker buildx build \
            --platform linux/arm64 \
            --file "Dockerfile.arm64" \
            --tag "test-${app_name}:arm64-${TAG_SUFFIX}" \
            --progress=plain \
            --no-cache \
            .; then
            echo -e "${GREEN}${app_name} ARM64构建成功${NC}"
        else
            echo -e "${RED}${app_name} ARM64构建失败或超时${NC}"
        fi
    fi
    
    cd - > /dev/null
}

# 主构建流程
echo -e "${YELLOW}开始构建流程...${NC}"

# 检查项目结构
if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}错误：找不到应用目录${NC}"
    exit 1
fi

# 构建后端
if build_app "$BACKEND_DIR" "backend" "Dockerfile"; then
    echo -e "${GREEN}后端构建完成${NC}"
else
    echo -e "${RED}后端构建失败${NC}"
    exit 1
fi

# 构建前端
if build_app "$FRONTEND_DIR" "frontend" "Dockerfile"; then
    echo -e "${GREEN}前端构建完成${NC}"
else
    echo -e "${RED}前端构建失败${NC}"
    exit 1
fi

echo -e "${GREEN}所有构建完成！${NC}"

# 显示镜像信息
echo -e "${YELLOW}构建的镜像：${NC}"
docker images | grep "test-"

# 清理测试镜像（可选）
read -p "是否清理测试镜像？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "清理测试镜像..."
    docker images | grep "test-" | awk '{print $3}' | xargs -r docker rmi
    echo "清理完成"
fi