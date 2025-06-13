# GitHub Actions 自动化部署指南

## 概述

本项目使用GitHub Actions自动构建和发布Docker镜像，支持外部MySQL和Redis服务器的简化部署方案。

## 架构说明

### 构建流程
1. **代码推送** → GitHub仓库
2. **GitHub Actions** → 自动构建Docker镜像
3. **GitHub Container Registry** → 存储镜像
4. **生产服务器** → 拉取镜像并运行

### 服务架构
- **前端**: Vue 3 + Element Plus
- **后端**: Midway.js + TypeORM
- **数据库**: 外部MySQL服务器
- **缓存**: 外部Redis服务器
- **容器**: 单一Docker镜像（前后端合并）

## GitHub Actions 配置

### 触发条件
- 推送到 `main`, `master`, `develop`, `midwayjs` 分支
- 创建版本标签 (`v*`)
- Pull Request
- 手动触发

### 构建特性
- **多平台支持**: linux/amd64, linux/arm64
- **自动测试**: Node.js 18.x, 20.x
- **缓存优化**: GitHub Actions缓存
- **自动标签**: 基于分支和版本的智能标签

### 镜像标签规则
- `latest`: 主分支最新版本
- `main`, `develop`: 分支名称
- `v1.0.0`: 版本标签
- `v1.0`, `v1`: 语义化版本
- `main-sha123456`: 分支+提交哈希

## 部署准备

### 1. 环境要求
- **生产服务器**: Docker 和 Docker Compose
- **外部MySQL服务器**: 已配置并可访问
- **外部Redis服务器**: 已配置并可访问
- **网络连接**: 能够访问GitHub Container Registry (ghcr.io)

### 2. 获取部署文件

#### 方法一：使用部署脚本（推荐）
```bash
# 下载部署脚本
wget https://raw.githubusercontent.com/bluewatercg/projectcontractledger/main/deploy-simple.sh
chmod +x deploy-simple.sh

# 初始化部署环境
./deploy-simple.sh --init
```

#### 方法二：手动下载
```bash
# 下载docker-compose文件
wget https://raw.githubusercontent.com/bluewatercg/projectcontractledger/main/docker-compose.external-simple.yml

# 下载环境变量模板
wget https://raw.githubusercontent.com/bluewatercg/projectcontractledger/main/.env.external-simple.template
cp .env.external-simple.template .env.external-simple
```

### 3. 配置环境变量

编辑 `.env.external-simple` 文件：

```bash
# 数据库配置
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USERNAME=your-mysql-username
DB_PASSWORD=your-mysql-password
DB_DATABASE=your-mysql-database

# Redis配置
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# 其他配置
NODE_ENV=production
BACKEND_PORT=8080
FRONTEND_HTTP_PORT=80
```

## 部署操作

### 使用部署脚本（推荐）

```bash
# 检查环境
./deploy-simple.sh --check

# 启动服务
./deploy-simple.sh

# 查看状态
./deploy-simple.sh --status

# 查看日志
./deploy-simple.sh --logs

# 重启服务
./deploy-simple.sh --restart

# 停止服务
./deploy-simple.sh --stop
```

### 手动部署

```bash
# 拉取最新镜像
docker-compose -f docker-compose.external-simple.yml --env-file .env.external-simple pull

# 启动服务
docker-compose -f docker-compose.external-simple.yml --env-file .env.external-simple up -d

# 查看状态
docker-compose -f docker-compose.external-simple.yml ps

# 查看日志
docker-compose -f docker-compose.external-simple.yml logs -f
```

## 访问应用

部署成功后，可以通过以下地址访问：

- **前端应用**: http://your-server-ip:80
- **后端API**: http://your-server-ip:8080
- **健康检查**: http://your-server-ip:80/health
- **API文档**: http://your-server-ip:80/api-docs

## 更新部署

### 自动更新
当代码推送到主分支时，GitHub Actions会自动构建新镜像。使用以下命令更新：

```bash
./deploy-simple.sh --pull
./deploy-simple.sh --restart
```

### 指定版本
```bash
# 在.env.external-simple中设置
IMAGE_TAG=v1.0.0

# 重新部署
./deploy-simple.sh --restart
```

## 故障排除

### 常见问题

1. **镜像拉取失败**
   - 检查网络连接
   - 确认GitHub Container Registry访问权限

2. **数据库连接失败**
   - 检查MySQL服务器配置
   - 验证网络连通性
   - 确认用户权限

3. **Redis连接失败**
   - 检查Redis服务器配置
   - 验证密码设置

### 日志查看
```bash
# 查看应用日志
./deploy-simple.sh --logs

# 查看特定服务日志
docker logs contract-ledger-app-simple

# 查看系统日志
docker-compose -f docker-compose.external-simple.yml logs app
```

### 健康检查
```bash
# 检查服务状态
./deploy-simple.sh --status

# 手动健康检查
curl http://localhost/health
curl http://localhost:8080/health
```

## 监控和维护

### 定期维护
- 定期更新镜像
- 监控资源使用情况
- 备份数据库
- 检查日志文件大小

### 性能优化
- 调整容器资源限制
- 优化数据库连接池
- 配置Redis缓存策略

## 安全建议

1. **环境变量安全**
   - 使用强密码
   - 定期更换JWT密钥
   - 限制文件访问权限

2. **网络安全**
   - 配置防火墙规则
   - 使用HTTPS（配置反向代理）
   - 限制数据库访问IP

3. **容器安全**
   - 定期更新基础镜像
   - 使用非root用户运行
   - 限制容器权限
