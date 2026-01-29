# ============================================
# 优化后的前端 Dockerfile
# 预期构建时间：2-4 分钟（原：8-12 分钟）
# ============================================

# 构建阶段
FROM node:18-alpine AS builder

# 安装必要的构建工具（最小化）
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 第一层：复制依赖文件（利用 Docker 缓存）
COPY package.json yarn.lock* ./

# 第二层：安装依赖（简化策略，移除 verbose）
RUN yarn config set network-timeout 300000 && \
    yarn config set registry https://registry.npmjs.org/ && \
    yarn install --frozen-lockfile --network-timeout 300000 --ignore-optional && \
    yarn cache clean

# 第三层：复制源代码（代码改动不会重新安装依赖）
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.node.json* ./

# 第四层：构建应用
RUN yarn build

# ============================================
# 生产阶段（使用 nginx 提供静态文件服务）
# ============================================
FROM nginx:alpine AS production

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制启动脚本
COPY start.sh /start.sh
RUN apk add --no-cache dos2unix && \
    dos2unix /start.sh && \
    chmod +x /start.sh && \
    apk del dos2unix

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# 启动 nginx
CMD ["/start.sh"]
