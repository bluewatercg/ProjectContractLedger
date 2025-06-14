# 生产环境配置调整总结

## 配置文件分析

根据您提供的生产环境配置文件，我发现了以下需要调整的地方：

### 1. 镜像地址差异
- **配置中**: `ghcr.milu.moe/bluewatercg/projectcontractledger:latest`
- **代码中**: `ghcr.io/bluewatercg/projectcontractledger:latest`

### 2. 端口配置
- **配置中**: 使用 `APP_HTTP_PORT` 和 `APP_API_PORT` 变量
- **默认值**: 8000 和 8080（而不是 80 和 8080）

### 3. 日志目录
- **配置中**: `/app/logs`
- **代码中**: `/var/log/app`

### 4. 缺少环境变量
- `JWT_SECRET`
- `REDIS_DB`
- `DB_POOL_SIZE`

## 已完成的调整

### 1. Dockerfile优化
```dockerfile
# 创建日志目录和上传目录（匹配生产环境配置）
RUN mkdir -p /app/logs /var/log/app /app/uploads && \
    chown -R appuser:nodejs /app/logs /var/log/app /app/uploads && \
    ln -sf /app/logs /var/log/app/app
```

### 2. 启动脚本增强
```bash
# 创建日志目录（支持多个日志路径）
mkdir -p /var/log/app /app/logs
# 确保日志目录链接正确
if [ ! -L /var/log/app/app ] && [ -d /app/logs ]; then
    ln -sf /app/logs /var/log/app/app
fi
```

### 3. 更新生产环境Docker Compose配置
- 镜像地址更新为 `ghcr.milu.moe/bluewatercg/projectcontractledger:latest`
- 端口配置支持环境变量 `${APP_HTTP_PORT:-8000}` 和 `${APP_API_PORT:-8080}`
- 移除内置数据库和Redis服务
- 添加完整的环境变量支持
- 添加资源限制和网络模式配置

### 4. 创建配置文件
- ✅ `deployment/docker-compose.production.yml` - 匹配您的生产环境配置
- ✅ `.env.production.template` - 环境变量模板
- ✅ `deployment/deploy-production.sh` - 生产环境部署脚本

## 部署方式

### 方法一：使用您的原始配置（推荐）
```bash
# 1. 使用您提供的docker-compose配置
# 2. 确保环境变量文件包含所有必要配置
docker-compose -f your-production-config.yml up -d
```

### 方法二：使用更新后的配置
```bash
# 1. 复制环境变量模板
cp .env.production.template .env

# 2. 编辑 .env 文件，填写实际配置

# 3. 运行部署脚本
chmod +x deployment/deploy-production.sh
bash deployment/deploy-production.sh
```

## 关键配置项

### 环境变量配置
```env
# 应用端口
APP_HTTP_PORT=8000
APP_API_PORT=8080

# 数据库配置
DB_HOST=192.168.1.254
DB_USERNAME=procontractledger
DB_PASSWORD=your_password
DB_DATABASE=procontractledger

# Redis配置
REDIS_HOST=192.168.1.160
REDIS_PASSWORD=your_redis_password
REDIS_DB=13

# JWT配置
JWT_SECRET=your_jwt_secret

# 网络模式
NETWORK_MODE=bridge
```

### 数据持久化
```yaml
volumes:
  - app_logs:/app/logs      # 应用日志
  - app_uploads:/app/uploads # 上传文件
```

## 验证部署

### 1. 检查容器状态
```bash
docker ps | grep contract-ledger
```

### 2. 检查应用健康
```bash
curl http://localhost:8000/health
```

### 3. 检查日志
```bash
docker logs contract-ledger-app --tail 50
```

## 访问地址

- **前端**: http://您的服务器IP:8000
- **后端API**: http://您的服务器IP:8080
- **健康检查**: http://您的服务器IP:8000/health
- **API文档**: http://您的服务器IP:8080/api-docs

## 总结

代码已经完全调整以匹配您的生产环境配置：

- ✅ 支持自定义镜像地址
- ✅ 支持自定义端口配置
- ✅ 支持正确的日志目录映射
- ✅ 支持所有必要的环境变量
- ✅ 支持外部MySQL和Redis服务器
- ✅ 支持资源限制和网络模式配置

您可以直接使用现有的生产环境配置文件，代码已经完全兼容。
