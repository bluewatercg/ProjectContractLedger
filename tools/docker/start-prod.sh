#!/bin/bash

# 生产环境启动脚本

echo "=== 合同管理系统 - 生产环境启动 ==="

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "错误: Docker 未运行，请先启动 Docker"
    exit 1
fi

# 进入脚本所在目录
cd "$(dirname "$0")"

# 创建数据目录
echo "创建数据目录..."
mkdir -p data/uploads data/logs

# 设置目录权限
echo "设置目录权限..."
chmod -R 755 data/

# 检查环境变量
echo "检查环境变量..."
if [ -z "$GITHUB_REPOSITORY" ]; then
    echo "警告: GITHUB_REPOSITORY 环境变量未设置，使用默认值"
    export GITHUB_REPOSITORY="your-username/your-repo"
fi

if [ -z "$IMAGE_TAG" ]; then
    echo "警告: IMAGE_TAG 环境变量未设置，使用 latest"
    export IMAGE_TAG="latest"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "警告: JWT_SECRET 环境变量未设置，请设置安全的密钥"
    export JWT_SECRET="your-jwt-secret-key-change-this"
fi

# 拉取最新镜像
echo "拉取最新镜像..."
docker-compose -f docker-compose.prod.yml pull

# 启动服务
echo "启动 Docker 服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "等待服务启动..."
sleep 15

# 检查服务状态
echo "检查服务状态..."
docker-compose -f docker-compose.prod.yml ps

# 显示访问信息
echo ""
echo "=== 服务启动完成 ==="
echo "前端访问地址: http://localhost:${FRONTEND_HTTP_PORT:-80}"
echo "后端API地址: http://localhost:${BACKEND_PORT:-8080}"
echo ""
echo "数据目录映射:"
echo "  附件存储: ./data/uploads -> /app/uploads"
echo "  应用日志: ./data/logs -> /app/logs"
echo ""
echo "常用命令:"
echo "  查看日志: docker-compose -f docker-compose.prod.yml logs -f app"
echo "  停止服务: docker-compose -f docker-compose.prod.yml down"
echo "  重启服务: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "监控命令:"
echo "  查看资源使用: docker stats"
echo "  查看磁盘使用: df -h"
echo "  查看日志文件: ls -la data/logs/"
echo ""
