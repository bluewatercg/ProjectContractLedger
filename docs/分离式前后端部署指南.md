# 分离式前后端部署指南

本指南介绍如何部署分离的前后端容器，解决合并容器部署中的各种问题。

## 概述

分离式部署将前端和后端拆分为两个独立的Docker容器：
- **后端容器**: 运行Node.js API服务
- **前端容器**: 运行Nginx + Vue.js静态文件服务
- **可选代理**: Nginx反向代理提供统一入口

## 架构优势

### 相比合并容器的优势
1. **独立扩展**: 前后端可以独立扩展和更新
2. **故障隔离**: 一个服务的问题不会影响另一个
3. **资源优化**: 可以为不同服务分配不同的资源
4. **开发友好**: 支持独立开发和测试
5. **部署灵活**: 支持多种部署模式

### IP通讯支持
- 前后端通过IP地址进行通讯
- 支持同服务器和跨服务器部署
- 灵活的网络配置选项

## 快速开始

### 1. 环境准备

确保已安装：
- Docker 20.10+
- Docker Compose 2.0+

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp deployment/.env.separated.template deployment/.env.separated

# 编辑配置文件
nano deployment/.env.separated
```

关键配置项：
```bash
# 服务端口
BACKEND_PORT=8080
FRONTEND_PORT=80

# 服务器IP地址
BACKEND_HOST=192.168.1.115
FRONTEND_HOST=192.168.1.115

# 数据库配置
DB_HOST=192.168.1.254
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=192.168.1.160
REDIS_PASSWORD=your_password

# JWT密钥
JWT_SECRET=your_secret_key
```

### 3. 部署服务

#### 方式一：使用部署脚本（推荐）

**Linux/macOS:**
```bash
cd deployment
chmod +x deploy-separated.sh
./deploy-separated.sh
```

**Windows:**
```powershell
cd deployment
.\deploy-separated.ps1
```

#### 方式二：手动部署

```bash
cd deployment

# 拉取最新镜像
docker-compose -f docker-compose.separated.yml pull

# 启动服务
docker-compose -f docker-compose.separated.yml --env-file .env.separated up -d

# 检查状态
docker-compose -f docker-compose.separated.yml ps
```

### 4. 验证部署

访问以下地址验证服务：
- 前端: http://your-server-ip:80
- 后端API: http://your-server-ip:8080
- 健康检查: http://your-server-ip:8080/health

## 部署模式

### 模式一：基础分离部署

最简单的分离部署，前后端独立运行：

```yaml
services:
  backend:
    image: ghcr.io/bluewatercg/projectcontractledger-backend:latest
    ports:
      - "8080:8080"
  
  frontend:
    image: ghcr.io/bluewatercg/projectcontractledger-frontend:latest
    ports:
      - "80:80"
    environment:
      - BACKEND_HOST=192.168.1.115
      - BACKEND_PORT=8080
```

### 模式二：带代理的统一入口

使用Nginx代理提供统一访问入口：

```bash
# 启动包含代理的完整服务
docker-compose -f docker-compose.separated.yml --profile proxy up -d
```

访问地址：
- 统一入口: http://your-server-ip:8000
- 直接后端: http://your-server-ip:8081
- 直接前端: http://your-server-ip:8082

## 管理命令

### 查看服务状态
```bash
docker-compose -f docker-compose.separated.yml ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose -f docker-compose.separated.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.separated.yml logs -f backend
docker-compose -f docker-compose.separated.yml logs -f frontend
```

### 重启服务
```bash
# 重启所有服务
docker-compose -f docker-compose.separated.yml restart

# 重启特定服务
docker-compose -f docker-compose.separated.yml restart backend
```

### 更新服务
```bash
# 拉取最新镜像并重启
docker-compose -f docker-compose.separated.yml pull
docker-compose -f docker-compose.separated.yml up -d
```

### 停止服务
```bash
docker-compose -f docker-compose.separated.yml down
```

## 故障排除

### 常见问题

#### 1. 前端无法连接后端
**症状**: 前端页面加载但API调用失败

**解决方案**:
1. 检查BACKEND_HOST配置是否正确
2. 确认后端服务正在运行
3. 检查网络连通性

```bash
# 检查后端健康状态
curl http://your-backend-ip:8080/health

# 检查前端容器内的网络
docker exec -it contract-ledger-frontend ping your-backend-ip
```

#### 2. 容器启动失败
**症状**: 容器无法启动或立即退出

**解决方案**:
1. 检查环境变量配置
2. 查看容器日志
3. 验证镜像完整性

```bash
# 查看容器日志
docker logs contract-ledger-backend
docker logs contract-ledger-frontend

# 检查镜像
docker images | grep projectcontractledger
```

#### 3. 数据库连接失败
**症状**: 后端日志显示数据库连接错误

**解决方案**:
1. 验证数据库配置
2. 检查网络连通性
3. 确认数据库服务状态

```bash
# 测试数据库连接
docker exec -it contract-ledger-backend ping 192.168.1.254

# 检查数据库配置
docker exec -it contract-ledger-backend env | grep DB_
```

### 日志分析

#### 后端日志位置
- 容器内: `/app/logs/`
- 主机挂载: `backend_logs` volume

#### 前端日志位置
- Nginx访问日志: `/var/log/nginx/access.log`
- Nginx错误日志: `/var/log/nginx/error.log`

## 性能优化

### 资源配置

根据服务器配置调整资源限制：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
  
  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

### 网络优化

使用主机网络模式提高性能：

```yaml
services:
  backend:
    network_mode: host
  frontend:
    network_mode: host
```

## 安全考虑

### 网络安全
1. 使用防火墙限制端口访问
2. 配置HTTPS证书
3. 设置适当的CORS策略

### 数据安全
1. 使用强密码和密钥
2. 定期备份数据
3. 监控访问日志

## 监控和维护

### 健康检查
所有服务都配置了健康检查：
- 后端: `/health` 端点
- 前端: HTTP GET 根路径
- 代理: 代理健康检查

### 自动重启
配置了 `restart: unless-stopped` 策略，确保服务自动恢复。

### 日志轮转
建议配置日志轮转避免磁盘空间问题：

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 升级指南

### 从合并容器迁移

1. 备份现有数据
2. 停止现有服务
3. 部署分离服务
4. 验证功能正常
5. 清理旧容器

### 版本更新

1. 拉取最新镜像
2. 停止现有服务
3. 启动新版本
4. 验证功能

```bash
# 更新流程
docker-compose -f docker-compose.separated.yml pull
docker-compose -f docker-compose.separated.yml down
docker-compose -f docker-compose.separated.yml up -d
```
