# 使用官方 Node.js 18 LTS Alpine 镜像作为基础镜像
# This stage sets up the base Node.js environment using a lightweight Alpine image.
FROM node:18-alpine

# 设置工作目录
# This command sets the current working directory inside the container to /app.
WORKDIR /app

# 将 package.json 和 package-lock.json 复制到工作目录
# These commands copy the package manifest files to the working directory.
# This is done separately to leverage Docker's caching mechanism for dependency installation.
COPY package*.json ./

# 安装项目依赖
# This command installs all Node.js dependencies listed in package.json.
# The --omit=dev flag ensures that only production dependencies are installed.
RUN npm install --omit=dev

# 将所有应用程序代码复制到工作目录
# This command copies all application source code from the host to the container's /app directory.
COPY backend_service /backend_service
COPY . .

# 暴露应用程序运行的端口
# This instruction informs Docker that the container will listen on the specified network port at runtime.
EXPOSE 3000

# 定义容器启动时运行的命令
# This command specifies the default command to run when the container starts.
# It executes the Node.js application using server.js.
CMD ["node", "server.js"]