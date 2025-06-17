# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine AS base

# 安装必要的构建工具
RUN apk add --no-cache python3 make g++

# 设置工作目录
WORKDIR /app

# 复制package.json和yarn.lock
COPY package.json yarn.lock ./

# 安装依赖
RUN echo "Installing backend dependencies..." && \
    yarn install --frozen-lockfile --production=false --network-timeout 100000 && \
    echo "Backend dependencies installed successfully"

# 复制源代码和配置文件
COPY . .

# 验证关键文件存在
RUN echo "Verifying build files..." && \
    ls -la package.json && \
    ls -la tsconfig.json && \
    ls -la bootstrap.js && \
    ls -la src/

# 构建应用
RUN echo "Building backend application..." && \
    yarn build && \
    echo "Backend build completed successfully" && \
    ls -la dist/ && \
    echo "Build output:" && \
    find dist -type f | head -10

# 生产阶段
FROM node:18-alpine AS production

# 设置工作目录
WORKDIR /app

# 复制package.json和yarn.lock
COPY package.json yarn.lock ./

# 只安装生产依赖
RUN yarn install --frozen-lockfile --production=true && yarn cache clean

# 从构建阶段复制构建产物
COPY --from=base /app/dist ./dist
COPY --from=base /app/bootstrap.js ./bootstrap.js

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S midway -u 1001

# 创建上传目录并设置权限
RUN mkdir -p /app/uploads && \
    mkdir -p /app/logs && \
    chown -R midway:nodejs /app && \
    chmod -R 755 /app/uploads && \
    chmod -R 755 /app/logs

USER midway

# 暴露端口
EXPOSE 8080

# 设置环境变量
ENV NODE_ENV=production

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 启动应用
CMD ["node", "bootstrap.js"]
