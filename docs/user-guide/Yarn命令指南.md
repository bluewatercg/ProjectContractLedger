# Yarn 命令使用指南

## 🚀 快速开始

本项目使用 **Yarn** 作为包管理器，提供了丰富的命令来简化开发和部署流程。

## 📋 可用命令

### 🔧 开发环境

```bash
# 启动开发环境 (Windows PowerShell - 推荐)
yarn start-ps

# 启动开发环境 (Windows 批处理)
yarn start

# 启动开发环境 (Linux/Mac)
yarn start-sh

# 开发模式 (同上)
yarn dev
yarn dev-ps
yarn dev-sh
```

### 📦 依赖管理

```bash
# 安装所有应用的依赖
yarn install-all

# 构建所有应用
yarn build-all

# 清理所有依赖和构建文件
yarn clean
```

### 🧪 测试相关

```bash
# 测试登录功能
yarn test-login

# 测试API接口
yarn test-api

# 性能测试
yarn performance-test
```

### 🗄️ 数据库操作

```bash
# 应用数据库索引
yarn apply-indexes

# 测试数据库连接
yarn test-db

# 查看数据库信息
yarn db-info
```

### 🐳 Docker 操作

```bash
# 构建Docker镜像
yarn docker:build

# 启动开发环境 (Docker)
yarn docker:dev

# 启动生产环境 (Docker)
yarn docker:prod
```

## 🎯 常用开发流程

### 1. 初始化项目

```bash
# 1. 克隆项目
git clone <repository-url>
cd ProjectContractLedger

# 2. 安装所有依赖
yarn install-all

# 3. 启动开发环境
yarn start-ps  # Windows PowerShell
# 或
yarn start-sh  # Linux/Mac
```

### 2. 日常开发

```bash
# 启动开发环境
yarn dev-ps

# 在另一个终端测试功能
yarn test-login

# 查看数据库状态
yarn db-info
```

### 3. 生产部署

```bash
# 构建生产版本
yarn build-all

# 使用Docker部署
yarn docker:build
yarn docker:prod
```

## 🔍 命令详解

### 开发启动命令

- **`yarn start-ps`**: 使用PowerShell启动，支持彩色输出和错误处理
- **`yarn start`**: 使用批处理启动，简单快速
- **`yarn start-sh`**: 使用Bash启动，适用于Linux/Mac

### 依赖管理命令

- **`yarn install-all`**: 自动进入前后端目录安装依赖
- **`yarn build-all`**: 构建前后端应用
- **`yarn clean`**: 清理所有node_modules和构建文件

### 测试命令

- **`yarn test-login`**: 测试登录API和功能
- **`yarn test-api`**: 测试主要API接口
- **`yarn performance-test`**: 运行性能测试脚本

### 数据库命令

- **`yarn apply-indexes`**: 应用数据库性能优化索引
- **`yarn test-db`**: 测试数据库连接状态
- **`yarn db-info`**: 显示数据库版本和表信息

## 💡 使用技巧

### 1. 并行执行

```bash
# 可以同时运行多个命令
yarn start-ps &
yarn test-login
```

### 2. 环境检查

```bash
# 检查yarn版本
yarn --version

# 检查项目依赖状态
yarn check
```

### 3. 缓存管理

```bash
# 清理yarn缓存
yarn cache clean

# 查看缓存目录
yarn cache dir
```

### 4. 工作区管理

```bash
# 查看工作区信息
yarn workspaces info

# 在特定工作区运行命令
yarn workspace backend dev
yarn workspace frontend dev
```

## 🚨 故障排除

### 常见问题

1. **依赖安装失败**
   ```bash
   yarn clean
   yarn install-all
   ```

2. **端口占用**
   ```bash
   # 检查端口占用
   netstat -ano | findstr :8080
   netstat -ano | findstr :8000
   ```

3. **权限问题 (Windows)**
   ```bash
   # 以管理员身份运行PowerShell
   yarn start-ps
   ```

4. **缓存问题**
   ```bash
   yarn cache clean
   yarn install-all
   ```

## 📁 相关文件位置

- **启动脚本**: `scripts/dev/`
- **测试脚本**: `testing/scripts/`
- **数据库脚本**: `database/scripts/`
- **Docker配置**: `tools/docker/`
- **应用代码**: `apps/backend/` 和 `apps/frontend/`

## 🔗 相关文档

- [启动指南](./启动指南.md)
- [项目结构说明](./项目结构说明-新版.md)
- [API开发指南](../development/API_Development_Guide.md)
- [Docker部署指南](../development/Docker_Deployment.md)

---

使用 Yarn 让项目管理更简单高效！🎉
