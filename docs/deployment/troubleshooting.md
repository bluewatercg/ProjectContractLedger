# 🔧 部署故障排除指南

本文档专门针对部署过程中可能遇到的问题提供解决方案。

## 🐳 Docker 部署问题

### 1. 容器启动失败

#### 症状
```bash
docker-compose up -d
# 容器无法启动或立即退出
```

#### 诊断步骤
```bash
# 查看容器状态
docker-compose ps

# 查看容器日志
docker-compose logs app

# 查看详细错误信息
docker logs <container-id> --details
```

#### 常见原因和解决方案

**原因1：端口占用**
```bash
# 检查端口占用
netstat -tulpn | grep :8000
netstat -tulpn | grep :8080

# 解决方案：修改docker-compose.yml中的端口映射
ports:
  - "8001:80"    # 改为其他端口
  - "8081:8080"  # 改为其他端口
```

**原因2：环境变量配置错误**
```bash
# 检查.env文件格式
cat .env | grep -v '^#' | grep -v '^$'

# 确保没有空格和特殊字符
DB_HOST=192.168.1.254
DB_USERNAME=procontractledger
DB_PASSWORD=your_password
```

**原因3：数据库连接失败**
```bash
# 测试数据库连接
mysql -h 192.168.1.254 -u procontractledger -p

# 检查防火墙设置
sudo ufw status
telnet 192.168.1.254 3306
```

### 2. 镜像拉取失败

#### 症状
```bash
Error response from daemon: pull access denied for ghcr.io/bluewatercg/projectcontractledger
```

#### 解决方案
```bash
# 检查网络连接
ping ghcr.io

# 手动拉取镜像
docker pull ghcr.io/bluewatercg/projectcontractledger:latest

# 如果仍然失败，使用代理或镜像加速器
# 配置Docker镜像加速器
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://mirror.ccs.tencentyun.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 3. 数据卷权限问题

#### 症状
```bash
# 容器日志显示权限错误
Permission denied: '/app/uploads'
```

#### 解决方案
```bash
# 创建数据目录并设置权限
sudo mkdir -p /opt/projectcontractledger/backend_uploads
sudo mkdir -p /opt/projectcontractledger/logs
sudo chown -R 1000:1000 /opt/projectcontractledger/
sudo chmod -R 755 /opt/projectcontractledger/

# 或使用维护工具
cd tools/maintenance
./fix-contract-upload-issue.sh
```

## 🌐 网络连接问题

### 1. API请求404错误

#### 症状
```bash
# 前端无法访问后端API
GET http://localhost:8000/api/v1/customers 404 (Not Found)
```

#### 诊断步骤
```bash
# 检查容器内部网络
docker exec -it <container-name> curl http://localhost:8080/api/v1/health

