# ============================================
# 优化后的后端 Dockerfile
# 预期构建时间：3-5 分钟（原：10-15 分钟）
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
COPY package.json yarn.lock ./

# 第二层：安装依赖（简化策略，移除 verbose）
RUN yarn config set network-timeout 300000 && \
    yarn config set registry https://registry.npmjs.org/ && \
    yarn install --frozen-lockfile --production=false --network-timeout 300000 --ignore-optional && \
    yarn cache clean

# 第三层：复制源代码（代码改动不会重新安装依赖）
COPY src ./src
COPY tsconfig.json ./
COPY bootstrap.js ./

# 第四层：构建应用
RUN yarn build

# ============================================
# 生产阶段（多阶段构建，减小镜像体积）
# ============================================
FROM node:18-alpine AS production

WORKDIR /app

# 只复制 package.json 和 yarn.lock
COPY package.json yarn.lock ./

# 只安装生产依赖
RUN yarn config set network-timeout 300000 && \
    yarn config set registry https://registry.npmjs.org/ && \
    yarn install --frozen-lockfile --production=true --network-timeout 300000 --ignore-optional && \
    yarn cache clean

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/bootstrap.js ./bootstrap.js

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S midway -u 1001 && \
    mkdir -p /app/uploads /app/logs && \
    chown -R midway:nodejs /app && \
    chmod -R 755 /app/uploads /app/logs

USER midway

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 启动应用
CMD ["node", "bootstrap.js"]
