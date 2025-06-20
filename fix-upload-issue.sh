#!/bin/bash

# 修复文件上传问题的脚本

echo "=== 修复文件上传问题 ==="
echo

# 1. 检查并创建必要的目录
echo "1. 检查并创建宿主机目录..."

# 进入部署目录
cd deployment || {
    echo "错误: 无法进入deployment目录"
    exit 1
}

# 创建data目录结构
echo "   创建data目录结构..."
mkdir -p data/uploads/contracts
mkdir -p data/uploads/invoices
mkdir -p data/logs

# 设置目录权限
echo "   设置目录权限..."
chmod -R 755 data/
chmod -R 777 data/uploads/  # 确保容器可以写入

echo "   ✓ 目录创建完成"
echo

# 2. 检查目录结构
echo "2. 检查目录结构:"
if [ -d "data" ]; then
    find data -type d | sed 's/^/   /'
    echo "   目录权限:"
    ls -la data/ | sed 's/^/     /'
else
    echo "   ✗ data目录不存在"
fi
echo

# 3. 重启容器以应用挂载
echo "3. 重启Docker容器..."
if [ -f "docker-compose.yml" ]; then
    echo "   停止现有容器..."
    docker-compose down
    
    echo "   启动容器..."
    docker-compose up -d
    
    echo "   等待容器启动..."
    sleep 10
    
    echo "   检查容器状态:"
    docker-compose ps | sed 's/^/     /'
else
    echo "   ✗ docker-compose.yml文件不存在"
fi
echo

# 4. 验证容器内目录
echo "4. 验证容器内目录结构..."
CONTAINER_NAME="contract-ledger-backend"

if docker ps | grep -q "$CONTAINER_NAME"; then
    echo "   容器内/app/uploads目录:"
    docker exec "$CONTAINER_NAME" ls -la /app/uploads/ | sed 's/^/     /'
    
    echo "   容器内子目录:"
    docker exec "$CONTAINER_NAME" find /app/uploads -type d | sed 's/^/     /'
    
    # 测试文件创建
    echo "   测试文件创建权限..."
    if docker exec "$CONTAINER_NAME" touch /app/uploads/test.txt 2>/dev/null; then
        echo "     ✓ 文件创建成功"
        docker exec "$CONTAINER_NAME" rm -f /app/uploads/test.txt
    else
        echo "     ✗ 文件创建失败"
    fi
else
    echo "   ✗ 容器未运行: $CONTAINER_NAME"
fi
echo

# 5. 检查环境变量
echo "5. 检查容器环境变量..."
if docker ps | grep -q "$CONTAINER_NAME"; then
    echo "   UPLOAD_DIR配置:"
    docker exec "$CONTAINER_NAME" printenv UPLOAD_DIR | sed 's/^/     /' || echo "     未设置"
    
    echo "   NODE_ENV配置:"
    docker exec "$CONTAINER_NAME" printenv NODE_ENV | sed 's/^/     /' || echo "     未设置"
else
    echo "   ✗ 容器未运行，无法检查环境变量"
fi
echo

# 6. 运行调试脚本
echo "6. 运行容器内调试脚本..."
if docker ps | grep -q "$CONTAINER_NAME"; then
    # 复制调试脚本到容器
    docker cp ../debug-container-upload.sh "$CONTAINER_NAME":/tmp/debug.sh
    docker exec "$CONTAINER_NAME" chmod +x /tmp/debug.sh
    docker exec "$CONTAINER_NAME" /tmp/debug.sh
else
    echo "   ✗ 容器未运行，无法执行调试脚本"
fi
echo

echo "=== 修复完成 ==="
echo
echo "后续步骤:"
echo "1. 尝试上传文件测试功能"
echo "2. 检查应用日志: docker-compose logs -f backend"
echo "3. 如果问题仍然存在，检查应用代码中的路径配置"
echo "4. 确认数据库中的文件路径记录是否正确"
