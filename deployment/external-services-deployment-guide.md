# 外部服务部署指南

## 概述

您的配置使用外部MySQL和Redis服务器，前后端合并在一个Docker镜像中。当前的Dockerfile已经针对这种部署方式进行了优化。

## 配置文件分析

根据您提供的环境配置：

```env
# 外部MySQL服务器
DB_HOST=192.168.1.254
DB_PORT=3306
DB_USERNAME=procontractledger
DB_PASSWORD=KLV&a,aAu0
DB_DATABASE=procontractledger

# 外部Redis服务器
REDIS_HOST=192.168.1.160
REDIS_PORT=6379
REDIS_PASSWORD=12345678
REDIS_DB=13

# 应用配置
BACKEND_PORT=8080
FRONTEND_HTTP_PORT=80
```

## Dockerfile优化内容

### 1. 环境变量支持
已在Dockerfile中添加默认环境变量：
```dockerfile
ENV NODE_ENV=production \
    BACKEND_PORT=8080 \
    FRONTEND_HTTP_PORT=80 \
    LOG_LEVEL=info \
    CORS_ORIGINS=* \
    JWT_EXPIRES_IN=7d
```

### 2. 目录创建
添加了上传目录的创建：
```dockerfile
RUN mkdir -p /var/log/app /app/uploads && \
    chown -R appuser:nodejs /var/log/app /app/uploads
```

### 3. 启动脚本优化
在启动脚本中添加了配置信息显示，便于调试。

## 部署方案

### 方案一：使用简化配置（推荐）

1. **创建环境配置文件**
```bash
# 将您的配置保存为 .env 文件
cp your-config.env .env
```

2. **使用简化部署配置**
```bash
docker-compose -f deployment/docker-compose.simple.yml up -d
```

### 方案二：使用完整配置

1. **创建环境配置文件**
```bash
# 将您的配置保存为 .env.external-services 文件
cp your-config.env .env.external-services
```

2. **使用完整部署脚本**
```bash
# 初始化环境
bash deployment/deploy-external.sh --init

# 测试外部服务连接
bash deployment/deploy-external.sh --test

# 部署应用
bash deployment/deploy-external.sh --deploy
```

## 部署命令

### 快速部署
```bash
# 1. 拉取最新镜像
docker pull ghcr.io/bluewatercg/projectcontractledger:latest

# 2. 停止现有容器（如果存在）
docker stop contract-ledger-app 2>/dev/null || true
docker rm contract-ledger-app 2>/dev/null || true

# 3. 启动新容器
docker run -d \
  --name contract-ledger-app \
  --restart unless-stopped \
  -p 80:80 \
  -p 8080:8080 \
  --env-file .env \
  -v app_logs:/var/log/app \
  -v app_uploads:/app/uploads \
  ghcr.io/bluewatercg/projectcontractledger:latest
```

### 使用Docker Compose（推荐）
```bash
# 使用简化配置
docker-compose -f deployment/docker-compose.simple.yml up -d

# 查看日志
docker-compose -f deployment/docker-compose.simple.yml logs -f app

# 停止服务
docker-compose -f deployment/docker-compose.simple.yml down
```

## 验证部署

### 1. 检查容器状态
```bash
docker ps | grep contract-ledger
```

### 2. 检查应用健康
```bash
curl http://localhost/health
```

### 3. 检查日志
```bash
docker logs contract-ledger-app --tail 50
```

## 访问地址

- **前端**: http://您的服务器IP
- **后端API**: http://您的服务器IP:8080
- **健康检查**: http://您的服务器IP/health
- **API文档**: http://您的服务器IP/api-docs

## 默认登录账号

- **用户名**: admin
- **密码**: admin123

## 故障排除

### 1. 容器启动失败
```bash
# 查看详细日志
docker logs contract-ledger-app

# 检查环境变量
docker exec contract-ledger-app env | grep -E "(DB_|REDIS_)"
```

### 2. 数据库连接问题
```bash
# 测试数据库连接
mysql -h 192.168.1.254 -u procontractledger -p procontractledger

# 检查网络连通性
ping 192.168.1.254
telnet 192.168.1.254 3306
```

### 3. Redis连接问题
```bash
# 测试Redis连接
redis-cli -h 192.168.1.160 -p 6379 -a 12345678 ping

# 检查网络连通性
ping 192.168.1.160
telnet 192.168.1.160 6379
```

## 维护操作

### 更新应用
```bash
# 拉取最新镜像
docker pull ghcr.io/bluewatercg/projectcontractledger:latest

# 重新部署
docker-compose -f deployment/docker-compose.simple.yml up -d
```

### 备份数据
```bash
# 备份MySQL数据
mysqldump -h 192.168.1.254 -u procontractledger -p procontractledger > backup.sql

# 备份上传文件
docker cp contract-ledger-app:/app/uploads ./uploads-backup
```

## 总结

当前的Dockerfile已经完全支持您的外部服务配置，无需进行额外调整。建议使用Docker Compose进行部署，这样更便于管理和维护。
