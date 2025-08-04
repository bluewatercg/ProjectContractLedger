# Docker 部署指南

本文档介绍如何使用 Docker 和 GitHub Actions 部署客户合同管理系统。

## 架构说明

本项目采用**单镜像架构**，将前端（Vue3 + Nginx）和后端（Midway.js + Node.js）打包在同一个Docker镜像中：

- **前端**: 使用 Nginx 提供静态文件服务
- **后端**: 使用 Node.js 运行 Midway.js API 服务
- **代理**: Nginx 代理 `/api/*` 请求到后端服务
- **启动**: 使用启动脚本同时管理前后端进程

## 目录结构

```
ProjectContractLedger/
├── .github/
│   └── workflows/
│       └── docker-build-push.yml    # GitHub Actions 工作流
├── midway-backend/                   # 后端源码
├── midway-frontend/                  # 前端源码
├── Dockerfile                        # 单镜像构建配置
├── nginx.conf                        # Nginx 配置
├── start.sh                          # 启动脚本
├── .dockerignore                     # Docker 忽略文件
├── docker-compose.yml               # 本地开发环境配置
└── docker-compose.prod.yml         # 生产环境配置
```

## 本地开发环境

### 使用 Docker Compose 启动完整环境

```bash
# 构建并启动所有服务
docker-compose up --build

# 后台运行
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 清理数据卷（注意：会删除数据库数据）
docker-compose down -v
```

### 服务访问地址

- **前端应用**: http://localhost
- **后端API**: http://localhost/api (通过Nginx代理)
- **直接后端API**: http://localhost:8080 (仅开发调试)
- **API文档**: http://localhost/api-docs
- **MySQL数据库**: localhost:3306

### 健康检查端点

- **应用健康检查**: http://localhost/health (推荐)
- **后端直接检查**: http://localhost:8080/health
- **后端简单检查**: http://localhost:8080/health/simple
- **后端就绪检查**: http://localhost:8080/health/ready
- **后端存活检查**: http://localhost:8080/health/live

## GitHub Actions 自动化部署

### 工作流程

1. **触发条件**:
   - 推送到 `main`、`master`、`develop` 分支
   - 创建版本标签 (如 `v1.0.0`)
   - 创建 Pull Request

2. **构建流程**:
   - 代码检出
   - 运行测试 (Node.js 18.x, 20.x)
   - 代码质量检查
   - 多阶段构建单个 Docker 镜像
   - 推送到 GitHub Container Registry

### 镜像标签策略

- `latest`: 主分支最新版本
- `main`, `develop`: 分支名称
- `v1.0.0`: 版本标签
- `v1.0`, `v1`: 语义化版本
- `main-abc1234`: 分支名+提交哈希

### 使用发布的镜像

```bash
# 拉取最新镜像
docker pull ghcr.io/your-username/your-repo:latest

# 运行应用服务（包含前后端）
docker run -d \
  --name contract-ledger-app \
  -p 80:80 \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  -e DB_USERNAME=your-db-user \
  -e DB_PASSWORD=your-db-pass \
  -e DB_DATABASE=contract_ledger \
  -e JWT_SECRET=your-jwt-secret \
  ghcr.io/your-username/your-repo:latest

# 仅运行前端端口（推荐）
docker run -d \
  --name contract-ledger-app \
  -p 80:80 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  -e DB_USERNAME=your-db-user \
  -e DB_PASSWORD=your-db-pass \
  -e DB_DATABASE=contract_ledger \
  ghcr.io/your-username/your-repo:latest
```

## 生产环境部署

### 环境变量配置

#### 后端环境变量

```bash
NODE_ENV=production
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
DB_DATABASE=contract_ledger
JWT_SECRET=your-jwt-secret-key
```

#### 前端环境变量

前端配置通过构建时的环境变量设置，或在运行时通过配置文件动态加载。

### 使用 Docker Compose 部署

创建生产环境的 `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/your-username/your-repo-backend:latest
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_DATABASE=${DB_DATABASE}
    depends_on:
      - mysql
    restart: unless-stopped

  frontend:
    image: ghcr.io/your-username/your-repo-frontend:latest
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=${DB_DATABASE}
      - MYSQL_USER=${DB_USERNAME}
      - MYSQL_PASSWORD=${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

### Kubernetes 部署

可以使用 Kubernetes 进行更高级的容器编排部署。参考 `k8s/` 目录下的配置文件。

## 监控和日志

### 健康检查

所有服务都配置了健康检查：

- **后端**: 检查数据库连接和内存使用
- **前端**: 检查 Nginx 服务状态
- **数据库**: 检查 MySQL 服务可用性

### 日志收集

```bash
# 查看服务日志
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# 实时跟踪日志
docker-compose logs -f backend
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否启动
   - 验证连接参数和凭据
   - 查看网络连接

2. **前端无法访问后端API**
   - 检查 nginx 代理配置
   - 验证后端服务端口
   - 查看 CORS 配置

3. **镜像构建失败**
   - 检查 Dockerfile 语法
   - 验证依赖安装
   - 查看构建日志

### 调试命令

```bash
# 进入容器调试
docker exec -it contract-backend /bin/sh
docker exec -it contract-frontend /bin/sh

# 查看容器资源使用
docker stats

# 查看容器详细信息
docker inspect contract-backend
```

## 安全考虑

1. **镜像安全**
   - 使用非 root 用户运行应用
   - 定期更新基础镜像
   - 扫描镜像漏洞

2. **网络安全**
   - 配置防火墙规则
   - 使用 HTTPS
   - 限制容器间通信

3. **数据安全**
   - 加密敏感环境变量
   - 定期备份数据
   - 使用安全的数据库连接

## 性能优化

1. **镜像优化**
   - 使用多阶段构建
   - 最小化镜像层数
   - 使用 .dockerignore

2. **运行时优化**
   - 配置资源限制
   - 使用缓存策略
   - 启用 Gzip 压缩

3. **监控指标**
   - CPU 和内存使用率
   - 响应时间
   - 错误率
