# 用户指南

本文档提供项目的完整使用指南，包括开发环境搭建、部署和常用操作。

## 🚀 快速开始

### 开发环境启动

#### 方式一：使用Yarn脚本（推荐）
```bash
# Windows PowerShell (推荐)
yarn start-ps

# Windows 批处理
yarn start

# Linux/Mac
yarn start-sh
```

#### 方式二：手动启动
```bash
# 1. 安装依赖
yarn install-all

# 2. 启动后端 (终端1)
cd apps/backend && yarn dev

# 3. 启动前端 (终端2)  
cd apps/frontend && yarn dev
```

### 访问地址
- **前端应用**: http://localhost:8000
- **后端API**: http://localhost:8080
- **API文档**: http://localhost:8080/api-docs

### 默认账户
- **用户名**: admin
- **密码**: admin123

## 🏗️ 生产部署

### 一键部署
```bash
# 1. 下载部署脚本
wget https://raw.githubusercontent.com/bluewatercg/projectcontractledger/main/deploy-simple.sh
chmod +x deploy-simple.sh

# 2. 初始化环境
./deploy-simple.sh --init

# 3. 配置数据库信息
# 编辑 .env.external-simple 文件

# 4. 启动服务
./deploy-simple.sh
```

### 环境变量配置
| 变量名 | 必填 | 说明 |
|--------|------|------|
| DB_HOST | ✅ | MySQL服务器地址 |
| DB_USERNAME | ✅ | MySQL用户名 |
| DB_PASSWORD | ✅ | MySQL密码 |
| DB_DATABASE | ✅ | MySQL数据库名 |
| REDIS_HOST | ✅ | Redis服务器地址 |
| JWT_SECRET | ✅ | JWT密钥（至少32字符） |

## 📋 常用命令

### 开发命令
```bash
# 依赖管理
yarn install-all        # 安装所有依赖
yarn build-all          # 构建所有应用
yarn clean              # 清理依赖和构建文件

# 测试相关
yarn test-login         # 测试登录功能
yarn test-api           # 测试API接口
yarn performance-test   # 性能测试

# 数据库操作
yarn apply-indexes      # 应用数据库索引
yarn test-db           # 测试数据库连接
yarn db-info           # 查看数据库信息

# Docker操作
yarn docker:build      # 构建Docker镜像
yarn docker:dev        # 启动开发环境
yarn docker:prod       # 启动生产环境
```

### 部署命令
```bash
# 服务管理
./deploy-simple.sh --status    # 查看服务状态
./deploy-simple.sh --logs      # 查看日志
./deploy-simple.sh --restart   # 重启服务
./deploy-simple.sh --stop      # 停止服务
./deploy-simple.sh --pull      # 更新镜像
```

## 📁 项目结构

```
ProjectContractLedger/
├── apps/                    # 应用程序
│   ├── backend/            # 后端服务 (Node.js + Midway.js)
│   └── frontend/           # 前端应用 (Vue3 + Element Plus)
├── database/               # 数据库相关
│   ├── migrations/         # 数据库迁移
│   └── scripts/           # 数据库脚本
├── deployment/            # 部署配置
├── docs/                  # 项目文档
├── tools/                 # 工具脚本
│   ├── backup/           # 备份工具
│   └── maintenance/      # 维护工具
├── config/               # 配置模板
└── scripts/              # 构建脚本
```

## 🔧 故障排除

### 常见问题

#### 1. 端口占用
```bash
# 检查端口占用
netstat -ano | findstr :8080
netstat -ano | findstr :8000

# 结束占用进程
taskkill /PID <进程ID> /F
```

#### 2. 依赖安装失败
```bash
# 清理缓存重新安装
yarn cache clean
yarn clean
yarn install-all
```

#### 3. 数据库连接问题
```bash
# 测试数据库连接
cd tools/maintenance
./debug-database-connection.sh

# 检查配置
source deployment/.env && echo "配置正确"
```

#### 4. Docker相关问题
```bash
# 检查Docker环境
cd tools/maintenance
./check-docker-env.sh

# 查看容器日志
docker logs contract-ledger-backend
```

### 维护工具

项目提供了完整的维护工具：

```bash
# 备份相关
cd tools/backup
./backup-system.sh              # 系统备份
./setup-auto-backup.sh          # 设置自动备份
./check-backup-status.sh        # 检查备份状态

# 问题诊断
cd tools/maintenance
./debug-database-connection.sh  # 数据库连接诊断
./check-docker-env.sh          # Docker环境检查
./fix-contract-upload-issue.sh # 修复上传问题
```

## 🎯 开发流程

### 1. 环境准备
- Node.js >= 16.0.0
- Yarn >= 1.22.0
- MySQL >= 5.7
- Redis >= 5.0

### 2. 开发步骤
```bash
# 1. 克隆项目
git clone <repository-url>
cd ProjectContractLedger

# 2. 安装依赖
yarn install-all

# 3. 启动开发环境
yarn start-ps

# 4. 访问应用
# 前端: http://localhost:8000
# 后端: http://localhost:8080
```

### 3. 代码提交
```bash
# 格式化代码
yarn lint:fix

# 运行测试
yarn test

# 提交代码
git add .
git commit -m "feat: 新功能描述"
git push
```

## 📊 技术栈

### 后端技术
- **框架**: Midway.js 3.x
- **数据库**: MySQL 8.0 + TypeORM
- **缓存**: Redis
- **认证**: JWT
- **文档**: Swagger

### 前端技术
- **框架**: Vue.js 3.x
- **构建**: Vite
- **UI库**: Element Plus
- **状态管理**: Pinia
- **HTTP**: Axios

### 部署技术
- **容器化**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **镜像仓库**: GitHub Container Registry

## 📞 获取帮助

如遇问题：

1. **查看日志**: `docker logs contract-ledger-backend`
2. **运行诊断**: 使用 `tools/maintenance/` 下的脚本
3. **查看文档**: 参考 `docs/` 目录下的详细文档
4. **提交Issue**: 在GitHub仓库提交问题报告

## 🔄 更新部署

### 自动更新
```bash
# 拉取最新镜像
./deploy-simple.sh --pull

# 重启服务
./deploy-simple.sh --restart
```

### 手动更新
```bash
# 更新代码
git pull origin main

# 重新构建
yarn build-all

# 重启服务
docker-compose restart
```

---

更多详细信息请参考 `docs/` 目录下的专项文档。