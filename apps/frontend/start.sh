#!/bin/sh

# 前端容器启动脚本
# 用于在运行时替换nginx配置中的环境变量并注入前端配置

echo "Starting frontend container..."

# 设置默认值
BACKEND_HOST=${BACKEND_HOST:-localhost}
BACKEND_PORT=${BACKEND_PORT:-8080}
BACKEND_HOST_PORT=${BACKEND_HOST_PORT:-8080}
API_VERSION=${API_VERSION:-v1}
FRONTEND_API_BASE_URL=${FRONTEND_API_BASE_URL:-/api/v1}

echo "Backend configuration:"
echo "  BACKEND_HOST: $BACKEND_HOST"
echo "  BACKEND_PORT: $BACKEND_PORT"
echo "  BACKEND_HOST_PORT: $BACKEND_HOST_PORT"
echo "  API_VERSION: $API_VERSION"
echo "  FRONTEND_API_BASE_URL: $FRONTEND_API_BASE_URL"

# 生成前端运行时配置
echo "Generating frontend runtime configuration..."
FRONTEND_DIR="/usr/share/nginx/html"
CONFIG_FILE="$FRONTEND_DIR/config.js"

cat > "$CONFIG_FILE" << EOF
// 运行时环境配置
window.__APP_CONFIG__ = {
  // API版本配置（不设置API_BASE_URL，让前端自动检测）
  API_VERSION: '${API_VERSION}',

  // 后端配置（用于前端自动构建API URL）
  BACKEND_HOST: '${BACKEND_HOST}',
  BACKEND_PORT: '${BACKEND_PORT}',
  BACKEND_HOST_PORT: '${BACKEND_HOST_PORT}',

  // 应用配置
  APP_TITLE: '客户合同管理系统',
  APP_VERSION: '1.0.0',
  NODE_ENV: 'production',

  // 调试信息
  BUILD_TIME: '$(date -u +"%Y-%m-%dT%H:%M:%SZ")',
  CONTAINER_ID: '$(hostname)',

  // 调试：显示配置信息
  DEBUG_INFO: {
    FRONTEND_API_BASE_URL: '${FRONTEND_API_BASE_URL}',
    CURRENT_HOST: window.location.hostname,
    CURRENT_PORT: window.location.port,
    EXPECTED_BACKEND_PORT: '${BACKEND_HOST_PORT}'
  }
};

console.log('App Config Loaded:', window.__APP_CONFIG__);
console.log('Frontend will auto-detect API URL based on environment');
EOF

echo "Frontend configuration generated: $CONFIG_FILE"

# 在index.html中注入配置脚本
INDEX_FILE="$FRONTEND_DIR/index.html"

if [ -f "$INDEX_FILE" ]; then
    echo "Injecting config script into index.html..."

    # 检查是否已经注入过
    if ! grep -q "config.js" "$INDEX_FILE"; then
        # 在head标签中注入配置脚本
        sed -i 's|</head>|  <script src="/config.js"></script>\n</head>|' "$INDEX_FILE"
        echo "✅ Config script injected successfully"
    else
        echo "✅ Config script already exists"
    fi
else
    echo "⚠️  index.html file not found, skipping script injection"
fi

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
