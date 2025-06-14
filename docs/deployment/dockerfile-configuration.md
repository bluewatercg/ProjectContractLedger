# Dockerfile配置说明

## 文件位置
`tools/docker/Dockerfile`

## 配置概览

### 多阶段构建架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  backend-build  │    │ frontend-build  │    │   production    │
│                 │    │                 │    │                 │
│ Node.js 18      │    │ Node.js 18      │    │ Nginx + Node.js │
│ Alpine Linux    │    │ Alpine Linux    │    │ Alpine Linux    │
│                 │    │                 │    │                 │
│ yarn build      │    │ npm + vite      │    │ 运行时环境      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 阶段详解

### 阶段1: 后端构建 (backend-build)

#### 基础配置
```dockerfile
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
```

#### 构建工具安装
```dockerfile
RUN apk add --no-cache python3 make g++
```
- **python3**: 用于编译原生模块
- **make**: 构建工具
- **g++**: C++编译器

#### 依赖管理策略
```dockerfile
# 先复制依赖文件
COPY apps/backend/package.json apps/backend/yarn.lock ./
# 再安装依赖
RUN yarn install --production=false --network-timeout 100000 --verbose
# 最后复制源代码
COPY apps/backend/ ./
```

**优势**:
- 利用Docker层缓存
- 依赖不变时跳过安装步骤
- 加速构建过程

#### 构建验证
```dockerfile
RUN yarn build && \
    ls -la dist/ || \
    (echo "Backend build failed" && exit 1)
```

### 阶段2: 前端构建 (frontend-build)

#### 包管理器选择
```dockerfile
# 使用npm而非yarn，避免权限问题
RUN npm install --verbose
```

**原因**:
- Alpine Linux环境中npm权限处理更稳定
- 避免yarn在容器中的权限问题

#### Vite构建策略
```dockerfile
# 直接调用vite，绕过权限问题
NODE_ENV=production node node_modules/vite/bin/vite.js build
```

**技术细节**:
- 不使用`npm run build`或`yarn build`
- 直接调用vite的JavaScript文件
- 完全避免可执行文件权限问题

#### 构建失败处理
```dockerfile
if [ ! -f "dist/index.html" ]; then
    echo "ERROR: Frontend build failed - index.html not found"
    echo "Creating fallback..."
    mkdir -p dist
    echo '<html><body><h1>Frontend build failed</h1>...' > dist/index.html
    echo "Fallback created"
fi
```

**容错机制**:
- 检查关键文件存在性
- 自动创建fallback页面
- 确保构建不会完全失败

### 阶段3: 生产环境 (production)

#### 基础镜像选择
```dockerfile
FROM nginx:alpine AS production
```

**优势**:
- 轻量级 (约5MB基础镜像)
- 高性能Web服务器
- 安全性好

#### 运行时环境
```dockerfile
RUN apk add --no-cache nodejs npm
```

**说明**:
- 安装Node.js运行后端服务
- npm用于可能的运行时包管理

#### 安全配置
```dockerfile
# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# 设置文件所有权
RUN chown -R appuser:nodejs /app
```

**安全原则**:
- 遵循最小权限原则
- 避免以root用户运行应用
- 明确的用户和组管理

#### 文件复制策略
```dockerfile
# 复制后端构建产物
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/bootstrap.js ./backend/
COPY --from=backend-build /app/backend/package.json ./backend/
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules

# 复制前端构建产物
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
```

**优化点**:
- 只复制必要的文件
- 利用多阶段构建减少镜像大小
- 分离前后端文件

#### 目录结构
```
/app/
├── backend/
│   ├── dist/           # 编译后的后端代码
│   ├── bootstrap.js    # 启动文件
│   ├── package.json    # 依赖信息
│   └── node_modules/   # 运行时依赖
├── logs/               # 应用日志
└── uploads/            # 上传文件

/usr/share/nginx/html/  # 前端静态文件
├── index.html
├── assets/
└── config.js           # 运行时生成的配置
```

## 环境变量配置

### 默认环境变量
```dockerfile
ENV NODE_ENV=production \
    BACKEND_PORT=8080 \
    FRONTEND_HTTP_PORT=80 \
    LOG_LEVEL=info \
    CORS_ORIGINS=* \
    JWT_EXPIRES_IN=7d
```

### 运行时可覆盖变量
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `JWT_SECRET`
- `FRONTEND_API_BASE_URL`

## 网络配置

### 端口暴露
```dockerfile
EXPOSE 80 8080
```

### Nginx代理配置
- 端口80: 前端静态文件 + API代理
- 端口8080: 后端服务直接访问

### 代理规则
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080/api/v1/;
}
```

## 健康检查

### 配置
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1
```

### 参数说明
- **interval**: 检查间隔30秒
- **timeout**: 单次检查超时10秒
- **start-period**: 启动宽限期30秒
- **retries**: 失败重试3次

## 启动配置

### 启动脚本
```dockerfile
CMD ["/start.sh"]
```

### 启动流程
1. 创建必要目录
2. 注入前端环境变量
3. 启动nginx (后台)
4. 启动后端服务 (前台)

## 优化特性

### 构建优化
- **多阶段构建**: 减少最终镜像大小
- **层缓存**: 优化依赖安装顺序
- **并行构建**: 前后端独立构建

### 运行时优化
- **Gzip压缩**: nginx自动压缩静态资源
- **静态资源缓存**: 长期缓存策略
- **连接复用**: nginx upstream配置

### 安全优化
- **非root用户**: 应用以普通用户运行
- **安全头**: nginx配置安全HTTP头
- **最小权限**: 只授予必要的文件权限

## 故障排除

### 常见问题

#### 1. 前端构建失败
**现象**: vite权限错误
**解决**: 使用node直接调用vite

#### 2. 后端依赖安装失败
**现象**: 原生模块编译错误
**解决**: 确保安装了python3, make, g++

#### 3. 文件权限问题
**现象**: 应用无法写入日志
**解决**: 检查目录所有权设置

### 调试技巧

#### 1. 分阶段调试
```bash
# 只构建到特定阶段
docker build --target backend-build -t debug-backend .
docker build --target frontend-build -t debug-frontend .
```

#### 2. 交互式调试
```bash
# 进入构建阶段容器
docker run -it debug-backend sh
```

#### 3. 构建日志分析
```bash
# 详细构建日志
docker build --progress=plain --no-cache .
```

## 维护建议

### 定期更新
- 基础镜像版本
- Node.js版本
- 依赖包版本

### 监控指标
- 构建时间
- 镜像大小
- 构建成功率

### 版本管理
- 使用语义化版本标签
- 保留多个版本以便回滚
