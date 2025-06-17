# 构建阶段
FROM node:18-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制package.json和yarn.lock
COPY package.json yarn.lock ./

# 安装依赖
RUN yarn install --frozen-lockfile
RUN npm rebuild

# 复制源代码
COPY . .

# 构建应用
# 调试：列出node_modules/.bin目录内容
RUN ls -F node_modules/.bin/

# 确保node_modules/.bin在PATH中
ENV PATH="/app/node_modules/.bin:$PATH"

# 调试：检查yarn命令是否存在
# 调试：检查vite的权限和路径
RUN ls -l /app/node_modules/.bin/vite && which vite

# 构建应用
RUN yarn build

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
