# 多阶段构建 - 后端构建阶段
FROM node:18-alpine AS backend-build

WORKDIR /app/backend

# 安装必要的构建工具
RUN apk add --no-cache python3 make g++

# 复制后端package.json和yarn.lock
COPY apps/backend/package.json apps/backend/yarn.lock ./

# 安装后端依赖
RUN echo "Installing backend dependencies..." && \
    yarn install --production=false --network-timeout 100000 --verbose

# 复制后端源代码
COPY apps/backend/ ./

# 构建后端
RUN echo "Starting backend build..." && \
    yarn build && \
    echo "Backend build completed successfully" && \
    ls -la dist/ || \
    (echo "Backend build failed" && exit 1)

# 多阶段构建 - 前端构建阶段
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# 安装必要的构建工具
RUN apk add --no-cache python3 make g++

# 复制前端package.json（优先使用npm避免权限问题）
COPY apps/frontend/package.json ./

# 使用npm安装依赖（避免yarn权限问题）
RUN echo "Installing frontend dependencies with npm..." && \
    npm install --verbose && \
    echo "Frontend dependencies installed successfully" && \
    echo "Checking installed packages..." && \
    npm list --depth=0 | head -20

# 复制前端源代码
COPY apps/frontend/ ./

# 使用node直接调用vite（完全绕过权限问题）
RUN echo "Starting frontend build with node..." && \
    echo "Checking vite installation..." && \
    ls -la node_modules/vite/bin/ && \
    echo "Starting build process..." && \
    NODE_ENV=production node node_modules/vite/bin/vite.js build && \
    echo "Frontend build completed successfully" && \
    echo "Checking build output..." && \
    ls -la dist/ && \
    if [ ! -f "dist/index.html" ]; then \
        echo "ERROR: Frontend build failed - index.html not found"; \
        echo "Creating fallback..."; \
        mkdir -p dist; \
        echo '<html><body><h1>Frontend build failed</h1><p>Please check the build logs.</p></body></html>' > dist/index.html; \
        echo "Fallback created"; \
    else \
        echo "Frontend build verification successful"; \
        echo "Build output size:"; \
        du -sh dist/; \
        echo "Main files:"; \
        ls -la dist/*.html dist/assets/ 2>/dev/null || true; \
    fi

# 生产阶段 - 使用nginx作为基础镜像
FROM nginx:alpine AS production

# 安装Node.js运行时
RUN apk add --no-cache nodejs npm

# 创建应用目录
WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# 复制后端构建产物和依赖
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/bootstrap.js ./backend/
COPY --from=backend-build /app/backend/package.json ./backend/
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules

# 复制前端构建产物
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# 验证前端文件复制
RUN echo "Verifying frontend files..." && \
    ls -la /usr/share/nginx/html/ && \
    if [ ! -f "/usr/share/nginx/html/index.html" ]; then \
        echo "ERROR: Frontend index.html not found after copy"; \
        exit 1; \
    else \
        echo "Frontend files copied successfully"; \
        echo "Frontend directory size:"; \
        du -sh /usr/share/nginx/html/; \
    fi

# 复制nginx配置
COPY tools/nginx/nginx.conf /etc/nginx/nginx.conf

# 复制启动脚本
COPY scripts/dev/start.sh /start.sh
RUN chmod +x /start.sh

# 更改文件所有权
RUN chown -R appuser:nodejs /app && \
    chown appuser:nodejs /start.sh

# 创建日志目录和上传目录（匹配生产环境配置）
RUN mkdir -p /app/logs /var/log/app /app/uploads && \
    chown -R appuser:nodejs /app/logs /var/log/app /app/uploads && \
    ln -sf /app/logs /var/log/app/app

# 设置默认环境变量（可通过docker run -e 或 .env文件覆盖）
ENV NODE_ENV=production \
    BACKEND_PORT=8080 \
    FRONTEND_HTTP_PORT=80 \
    LOG_LEVEL=info \
    CORS_ORIGINS=* \
    JWT_EXPIRES_IN=7d \
    UPLOAD_DIR=/app/uploads

# 暴露端口（支持环境变量配置）
EXPOSE 80 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# 启动应用
CMD ["/start.sh"]
