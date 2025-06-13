# 多阶段构建 - 后端构建阶段
FROM node:18-alpine AS backend-build

WORKDIR /app/backend

# 安装必要的构建工具
RUN apk add --no-cache python3 make g++

# 复制后端package.json和yarn.lock
COPY midway-backend/package.json midway-backend/yarn.lock ./

# 安装后端依赖
RUN echo "Installing backend dependencies..." && \
    yarn install --production=false --network-timeout 100000 --verbose

# 复制后端源代码
COPY midway-backend/ ./

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

# 复制前端package.json和yarn.lock
COPY midway-frontend/package.json midway-frontend/yarn.lock ./

# 安装前端依赖
RUN echo "Installing frontend dependencies..." && \
    yarn install --network-timeout 100000 --verbose

# 复制前端源代码
COPY midway-frontend/ ./

# 构建前端
RUN echo "Starting frontend build..." && \
    yarn build && \
    echo "Frontend build completed successfully" && \
    ls -la dist/ || \
    (echo "Frontend build failed, creating fallback" && \
     mkdir -p dist && \
     echo '<html><body><h1>Frontend build failed</h1><p>Please check the build logs.</p></body></html>' > dist/index.html && \
     echo "Fallback created")

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

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

# 更改文件所有权
RUN chown -R appuser:nodejs /app && \
    chown appuser:nodejs /start.sh

# 创建日志目录
RUN mkdir -p /var/log/app && \
    chown -R appuser:nodejs /var/log/app

# 暴露端口
EXPOSE 80 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# 启动应用
CMD ["/start.sh"]
