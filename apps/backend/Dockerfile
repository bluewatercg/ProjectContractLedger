# 使用官方Node.js运行时作为基础镜像 - 使用更稳定的版本
FROM node:18-alpine AS base

# 安装必要的构建工具和网络调试工具
RUN apk add --no-cache python3 make g++ curl wget git

# 设置工作目录
WORKDIR /app

# 设置环境变量以优化构建过程
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV YARN_CACHE_FOLDER=/tmp/yarn-cache
ENV NPM_CONFIG_CACHE=/tmp/npm-cache

# 复制package.json和yarn.lock
COPY package.json yarn.lock ./

# 创建缓存目录
RUN mkdir -p /tmp/yarn-cache /tmp/npm-cache

# 多重策略安装依赖
RUN echo "=== Backend Dependencies Installation ===" && \
    echo "Configuring yarn for optimal performance..." && \
    yarn config set network-timeout 600000 && \
    yarn config set registry https://registry.npmjs.org/ && \
    yarn config set child-concurrency 1 && \
    yarn config set network-concurrency 1 && \
    yarn config set prefer-offline false && \
    yarn config set ignore-engines true && \
    yarn config set strict-ssl false && \
    echo "Testing network connectivity..." && \
    curl -I https://registry.npmjs.org/ || echo "Registry connectivity check failed" && \
    echo "Attempting dependency installation (Strategy 1: Standard)..." && \
    (timeout 900 yarn install --frozen-lockfile --production=false --network-timeout 600000 --verbose --ignore-optional || \
     (echo "Strategy 1 failed, trying Strategy 2: No frozen lockfile..." && \
      rm -rf node_modules && \
      yarn cache clean && \
      timeout 900 yarn install --production=false --network-timeout 600000 --verbose --ignore-optional --no-bin-links) || \
     (echo "Strategy 2 failed, trying Strategy 3: NPM fallback..." && \
      rm -rf node_modules && \
      npm config set registry https://registry.npmjs.org/ && \
      npm config set network-timeout 600000 && \
      npm config set fetch-retries 5 && \
      npm config set fetch-retry-factor 2 && \
      npm config set fetch-retry-mintimeout 10000 && \
      npm config set fetch-retry-maxtimeout 60000 && \
      timeout 900 npm install --verbose --legacy-peer-deps) || \
     (echo "Strategy 3 failed, trying Strategy 4: Manual retry with delays..." && \
      rm -rf node_modules && \
      yarn cache clean && \
      sleep 30 && \
      timeout 900 yarn install --production=false --network-timeout 600000 --verbose --ignore-engines --ignore-platform --ignore-optional)) && \
    echo "Backend dependencies installed successfully" && \
    ls -la node_modules/ | head -10

# 复制源代码和配置文件
COPY . .

# 验证关键文件存在
RUN echo "=== Verifying Build Environment ===" && \
    ls -la package.json && \
    ls -la tsconfig.json && \
    ls -la bootstrap.js && \
    ls -la src/ && \
    echo "Node.js version: $(node --version)" && \
    echo "NPM version: $(npm --version)" && \
    echo "Yarn version: $(yarn --version)" && \
    echo "Available memory: $(free -h)" && \
    echo "Disk space: $(df -h .)" && \
    echo "Dependencies verification:" && \
    (yarn list --depth=0 || npm list --depth=0 || echo "Dependency list failed")

# 构建应用
RUN echo "=== Building Backend Application ===" && \
    echo "Starting build process..." && \
    (timeout 1200 yarn build || \
     (echo "Yarn build failed, trying NPM build..." && \
      timeout 1200 npm run build) || \
     (echo "NPM build failed, trying with increased memory..." && \
      NODE_OPTIONS="--max-old-space-size=8192" timeout 1200 yarn build)) && \
    echo "Backend build completed successfully" && \
    ls -la dist/ && \
    echo "Build output summary:" && \
    find dist -type f | head -20 && \
    echo "Total files in dist: $(find dist -type f | wc -l)" && \
    echo "Dist directory size: $(du -sh dist/)"

# 生产阶段
FROM node:18-alpine AS production

# 设置工作目录
WORKDIR /app

# 复制package.json和yarn.lock
COPY package.json yarn.lock ./

# 只安装生产依赖 - 使用更强化的策略
RUN echo "=== Production Dependencies Installation ===" && \
    yarn config set network-timeout 600000 && \
    yarn config set registry https://registry.npmjs.org/ && \
    yarn config set child-concurrency 1 && \
    yarn config set network-concurrency 1 && \
    yarn config set ignore-engines true && \
    yarn config set strict-ssl false && \
    (timeout 900 yarn install --frozen-lockfile --production=true --network-timeout 600000 --ignore-optional || \
     (echo "Production install failed, trying alternative strategy..." && \
      rm -rf node_modules && \
      yarn cache clean && \
      timeout 900 yarn install --production=true --network-timeout 600000 --ignore-optional --no-bin-links) || \
     (echo "Yarn failed, trying NPM..." && \
      rm -rf node_modules && \
      npm config set registry https://registry.npmjs.org/ && \
      npm config set network-timeout 600000 && \
      npm config set fetch-retries 5 && \
      timeout 900 npm install --production --verbose --legacy-peer-deps)) && \
    yarn cache clean && \
    echo "Production dependencies installed successfully"

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
