# .dockerignore修复总结

## 问题描述

Docker构建时出现错误：
```
ERROR: failed to solve: failed to compute cache key: failed to calculate checksum of ref: "/scripts/utils/inject-env-vars.sh": not found
```

## 问题原因

`.dockerignore` 文件中的第85行排除了整个 `scripts/utils` 目录：
```
scripts/utils
```

这导致Docker构建时无法找到 `scripts/utils/inject-env-vars.sh` 文件。

## 解决方案

### 方案一：修改.dockerignore（已实施）

将粗粒度的排除改为细粒度的排除：

**修改前**:
```
scripts/utils
```

**修改后**:
```
scripts/utils/test-*
scripts/utils/*-test*
scripts/utils/*-fix*
scripts/utils/check-*
scripts/utils/frontend-*
scripts/utils/vite-*
scripts/utils/npm-*
# 保留Docker需要的脚本
# scripts/utils/inject-env-vars.sh
```

### 方案二：集成到启动脚本（最终方案）

为了避免依赖外部文件，将环境变量注入功能直接集成到 `scripts/dev/start.sh` 中：

```bash
# 注入前端环境变量
echo "注入前端环境变量..."

# 前端静态文件目录
FRONTEND_DIR="/usr/share/nginx/html"
CONFIG_FILE="$FRONTEND_DIR/config.js"

# 检查前端目录是否存在
if [ -d "$FRONTEND_DIR" ]; then
    echo "生成前端配置文件: $CONFIG_FILE"
    
    # 生成前端配置文件
    cat > "$CONFIG_FILE" << EOF
// 运行时环境配置
window.__APP_CONFIG__ = {
  API_BASE_URL: '${FRONTEND_API_BASE_URL:-/api}',
  APP_TITLE: '${APP_TITLE:-客户合同管理系统}',
  APP_VERSION: '${APP_VERSION:-1.0.0}',
  BACKEND_PORT: '${BACKEND_PORT:-8080}',
  NODE_ENV: '${NODE_ENV:-production}',
  BUILD_TIME: '$(date -u +"%Y-%m-%dT%H:%M:%SZ")',
  CONTAINER_ID: '$(hostname)'
};
EOF

    # 在index.html中注入配置脚本
    INDEX_FILE="$FRONTEND_DIR/index.html"
    if [ -f "$INDEX_FILE" ]; then
        if ! grep -q "config.js" "$INDEX_FILE"; then
            sed -i 's|</head>|  <script src="/config.js"></script>\n</head>|' "$INDEX_FILE"
        fi
    fi
fi
```

## 优势

### 方案二的优势
1. **简化依赖** - 不需要额外的脚本文件
2. **减少构建复杂性** - 避免.dockerignore配置问题
3. **自包含** - 所有功能集成在启动脚本中
4. **更可靠** - 减少文件依赖，降低出错概率

## 文件修改清单

- ✅ `.dockerignore` - 修改排除规则（备用方案）
- ✅ `scripts/dev/start.sh` - 集成环境变量注入功能
- ✅ `tools/docker/Dockerfile` - 移除对外部脚本的依赖
- ✅ `deployment/dockerignore-fix-summary.md` - 修复总结文档

## 预期效果

修复后的Docker构建应该能够：

1. **成功构建** - 不再出现文件找不到的错误
2. **正常注入环境变量** - 在容器启动时动态生成前端配置
3. **简化维护** - 减少文件依赖，更容易维护

## 测试建议

```bash
# 测试Docker构建
docker build -f tools/docker/Dockerfile -t test-fix .

# 测试容器启动
docker run -d -p 8000:80 -p 8080:8080 \
  -e FRONTEND_API_BASE_URL=/api \
  -e APP_TITLE=测试应用 \
  test-fix

# 检查前端配置
curl http://localhost:8000/config.js
```

## 总结

通过将环境变量注入功能集成到启动脚本中，我们：

1. **解决了构建问题** - 不再依赖可能被.dockerignore排除的文件
2. **简化了架构** - 减少了文件依赖
3. **保持了功能** - 环境变量注入功能完全保留
4. **提高了可靠性** - 减少了潜在的配置问题

这是一个更简洁、更可靠的解决方案。
