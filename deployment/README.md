# 前后端分离部署目录

本目录包含前后端分离架构的Docker部署配置和脚本。

## 🏗️ 架构概述

前后端分离部署将应用拆分为两个独立的Docker容器：
- **后端容器**: Node.js API服务 (默认映射 8080:8080)
- **前端容器**: Nginx + Vue.js静态文件服务 (默认映射 8000:80)
- **可选代理**: Nginx反向代理提供统一入口 (默认映射 8001:80)

### 🔧 端口映射说明
- **宿主机端口**: 外部访问的端口，可根据环境调整
- **容器内端口**: Docker镜像内部端口，通常固定
- **格式**: `宿主机端口:容器内端口`

## 📁 目录结构

```
deployment/
├── README.md                    # 本说明文件
├── docker-compose.yml          # 基础部署配置（推荐）
├── docker-compose.separated.yml # 带代理的分离部署配置
├── .env.template               # 环境变量配置模板
├── deploy-separated.sh         # Linux/macOS部署脚本
├── deploy-separated.ps1        # Windows PowerShell部署脚本
└── nginx/
    ├── nginx-separated.conf    # Nginx代理配置
    └── nginx.conf             # 基础Nginx配置
```

## 🚀 快速开始

### 1. 环境准备

确保已安装：
- Docker 20.10+
- Docker Compose 2.0+

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.template .env

# 编辑配置文件，填写数据库和Redis信息
nano .env
```

### 3. 选择部署方式

#### 方式一：基础部署（推荐）
```bash
# Linux/macOS
./deploy-separated.sh

# Windows PowerShell
.\deploy-separated.ps1
```

#### 方式二：带代理的部署
```bash
# Linux/macOS
./deploy-separated.sh --proxy

# Windows PowerShell
.\deploy-separated.ps1 -Mode proxy
```

#### 方式三：手动部署
```bash
# 基础部署
docker-compose up -d

# 带代理的部署
docker-compose -f docker-compose.separated.yml --profile proxy up -d
```

## 📋 配置说明

### 必需配置项

编辑 `.env` 文件，填写以下必需配置：

```bash
# 数据库配置（必填）
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret_key

# 服务器IP配置（根据实际环境调整）
BACKEND_HOST=192.168.1.115
FRONTEND_HOST=192.168.1.115

# 外部服务地址（根据实际环境调整）
DB_HOST=192.168.1.254
REDIS_HOST=192.168.1.160
```

### 端口映射配置

```bash
# 前端服务端口映射
FRONTEND_HOST_PORT=8000        # 宿主机端口（外部访问）
FRONTEND_CONTAINER_PORT=80     # 容器内端口（镜像内部）

# 后端服务端口映射
BACKEND_HOST_PORT=8080         # 宿主机端口（外部访问）
BACKEND_CONTAINER_PORT=8080    # 容器内端口（镜像内部）

# Nginx代理端口映射（仅在使用代理模式时需要）
PROXY_HOST_PORT=8001           # 宿主机端口（外部访问）
PROXY_CONTAINER_PORT=80        # 容器内端口（镜像内部）
```

### 其他可选配置

```bash
# 网络模式
NETWORK_MODE=bridge

# 应用配置
LOG_LEVEL=info
TZ=Asia/Shanghai

# 兼容性配置（自动设置，无需手动修改）
FRONTEND_PORT=${FRONTEND_HOST_PORT}
BACKEND_PORT=${BACKEND_HOST_PORT}
PROXY_PORT=${PROXY_HOST_PORT}
```

## 🎯 部署模式

### 基础模式（推荐）
- **特点**: 前后端独立容器，直接访问
- **适用**: 大多数生产环境
- **默认访问**:
  - 前端: http://服务器IP:8000
  - 后端: http://服务器IP:8080

### 代理模式
- **特点**: 通过Nginx代理提供统一入口
- **适用**: 需要统一域名访问的场景
- **默认访问**:
  - 统一入口: http://服务器IP:8001
  - 前端直接: http://服务器IP:8000
  - 后端直接: http://服务器IP:8080

### 🔧 自定义端口示例

```bash
# 示例1: 使用高端口避免冲突
FRONTEND_HOST_PORT=9000
BACKEND_HOST_PORT=9080
PROXY_HOST_PORT=9001

