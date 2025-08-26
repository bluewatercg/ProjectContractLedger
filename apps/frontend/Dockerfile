# 构建阶段
FROM node:23.10.0-alpine AS build

# 安装必要的构建工具
RUN apk add --no-cache python3 make g++ curl

# 设置工作目录
WORKDIR /app

# 复制package.json和yarn.lock（如果存在）
COPY package.json ./
COPY yarn.lock* ./

# 优化yarn配置和安装依赖
RUN echo "Installing frontend dependencies..." && \
    yarn config set network-timeout 300000 && \
    yarn config set registry https://registry.npmjs.org/ && \
    yarn config set child-concurrency 1 && \
    yarn install --frozen-lockfile --network-timeout 300000 --verbose || \
    (echo "First attempt failed, retrying..." && \
     yarn install --frozen-lockfile --network-timeout 300000 --verbose) || \
    (echo "Second attempt failed, trying with network concurrency 1..." && \
     yarn config set network-concurrency 1 && \
     yarn install --frozen-lockfile --network-timeout 300000 --verbose) && \
    echo "Frontend dependencies installed successfully"

# 复制源代码和配置文件
COPY . .

# 验证关键文件存在
RUN echo "Verifying build files..." && \
    ls -la package.json && \
    ls -la vite.config.ts && \
    ls -la tsconfig.json && \
    ls -la src/

# 构建应用
RUN echo "Building frontend application..." && \
    yarn build && \
    echo "Frontend build completed successfully" && \
    ls -la dist/ && \
    echo "Build output:" && \
    find dist -type f | head -10

# 生产阶段 - 使用nginx提供静态文件服务
FROM nginx:alpine AS production

# 复制自定义nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

# 从构建阶段复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# 使用启动脚本启动nginx
CMD ["/start.sh"]
