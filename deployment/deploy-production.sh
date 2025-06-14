#!/bin/bash

# 生产环境部署脚本
# 适用于使用外部MySQL和Redis的生产环境部署

set -e

echo "=== 客户合同管理系统 - 生产环境部署 ==="
echo "时间: $(date)"
echo ""

# 检查必要文件
echo "1. 检查部署文件..."

if [ ! -f ".env" ]; then
    echo "❌ 未找到 .env 配置文件"
    echo "请复制 .env.production.template 为 .env 并填写配置"
    if [ -f ".env.production.template" ]; then
        echo "运行命令: cp .env.production.template .env"
    fi
    exit 1
fi

if [ ! -f "deployment/docker-compose.production.yml" ]; then
    echo "❌ 未找到生产环境部署配置文件"
    exit 1
fi

echo "✅ 部署文件检查完成"
echo ""

# 显示配置信息
echo "2. 配置信息检查..."
source .env

echo "应用配置:"
echo "  前端端口: ${APP_HTTP_PORT:-8000}"
echo "  后端端口: ${APP_API_PORT:-8080}"
echo "  网络模式: ${NETWORK_MODE:-bridge}"

echo ""
echo "数据库配置:"
echo "  主机: ${DB_HOST:-未设置}"
echo "  端口: ${DB_PORT:-3306}"
echo "  数据库: ${DB_DATABASE:-未设置}"
echo "  用户: ${DB_USERNAME:-未设置}"

echo ""
echo "Redis配置:"
echo "  主机: ${REDIS_HOST:-未设置}"
echo "  端口: ${REDIS_PORT:-6379}"
echo "  数据库: ${REDIS_DB:-13}"

echo ""

# 检查Docker
echo "3. 检查Docker环境..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装"
    exit 1
fi

echo "✅ Docker环境检查完成"
echo ""

# 检查镜像地址
echo "4. 检查镜像配置..."
EXPECTED_IMAGE="ghcr.milu.moe/bluewatercg/projectcontractledger:latest"
echo "使用镜像: $EXPECTED_IMAGE"

# 拉取最新镜像
echo "5. 拉取最新镜像..."
docker pull $EXPECTED_IMAGE

echo ""

# 停止现有服务
echo "6. 停止现有服务..."
docker-compose -f deployment/docker-compose.production.yml down 2>/dev/null || true

echo ""

# 启动服务
echo "7. 启动服务..."
docker-compose -f deployment/docker-compose.production.yml up -d

echo ""

# 等待服务启动
echo "8. 等待服务启动..."
sleep 15

# 检查服务状态
echo "9. 检查服务状态..."
docker-compose -f deployment/docker-compose.production.yml ps

echo ""

# 健康检查
echo "10. 健康检查..."
echo "等待应用启动..."

# 根据配置的端口进行健康检查
HEALTH_URL="http://localhost:${APP_HTTP_PORT:-8000}/health"

for i in {1..30}; do
    if curl -s $HEALTH_URL > /dev/null; then
        echo "✅ 应用启动成功"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo "❌ 应用启动超时"
        echo "查看日志："
        docker-compose -f deployment/docker-compose.production.yml logs --tail 20 app
        exit 1
    fi
    
    echo "等待中... ($i/30)"
    sleep 2
done

echo ""

# 显示访问信息
echo "=== 部署完成 ==="
echo "应用访问地址："
echo "  前端: http://localhost:${APP_HTTP_PORT:-8000}"
echo "  后端API: http://localhost:${APP_API_PORT:-8080}"
echo "  健康检查: $HEALTH_URL"
echo "  API文档: http://localhost:${APP_API_PORT:-8080}/api-docs"

echo ""
echo "管理命令："
echo "  查看日志: docker-compose -f deployment/docker-compose.production.yml logs -f app"
echo "  重启服务: docker-compose -f deployment/docker-compose.production.yml restart app"
echo "  停止服务: docker-compose -f deployment/docker-compose.production.yml down"
echo "  更新应用: bash deployment/deploy-production.sh"

echo ""
echo "默认登录账号："
echo "  用户名: admin"
echo "  密码: admin123"

echo ""
echo "数据持久化："
echo "  应用日志: docker volume inspect deployment_app_logs"
echo "  上传文件: docker volume inspect deployment_app_uploads"

echo ""
echo "=== 生产环境部署完成 ==="
