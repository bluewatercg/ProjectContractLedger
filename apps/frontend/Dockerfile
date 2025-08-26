# 构建阶段 - 使用更稳定的Node.js版本
FROM node:18-alpine AS build

# 安装必要的构建工具和网络调试工具
RUN apk add --no-cache python3 make g++ curl wget git

# 设置工作目录
WORKDIR /app

# 设置环境变量以优化构建过程
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV YARN_CACHE_FOLDER=/tmp/yarn-cache
ENV NPM_CONFIG_CACHE=/tmp/npm-cache

# 复制package.json和yarn.lock（如果存在）
COPY package.json ./
COPY yarn.lock* ./

# 创建缓存目录
RUN mkdir -p /tmp/yarn-cache /tmp/npm-cache

# 多重策略安装依赖
RUN echo "=== Frontend Dependencies Installation ===" && \
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
    (timeout 900 yarn install --frozen-lockfile --network-timeout 600000 --verbose --ignore-optional || \
     (echo "Strategy 1 failed, trying Strategy 2: No frozen lockfile..." && \
      rm -rf node_modules && \
      yarn cache clean && \
      timeout 900 yarn install --network-timeout 600000 --verbose --ignore-optional --no-bin-links) || \
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
      timeout 900 yarn install --network-timeout 600000 --verbose --ignore-engines --ignore-platform --ignore-optional)) && \
    echo "Frontend dependencies installed successfully" && \
    ls -la node_modules/ | head -10

# 复制源代码和配置文件
COPY . .

# 验证关键文件存在
RUN echo "=== Verifying Build Environment ===" && \
    ls -la package.json && \
    ls -la vite.config.ts && \
    ls -la tsconfig.json && \
    ls -la src/ && \
    echo "Node.js version: $(node --version)" && \
    echo "NPM version: $(npm --version)" && \
    echo "Yarn version: $(yarn --version)" && \
    echo "Available memory: $(free -h)" && \
    echo "Disk space: $(df -h .)" && \
    echo "Dependencies verification:" && \
    (yarn list --depth=0 || npm list --depth=0 || echo "Dependency list failed")

# 构建应用
RUN echo "=== Building Frontend Application ===" && \
    echo "Starting build process..." && \
    (timeout 1200 yarn build || \
     (echo "Yarn build failed, trying NPM build..." && \
      timeout 1200 npm run build) || \
     (echo "NPM build failed, trying with increased memory..." && \
      NODE_OPTIONS="--max-old-space-size=8192" timeout 1200 yarn build)) && \
    echo "Frontend build completed successfully" && \
    ls -la dist/ && \
    echo "Build output summary:" && \
    find dist -type f | head -20 && \
    echo "Total files in dist: $(find dist -type f | wc -l)" && \
    echo "Dist directory size: $(du -sh dist/)"

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
