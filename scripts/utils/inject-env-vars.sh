#!/bin/bash

# 前端环境变量注入脚本
# 在容器启动时动态生成前端配置

set -e

echo "=== 前端环境变量注入 ==="

# 前端静态文件目录
FRONTEND_DIR="/usr/share/nginx/html"
CONFIG_FILE="$FRONTEND_DIR/config.js"

# 检查前端目录是否存在
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ 前端目录不存在: $FRONTEND_DIR"
    exit 1
fi

# 生成前端配置文件
echo "生成前端配置文件: $CONFIG_FILE"

cat > "$CONFIG_FILE" << EOF
// 运行时环境配置
window.__APP_CONFIG__ = {
  // API配置
  API_BASE_URL: '${FRONTEND_API_BASE_URL:-/api}',
  
  // 应用配置
  APP_TITLE: '${APP_TITLE:-客户合同管理系统}',
  APP_VERSION: '${APP_VERSION:-1.0.0}',
  
  // 后端配置
  BACKEND_PORT: '${BACKEND_PORT:-8080}',
  
  // 其他配置
  NODE_ENV: '${NODE_ENV:-production}',
  
  // 调试信息
  BUILD_TIME: '$(date -u +"%Y-%m-%dT%H:%M:%SZ")',
  CONTAINER_ID: '$(hostname)'
};

console.log('App Config Loaded:', window.__APP_CONFIG__);
EOF

echo "✅ 前端配置文件生成完成"

# 在index.html中注入配置脚本
INDEX_FILE="$FRONTEND_DIR/index.html"

if [ -f "$INDEX_FILE" ]; then
    echo "在index.html中注入配置脚本..."
    
    # 检查是否已经注入过
    if ! grep -q "config.js" "$INDEX_FILE"; then
        # 在head标签中注入配置脚本
        sed -i 's|</head>|  <script src="/config.js"></script>\n</head>|' "$INDEX_FILE"
        echo "✅ 配置脚本注入完成"
    else
        echo "✅ 配置脚本已存在"
    fi
else
    echo "⚠️  index.html文件不存在，跳过脚本注入"
fi

# 显示配置信息
echo ""
echo "=== 前端配置信息 ==="
echo "API Base URL: ${FRONTEND_API_BASE_URL:-/api}"
echo "App Title: ${APP_TITLE:-客户合同管理系统}"
echo "Backend Port: ${BACKEND_PORT:-8080}"
echo "Node Env: ${NODE_ENV:-production}"
echo ""
echo "=== 局域网IP部署说明 ==="
echo "前端访问: http://[服务器IP]:8000"
echo "后端访问: http://[服务器IP]:8080"
echo "API代理: 前端请求 /api/* 会代理到后端 /api/v1/*"

echo ""
echo "=== 环境变量注入完成 ==="
