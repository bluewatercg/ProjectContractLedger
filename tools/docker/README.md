# Docker 部署说明

## 目录结构

```
tools/docker/
├── docker-compose.yml          # 开发环境配置
├── docker-compose.prod.yml     # 生产环境配置
├── data/                       # 数据持久化目录
│   ├── uploads/               # 附件存储目录
│   └── logs/                  # 应用日志目录
└── database/
    └── scripts/               # 数据库初始化脚本
```

## 数据映射说明

### 开发环境 (docker-compose.yml)

- **附件存储**: `./data/uploads` → `/app/uploads`
- **应用日志**: `./data/logs` → `/app/logs`
- **数据库数据**: Docker 卷 `mysql_data`

### 生产环境 (docker-compose.prod.yml)

- **附件存储**: `./data/uploads` → `/app/uploads`
- **应用日志**: `./data/logs` → `/app/logs`
- **数据库数据**: Docker 卷 `mysql_data`
- **Redis 数据**: Docker 卷 `redis_data`

## 部署步骤

### 开发环境

```bash
# 进入 Docker 目录
cd tools/docker

# 创建数据目录（如果不存在）
mkdir -p data/uploads data/logs

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f app
```

### 生产环境

```bash
# 进入 Docker 目录
cd tools/docker

# 创建数据目录（如果不存在）
mkdir -p data/uploads data/logs

# 设置环境变量（可选）
export GITHUB_REPOSITORY=your-username/your-repo
export IMAGE_TAG=latest
export DB_PASSWORD=your-secure-password
export JWT_SECRET=your-jwt-secret

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f app
```

## 数据备份

### 附件备份

```bash
# 备份附件目录
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz data/uploads/

# 恢复附件
tar -xzf uploads-backup-YYYYMMDD.tar.gz
```

### 日志备份

```bash
# 备份日志目录
tar -czf logs-backup-$(date +%Y%m%d).tar.gz data/logs/

# 清理旧日志（保留最近30天）
find data/logs/ -name "*.log" -mtime +30 -delete
```

### 数据库备份

```bash
# 备份数据库
docker-compose exec mysql mysqldump -u root -p contract_ledger > backup-$(date +%Y%m%d).sql

# 恢复数据库
docker-compose exec -i mysql mysql -u root -p contract_ledger < backup-YYYYMMDD.sql
```

## 监控和维护

### 查看容器状态

```bash
# 查看所有容器状态
docker-compose ps

# 查看资源使用情况
docker stats
```

### 查看日志

```bash
# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs -f mysql

# 查看系统日志（映射到宿主机）
tail -f data/logs/app.log
```

### 重启服务

```bash
# 重启应用服务
docker-compose restart app

# 重启所有服务
docker-compose restart
```

## 故障排除

### 权限问题

如果遇到文件权限问题，可以调整目录权限：

```bash
# 设置数据目录权限
sudo chown -R 1000:1000 data/
sudo chmod -R 755 data/
```

### 磁盘空间

定期清理不需要的文件：

```bash
# 清理 Docker 系统
docker system prune -f

# 清理旧的镜像
docker image prune -f
```

### 网络问题

检查端口占用：

```bash
# 检查端口占用
netstat -tulpn | grep :80
netstat -tulpn | grep :8080
netstat -tulpn | grep :3306
```

## 安全建议

1. **定期更新**: 定期更新 Docker 镜像和依赖
2. **备份策略**: 建立定期备份机制
3. **监控告警**: 设置磁盘空间和服务状态监控
4. **访问控制**: 限制数据目录的访问权限
5. **日志轮转**: 配置日志轮转避免磁盘空间耗尽