# 检查Nginx配置
docker exec -it <container-name> cat /etc/nginx/nginx.conf
```

#### 解决方案
```bash
# 确保API代理配置正确
location /api/ {
    proxy_pass http://localhost:8080/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# 重启容器
docker-compose restart
```

### 2. 跨域问题

#### 症状
```bash
Access to XMLHttpRequest at 'http://localhost:8080/api/v1/login' 
from origin 'http://localhost:8000' has been blocked by CORS policy
```

#### 解决方案
```bash
# 检查后端CORS配置
# 在apps/backend/src/config/config.default.ts中确保：
export default {
  cors: {
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
    credentials: true,
  },
};
```

## 🗄️ 数据库问题

### 1. 数据库连接超时

#### 症状
```bash
Error: connect ETIMEDOUT 192.168.1.254:3306
```

#### 诊断步骤
```bash
# 使用诊断工具
cd tools/maintenance
./debug-database-connection.sh

# 手动测试连接
mysql -h 192.168.1.254 -u procontractledger -p --connect-timeout=10
```

#### 解决方案
```bash
# 1. 检查数据库服务状态
sudo systemctl status mysql

# 2. 检查防火墙设置
sudo ufw allow 3306

# 3. 检查MySQL配置
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# 确保bind-address = 0.0.0.0

# 4. 重启MySQL服务
sudo systemctl restart mysql
```

### 2. 数据库权限问题

#### 症状
```bash
Access denied for user 'procontractledger'@'%' to database 'procontractledger'
```

#### 解决方案
```bash
# 登录MySQL管理员账户
mysql -u root -p

# 重新授权
GRANT ALL PRIVILEGES ON procontractledger.* TO 'procontractledger'@'%';
FLUSH PRIVILEGES;

# 检查用户权限
SHOW GRANTS FOR 'procontractledger'@'%';
```

## 📁 文件系统问题

### 1. 磁盘空间不足

#### 症状
```bash
No space left on device
```

#### 诊断和解决
```bash
# 检查磁盘使用情况
df -h

# 清理Docker资源
docker system prune -a -f

# 清理日志文件
sudo find /var/log -name "*.log" -type f -mtime +30 -delete

# 清理应用日志
find apps/backend/logs -name "*.log" -mtime +7 -delete
```

### 2. 文件上传失败

#### 症状
```bash
# 前端上传文件时报错
Upload failed: Request failed with status code 500
```

#### 解决方案
```bash
# 检查上传目录权限
ls -la /opt/projectcontractledger/backend_uploads/

# 修复权限
sudo chown -R 1000:1000 /opt/projectcontractledger/backend_uploads/
sudo chmod -R 755 /opt/projectcontractledger/backend_uploads/

# 检查磁盘空间
df -h /opt/projectcontractledger/

# 使用修复工具
cd tools/maintenance
./fix-contract-upload-issue.sh
```

## 🔐 SSL/HTTPS 问题

### 1. SSL证书配置

#### 症状
```bash
# HTTPS访问时显示证书错误
NET::ERR_CERT_AUTHORITY_INVALID
```

#### 解决方案
```bash
# 使用Let's Encrypt免费证书
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. 反向代理配置

#### Nginx配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🚀 GitHub Actions 部署问题

### 1. 构建失败

#### 症状
```bash
# GitHub Actions workflow失败
Error: Process completed with exit code 1
```

#### 诊断步骤
```bash
# 查看Actions日志
# 在GitHub仓库的Actions标签页查看详细日志

# 本地测试构建
docker build -t test-image .
```

#### 常见解决方案
```bash
# 1. 检查Dockerfile语法
docker build --no-cache -t test .

# 2. 检查环境变量配置
# 在GitHub仓库Settings > Secrets中配置必要的环境变量

# 3. 检查权限设置
# 确保GitHub Token有足够的权限
```

### 2. 镜像推送失败

#### 症状
```bash
Error: failed to push to registry
```

#### 解决方案
```bash
# 检查GitHub Container Registry权限
# 在GitHub Settings > Developer settings > Personal access tokens
# 确保token有write:packages权限

# 手动推送测试
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
docker push ghcr.io/username/projectcontractledger:latest
```

## 🛠️ 维护工具使用

### 自动诊断脚本

```bash
# 数据库连接诊断
cd tools/maintenance
./debug-database-connection.sh

# Docker环境检查
./check-docker-env.sh

# 上传问题修复
./fix-contract-upload-issue.sh

# 环境变量检查
./check-env-path.sh
```

### 备份和恢复

```bash
# 系统备份
cd tools/backup
./backup-system.sh

# 检查备份状态
./check-backup-status.sh

# 系统恢复
./restore-system.sh
```

## 📊 监控和日志

### 日志查看

```bash
# Docker容器日志
docker-compose logs -f app

# 应用日志
tail -f apps/backend/logs/midway-core.log
tail -f apps/backend/logs/common-error.log

# 系统日志
sudo journalctl -u docker -f
```

### 性能监控

```bash
# 容器资源使用
docker stats

# 系统资源监控
htop
iostat -x 1

# 数据库性能
mysql -u root -p -e "SHOW PROCESSLIST;"
mysql -u root -p -e "SHOW STATUS LIKE 'Slow_queries';"
```

## 📞 获取帮助

### 收集诊断信息

当需要技术支持时，请收集以下信息：

```bash
# 系统信息
uname -a
docker --version
docker-compose --version

# 容器状态
docker-compose ps
docker-compose logs --tail=100

# 环境配置
cat .env | grep -v PASSWORD

# 网络连接
netstat -tulpn | grep -E ':(8000|8080|3306|6379)'
```

### 联系方式

1. **GitHub Issues**: 提交详细的错误报告
2. **社区讨论**: 参与GitHub Discussions
3. **文档查阅**: 查看相关技术文档

---

遇到问题时，请按照本指南逐步排查，大多数问题都能得到解决！🎯