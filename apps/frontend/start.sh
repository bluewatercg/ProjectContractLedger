#!/bin/sh

# 前端容器启动脚本
# 用于在运行时替换nginx配置中的环境变量

echo "Starting frontend container..."

# 设置默认值
BACKEND_HOST=${BACKEND_HOST:-localhost}
BACKEND_PORT=${BACKEND_PORT:-8080}

echo "Backend configuration:"
echo "  BACKEND_HOST: $BACKEND_HOST"
echo "  BACKEND_PORT: $BACKEND_PORT"

# 替换nginx配置中的环境变量
echo "Configuring nginx..."
sed -i "s/\${BACKEND_HOST:-localhost}/$BACKEND_HOST/g" /etc/nginx/nginx.conf
sed -i "s/\${BACKEND_PORT:-8080}/$BACKEND_PORT/g" /etc/nginx/nginx.conf

# 验证nginx配置
echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid"
    echo "Starting nginx..."
    nginx -g "daemon off;"
else
    echo "Nginx configuration is invalid"
    exit 1
fi
