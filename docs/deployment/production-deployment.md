# 生产环境部署指南

## 🚀 快速部署

### Linux/macOS 用户
```bash
# 给脚本执行权限
chmod +x scripts/deploy-production.sh

# 执行部署
./scripts/deploy-production.sh
```

### Windows 用户
```powershell
# 在 PowerShell 中执行
.\scripts\deploy-production.ps1
```

## 📋 脚本功能

### 自动化流程
1. ✅ **环境检查** - 验证 Docker 和必要文件
2. ✅ **备份当前版本** - 自动备份现有镜像和配置
3. ✅ **清理镜像缓存** - 删除本地缓存，确保拉取最新版本
4. ✅ **拉取最新镜像** - 从 GitHub Container Registry 拉取
5. ✅ **启动服务** - 使用 docker-compose 启动
6. ✅ **健康检查** - 验证服务是否正常运行
7. ✅ **修复验证** - 检查登录API和文件上传修复是否生效

### 安全特性
- 🔒 **自动备份** - 部署前自动备份当前版本
- 🔄 **错误回滚** - 部署失败时提供回滚选项
- 📊 **详细日志** - 完整的部署过程日志
- ✅ **健康检查** - 多层次的服务健康验证

## 🛠️ 高级用法

### 查看服务状态
```bash
# Linux/macOS
./scripts/deploy-production.sh status

# Windows
.\scripts\deploy-production.ps1 -Action status
```

### 查看实时日志
```bash
# Linux/macOS
./scripts/deploy-production.sh logs

# Windows
.\scripts\deploy-production.ps1 -Action logs
```

### 执行健康检查
```bash
# Linux/macOS
./scripts/deploy-production.sh health

# Windows
.\scripts\deploy-production.ps1 -Action health
```

### 仅备份当前版本
```bash
# Linux/macOS
./scripts/deploy-production.sh backup

# Windows
.\scripts\deploy-production.ps1 -Action backup
```

## 🔧 配置说明

### 环境变量文件 (.env)
确保您的 `.env` 文件包含以下关键配置：
```bash
# 数据库配置
DB_HOST=192.168.1.254
DB_USERNAME=procontractledger
DB_PASSWORD=your_password
DB_DATABASE=procontractledger

# Redis配置
REDIS_HOST=192.168.1.160
REDIS_PASSWORD=12345678
REDIS_DB=13

# JWT配置
JWT_SECRET=
# Generate with: openssl rand -base64 48

# 前端API配置（重要：修复登录404问题）
FRONTEND_API_BASE_URL=/api/v1

# 文件上传配置（重要：修复上传问题）
UPLOAD_DIR=/app/uploads
```

### Docker Compose 配置
确保您的 `docker-compose.yml` 正确配置：
```yaml
services:
  app:
    image: ghcr.milu.moe/bluewatercg/projectcontractledger:latest
    ports:
      - "8000:80"
      - "8080:8080"
    environment:
      - FRONTEND_API_BASE_URL=${FRONTEND_API_BASE_URL:-/api/v1}
      - UPLOAD_DIR=${UPLOAD_DIR:-/app/uploads}
    volumes:
      - app_uploads:/app/uploads
      - app_logs:/app/logs
```

## 🧪 验证部署

### 1. 访问测试
- 前端: http://192.168.1.115:8000
- 后端API: http://192.168.1.115:8080
- 健康检查: http://192.168.1.115:8000/api/health

### 2. 功能测试
1. **登录测试** - 验证登录功能是否正常
2. **文件上传测试** - 测试合同和发票附件上传
3. **API路径测试** - 确认不再出现404错误

### 3. 日志检查
```bash
# 查看应用日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f app
```

## 🚨 故障排除

### 常见问题

#### 1. 镜像拉取失败
```bash
# 手动拉取镜像
docker pull ghcr.milu.moe/bluewatercg/projectcontractledger:latest

# 检查网络连接
ping ghcr.io
```

#### 2. 服务启动失败
```bash
# 查看详细错误日志
docker-compose logs --tail 100

# 检查端口占用
netstat -tulpn | grep :8000
netstat -tulpn | grep :8080
```

#### 3. 健康检查失败
```bash
# 手动测试健康检查
curl http://192.168.1.115:8000/api/v1/health

# 检查容器状态
docker-compose ps
```

#### 4. 登录仍然404
```bash
# 检查运行时配置
docker exec <container-name> cat /usr/share/nginx/html/config.js

# 应该显示: API_BASE_URL: "/api/v1"
```

### 回滚操作
如果部署失败，可以使用备份镜像回滚：
```bash
# 查看备份镜像
docker images | grep backup

# 回滚到备份版本
docker tag ghcr.milu.moe/bluewatercg/projectcontractledger:backup-YYYYMMDD-HHMMSS \
  ghcr.milu.moe/bluewatercg/projectcontractledger:latest

# 重新启动
docker-compose down
docker-compose up -d
```

## 📞 技术支持

### 日志收集
如果遇到问题，请收集以下信息：
1. 部署脚本输出日志
2. Docker容器日志: `docker-compose logs`
3. 系统信息: `docker info`
4. 镜像信息: `docker images`

### 联系方式
- 查看项目文档: README.md
- 检查已知问题: GitHub Issues
- 技术支持: 项目维护团队

## 🎯 最佳实践

1. **定期备份** - 重要数据定期备份
2. **监控日志** - 定期检查应用日志
3. **健康检查** - 定期执行健康检查
4. **版本管理** - 使用具体版本标签而非latest
5. **环境隔离** - 生产环境独立配置

## 📈 性能优化

### 资源限制
在 `docker-compose.yml` 中设置合适的资源限制：
```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### 数据卷优化
使用命名卷提高性能：
```yaml
volumes:
  app_uploads:
    driver: local
  app_logs:
    driver: local
```
