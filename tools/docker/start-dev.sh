#!/bin/bash

# 开发环境启动脚本

echo "=== 合同管理系统 - 开发环境启动 ==="

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

# 启动服务
echo "启动 Docker 服务..."
docker-compose up -d

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

# 显示访问信息
echo ""
echo "=== 服务启动完成 ==="
echo "前端访问地址: http://localhost"
echo "后端API地址: http://localhost:8080"
echo "Swagger文档: http://localhost:8080/swagger-ui/index.html"
echo ""
echo "数据目录映射:"
echo "  附件存储: ./data/uploads -> /app/uploads"
echo "  应用日志: ./data/logs -> /app/logs"
echo ""
echo "常用命令:"
echo "  查看日志: docker-compose logs -f app"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo ""
