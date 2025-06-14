#!/bin/sh

# 启动脚本 - 同时启动前端(nginx)和后端(node.js)服务

set -e

echo "=== Contract Ledger Application Starting ==="
echo "Environment: ${NODE_ENV:-development}"
echo "Timestamp: $(date)"

# 创建日志目录（支持多个日志路径）
mkdir -p /var/log/app /app/logs
# 确保日志目录链接正确
if [ ! -L /var/log/app/app ] && [ -d /app/logs ]; then
    ln -sf /app/logs /var/log/app/app
fi

# 函数：优雅关闭
cleanup() {
    echo "=== Shutting down services ==="
    
    # 停止后端服务
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Stopping backend service (PID: $BACKEND_PID)..."
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
        wait "$BACKEND_PID" 2>/dev/null || true
    fi
    
    # 停止nginx
    echo "Stopping nginx..."
    nginx -s quit 2>/dev/null || true
    
    echo "=== Services stopped ==="
    exit 0
}

# 设置信号处理
trap cleanup TERM INT

# 检查后端文件是否存在
if [ ! -f "/app/backend/bootstrap.js" ]; then
    echo "ERROR: Backend bootstrap.js not found!"
    exit 1
fi

if [ ! -f "/usr/share/nginx/html/index.html" ]; then
    echo "ERROR: Frontend files not found!"
    exit 1
fi

# 启动后端服务
echo "=== Starting backend service ==="
cd /app/backend

# 设置后端环境变量
export NODE_ENV=${NODE_ENV:-production}
export PORT=${BACKEND_PORT:-8080}

# 注入前端环境变量
echo "注入前端环境变量..."
if [ -f "/app/scripts/utils/inject-env-vars.sh" ]; then
    chmod +x /app/scripts/utils/inject-env-vars.sh
    /app/scripts/utils/inject-env-vars.sh
elif [ -f "scripts/utils/inject-env-vars.sh" ]; then
    chmod +x scripts/utils/inject-env-vars.sh
    ./scripts/utils/inject-env-vars.sh
else
    echo "⚠️  环境变量注入脚本未找到，使用默认配置"
fi

# 显示配置信息（不显示敏感信息）
echo "Configuration:"
echo "  NODE_ENV: $NODE_ENV"
echo "  BACKEND_PORT: $PORT"
echo "  DB_HOST: ${DB_HOST:-not_set}"
echo "  DB_PORT: ${DB_PORT:-not_set}"
echo "  REDIS_HOST: ${REDIS_HOST:-not_set}"
echo "  REDIS_PORT: ${REDIS_PORT:-not_set}"

# 启动后端服务（后台运行）
node bootstrap.js > /var/log/app/backend.log 2>&1 &
BACKEND_PID=$!

echo "Backend service started with PID: $BACKEND_PID"

# 等待后端服务启动
echo "Waiting for backend service to be ready..."
for i in $(seq 1 30); do
    if wget --spider --quiet --timeout=2 http://localhost:8080/health 2>/dev/null; then
        echo "Backend service is ready!"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo "ERROR: Backend service failed to start within 30 seconds"
        cleanup
        exit 1
    fi
    
    echo "Waiting for backend... ($i/30)"
    sleep 1
done

# 测试nginx配置
echo "=== Testing nginx configuration ==="
nginx -t

if [ $? -ne 0 ]; then
    echo "ERROR: nginx configuration test failed"
    cleanup
    exit 1
fi

# 启动nginx（前台运行）
echo "=== Starting nginx ==="
nginx -g "daemon off;" &
NGINX_PID=$!

echo "Nginx started with PID: $NGINX_PID"

# 等待nginx启动
sleep 2

# 验证服务状态
echo "=== Service Status Check ==="
echo "Backend health check:"
wget --timeout=5 -qO- http://localhost:8080/health || echo "Backend health check failed"

echo "Frontend health check:"
wget --timeout=5 -qO- http://localhost/ > /dev/null && echo "Frontend is accessible" || echo "Frontend check failed"

echo "=== All services started successfully ==="
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:8080"
echo "Health Check: http://localhost/health"
echo "API Docs: http://localhost/api-docs"

# 监控进程状态
while true; do
    # 检查后端进程
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "ERROR: Backend process died unexpectedly"
        cleanup
        exit 1
    fi
    
    # 检查nginx进程
    if ! kill -0 "$NGINX_PID" 2>/dev/null; then
        echo "ERROR: Nginx process died unexpectedly"
        cleanup
        exit 1
    fi
    
    sleep 10
done