# 示例2: 使用连续端口便于管理
FRONTEND_HOST_PORT=8100
BACKEND_HOST_PORT=8101
PROXY_HOST_PORT=8102

# 示例3: 适应特定环境要求
FRONTEND_HOST_PORT=3000
BACKEND_HOST_PORT=3001
PROXY_HOST_PORT=3002
```

## 🛠️ 管理命令

### 部署脚本命令

```bash
# Linux/macOS
./deploy-separated.sh --basic    # 基础部署
./deploy-separated.sh --proxy    # 代理部署
./deploy-separated.sh --update   # 更新部署
./deploy-separated.sh --stop     # 停止服务
./deploy-separated.sh --logs     # 查看日志
./deploy-separated.sh --status   # 查看状态

# Windows PowerShell
.\deploy-separated.ps1 -Mode basic   # 基础部署
.\deploy-separated.ps1 -Mode proxy   # 代理部署
.\deploy-separated.ps1 -Mode update  # 更新部署
.\deploy-separated.ps1 -Mode stop    # 停止服务
.\deploy-separated.ps1 -Mode logs    # 查看日志
.\deploy-separated.ps1 -Mode status  # 查看状态
```

### Docker Compose命令

```bash
# 基础部署
docker-compose up -d
docker-compose logs -f
docker-compose down

# 代理部署
docker-compose -f docker-compose.separated.yml --profile proxy up -d
docker-compose -f docker-compose.separated.yml logs -f
docker-compose -f docker-compose.separated.yml down
```

## 🔧 故障排除

### 常见问题

#### 1. 容器启动失败
```bash
# 检查日志
docker-compose logs backend
docker-compose logs frontend

# 检查环境变量
cat .env
```

#### 2. 数据库连接失败
- 检查 `DB_HOST`、`DB_USERNAME`、`DB_PASSWORD` 配置
- 确认外部MySQL服务可访问
- 检查防火墙设置

#### 3. Redis连接失败
- 检查 `REDIS_HOST`、`REDIS_PORT` 配置
- 确认外部Redis服务可访问
- 检查Redis密码配置

#### 4. 前后端通讯失败
- 检查 `BACKEND_HOST`、`BACKEND_PORT` 配置
- 确认网络模式设置正确
- 检查容器间网络连通性

### 健康检查

```bash
# 检查后端健康状态
curl http://localhost:8080/health

# 检查前端访问
curl http://localhost:80

# 检查代理（如果使用）
curl http://localhost:8000/health
```

## 📊 监控和日志

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 查看最近的日志
docker-compose logs --tail=100 backend
```

### 监控资源使用
```bash
# 查看容器状态
docker-compose ps

# 查看资源使用情况
docker stats

# 查看容器详细信息
docker inspect contract-ledger-backend
docker inspect contract-ledger-frontend
```

## 🔄 更新和维护

### 更新镜像
```bash
# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose up -d
```

### 数据备份
```bash
# 备份上传文件
docker cp contract-ledger-backend:/app/uploads ./backup-uploads

# 备份日志
docker cp contract-ledger-backend:/app/logs ./backup-logs
```

### 清理资源
```bash
# 停止并删除容器
docker-compose down

# 清理未使用的镜像
docker image prune -f

# 清理未使用的卷
docker volume prune -f
```

## 📚 相关文档

- [项目主文档](../README.md)
- [Docker构建指南](../docs/deployment/docker-build-guide.md)
- [分离式部署指南](../docs/deployment/分离式前后端部署指南.md)
- [GitHub Actions自动构建](../.github/workflows/)
