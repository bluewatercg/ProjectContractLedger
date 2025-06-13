# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 复制package.json和yarn.lock
COPY package.json yarn.lock ./

# 安装依赖
RUN yarn install --frozen-lockfile --production=false

# 复制源代码
COPY . .

# 构建应用
RUN yarn build

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
COPY --from=base /app/bootstrap.js ./

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S midway -u 1001

# 更改文件所有权
RUN chown -R midway:nodejs /app
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
