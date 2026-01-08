# 🛠️ 开发环境设置指南

本指南帮助开发者快速搭建完整的开发环境，包括前端、后端和数据库配置。

## 📋 系统要求

### 必需软件
- **Node.js** >= 16.0.0 ([下载地址](https://nodejs.org/))
- **Yarn** >= 1.22.0 (`npm install -g yarn`)
- **MySQL** >= 5.7 ([下载地址](https://dev.mysql.com/downloads/))
- **Redis** >= 5.0 ([下载地址](https://redis.io/download))
- **Git** ([下载地址](https://git-scm.com/))

### 推荐工具
- **VS Code** + 推荐插件
- **Postman** 或 **Insomnia** (API测试)
- **MySQL Workbench** (数据库管理)
- **Redis Desktop Manager** (Redis管理)

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd ProjectContractLedger
```

### 2. 安装依赖
```bash
# 安装所有依赖（前端+后端）
yarn install-all

# 或者分别安装
cd apps/frontend && yarn install
cd ../backend && yarn install
```

### 3. 数据库设置

#### MySQL 配置
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE procontractledger CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'procontractledger'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON procontractledger.* TO 'procontractledger'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 导入初始数据
mysql -u procontractledger -p procontractledger < database/scripts/mysql_init.sql
```

#### Redis 配置
```bash
# 启动Redis服务
redis-server

# 测试连接
redis-cli ping
# 应该返回 PONG
```

### 4. 环境变量配置

#### 后端环境变量
创建 `apps/backend/.env` 文件：
```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=procontractledger
DB_PASSWORD=your_password
DB_DATABASE=procontractledger

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# 服务配置
PORT=8080
NODE_ENV=development

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# 日志配置
LOG_LEVEL=info
LOG_DIR=./logs
```

#### 前端环境变量
创建 `apps/frontend/.env.development` 文件：
```bash
# API配置
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_API_TIMEOUT=10000

# 应用配置
VITE_APP_TITLE=合同管理系统
VITE_APP_VERSION=1.0.0

# 开发配置
VITE_DEV_PORT=8000
VITE_DEV_HOST=localhost
```

### 5. 启动开发服务

#### 方式一：一键启动（推荐）
```bash
# Windows PowerShell
yarn start-ps

# Linux/macOS
yarn start-sh
```

#### 方式二：分别启动
```bash
# 终端1：启动后端
cd apps/backend
yarn dev

# 终端2：启动前端
cd apps/frontend
yarn dev
```

### 6. 验证安装

访问以下地址验证服务是否正常：
- **前端应用**: http://localhost:8000
- **后端API**: http://localhost:8080
- **API文档**: http://localhost:8080/api-docs
- **健康检查**: http://localhost:8080/api/v1/health

## 🔧 VS Code 开发环境

### 推荐插件
```json
{
  "recommendations": [
    "vue.volar",
    "vue.vscode-typescript-vue-plugin",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

### 工作区设置
创建 `.vscode/settings.json`：
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "vue.server.hybridMode": true,
  "files.associations": {
    "*.vue": "vue"
  },
  "emmet.includeLanguages": {
    "vue": "html"
  }
}
```

### 调试配置
创建 `.vscode/launch.json`：
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/backend/bootstrap.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:8000",
      "webRoot": "${workspaceFolder}/apps/frontend/src"
    }
  ]
}
```

## 🧪 测试环境设置

### 单元测试
```bash
# 运行所有测试
yarn test

# 运行前端测试
cd apps/frontend && yarn test

# 运行后端测试
cd apps/backend && yarn test

# 监听模式
yarn test:watch
```

### API测试
```bash
# 测试登录API
yarn test-login

# 测试所有API
yarn test-api

# 性能测试
yarn performance-test
```

## 🗄️ 数据库管理

### 常用命令
```bash
# 应用数据库索引
yarn apply-indexes

# 测试数据库连接
yarn test-db

# 查看数据库信息
yarn db-info

# 数据库备份
cd tools/backup
./backup-system.sh

# 数据库恢复
./restore-system.sh
```

### 数据库迁移
```bash
# 生成迁移文件
cd apps/backend
yarn migration:generate -n MigrationName

# 运行迁移
yarn migration:run

# 回滚迁移
yarn migration:revert
```

## 🐳 Docker 开发环境

### 使用 Docker Compose
```bash
# 启动开发环境
yarn docker:dev

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f

# 停止服务
docker-compose -f docker-compose.dev.yml down
```

### 本地构建镜像
```bash
# 构建所有镜像
yarn docker:build

# 构建特定服务
docker build -t contract-ledger-frontend ./apps/frontend
docker build -t contract-ledger-backend ./apps/backend
```

## 🔍 调试技巧

### 后端调试
```bash
# 启用调试模式
DEBUG=* yarn dev

# 查看SQL查询
DEBUG=typeorm:* yarn dev

# 查看HTTP请求
DEBUG=midway:* yarn dev
```

### 前端调试
```bash
# 启用详细日志
VITE_LOG_LEVEL=debug yarn dev

# 分析构建包
yarn build --analyze

# 检查类型
yarn type-check
```

### 数据库调试
```bash
# 使用调试工具
cd tools/maintenance
./debug-database-connection.sh

# 查看慢查询
mysql -u root -p -e "SHOW PROCESSLIST;"

# 分析查询性能
mysql -u root -p -e "EXPLAIN SELECT * FROM contracts WHERE status = 'active';"
```

## 🛠️ 常见问题解决

### 端口占用
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:8080 | xargs kill -9
```

### 依赖问题
```bash
# 清理缓存
yarn cache clean
rm -rf node_modules
rm yarn.lock

# 重新安装
yarn install
```

### 数据库连接问题
```bash
# 检查MySQL服务状态
# Windows
net start mysql

# Linux
sudo systemctl status mysql

# macOS
brew services start mysql
```

### Redis连接问题
```bash
# 检查Redis服务状态
# Windows
redis-server

# Linux
sudo systemctl status redis

# macOS
brew services start redis
```

## 📊 性能监控

### 开发工具
```bash
# 前端性能分析
yarn build --analyze

# 后端性能监控
yarn dev --inspect

# 数据库性能监控
mysql -u root -p -e "SHOW STATUS LIKE 'Slow_queries';"
```

### 内存和CPU监控
```bash
# Node.js 内存使用
node --inspect apps/backend/bootstrap.js

# 系统资源监控
# Windows
tasklist /fi "imagename eq node.exe"

# Linux/macOS
ps aux | grep node
```

## 🔄 代码质量

### 代码格式化
```bash
# 格式化所有代码
yarn lint:fix

# 检查代码规范
yarn lint

# 类型检查
yarn type-check
```

### Git Hooks
```bash
# 安装 Git hooks
yarn prepare

# 提交前检查
git add .
git commit -m "feat: add new feature"
# 自动运行 lint 和 test
```

## 📚 学习资源

### 官方文档
- [Midway.js 文档](https://midwayjs.org/)
- [Vue 3 文档](https://vuejs.org/)
- [Element Plus 文档](https://element-plus.org/)
- [TypeORM 文档](https://typeorm.io/)

### 项目文档
- [API 开发指南](development/API_Development_Guide.md)
- [数据库设计](development/Database_Design.md)
- [系统架构](ARCHITECTURE.md)

## 🆘 获取帮助

遇到问题时：
1. 查看 [故障排除指南](TROUBLESHOOTING.md)
2. 使用项目调试工具 `tools/maintenance/`
3. 查看相关日志文件
4. 在团队内寻求技术支持

## ✅ 开发环境检查清单

- [ ] Node.js 和 Yarn 已安装
- [ ] MySQL 和 Redis 服务正常运行
- [ ] 数据库已创建并导入初始数据
- [ ] 环境变量文件已配置
- [ ] 依赖包安装成功
- [ ] 前后端服务启动正常
- [ ] API 文档可以访问
- [ ] 测试用例运行通过
- [ ] VS Code 插件已安装
- [ ] Git hooks 配置完成

完成以上步骤后，你就拥有了一个完整的开发环境！🎉