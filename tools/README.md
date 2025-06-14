# Tools 文件夹说明

本文件夹包含项目的工具配置文件，包括Docker配置、Nginx配置和其他构建工具。

## 📁 文件夹结构

```
tools/
├── configs/          # 配置文件目录
├── docker/           # Docker相关配置
└── nginx/            # Nginx配置文件
```

## 🔧 Configs 配置 (`tools/configs/`)

### 配置文件
| 目录状态 | 作用 | 维护状态 |
|---------|------|----------|
| `空目录` | 工具配置文件预留 | 🔄 待扩展 |

**计划配置内容**：
- ESLint配置文件
- Prettier配置文件
- TypeScript配置模板
- 构建工具配置
- 代码质量检查配置

## 🐳 Docker 配置 (`tools/docker/`)

### 主要Dockerfile
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `Dockerfile` | 主要的Docker镜像构建文件 | ✅ 生产就绪 |

**构建特性**：
- 多阶段构建优化
- 前后端分离构建
- Alpine Linux基础镜像
- 安全性配置
- 体积优化

### Docker Compose配置
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `docker-compose.yml` | 开发环境容器编排 | ✅ 开发工具 |
| `docker-compose.prod.yml` | 生产环境容器编排 | ✅ 生产就绪 |
| `docker-compose.external-simple.yml` | 外部服务简化配置 | ✅ 生产就绪 |

**配置特点**：
- **开发环境**: 支持热重载，便于开发调试
- **生产环境**: 优化性能，包含完整服务栈
- **外部服务**: 适配外部MySQL和Redis服务器

### 构建配置对比

#### 开发环境 (docker-compose.yml)
```yaml
特点:
- 源码挂载，支持热重载
- 开发端口映射
- 调试模式启用
- 详细日志输出
```

#### 生产环境 (docker-compose.prod.yml)
```yaml
特点:
- 构建优化镜像
- 生产端口配置
- 健康检查
- 资源限制
- 重启策略
```

#### 外部服务 (docker-compose.external-simple.yml)
```yaml
特点:
- 仅应用容器
- 外部数据库连接
- 简化网络配置
- 适合现有基础设施
```

## 🌐 Nginx 配置 (`tools/nginx/`)

### Web服务器配置
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `nginx.conf` | Nginx主配置文件 | ✅ 生产就绪 |

**配置特性**：
- 静态文件服务
- API反向代理
- Gzip压缩
- 安全头设置
- 缓存策略
- Vue Router支持

### 配置详解

#### 静态文件服务
```nginx
# 前端静态文件
location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
}

# 静态资源缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### API反向代理
```nginx
# 后端API代理
location /api/ {
    proxy_pass http://backend:8080/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### 安全配置
```nginx
# 安全头
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

#### 性能优化
```nginx
# Gzip压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;

# 连接优化
keepalive_timeout 65;
sendfile on;
tcp_nopush on;
tcp_nodelay on;
```

## 🚀 使用指南

### 1. Docker镜像构建

#### 开发环境构建
```bash
# 使用开发配置构建
docker-compose -f tools/docker/docker-compose.yml build

# 启动开发环境
docker-compose -f tools/docker/docker-compose.yml up -d
```

#### 生产环境构建
```bash
# 使用生产配置构建
docker build -f tools/docker/Dockerfile -t contract-ledger:latest .

# 或使用生产compose
docker-compose -f tools/docker/docker-compose.prod.yml up -d
```

#### 外部服务部署
```bash
# 使用外部服务配置
docker-compose -f tools/docker/docker-compose.external-simple.yml up -d
```

### 2. Nginx配置测试

#### 配置语法检查
```bash
# 在容器中测试配置
docker run --rm -v $(pwd)/tools/nginx/nginx.conf:/etc/nginx/nginx.conf nginx nginx -t

# 重载配置
docker exec container_name nginx -s reload
```

#### 本地测试
```bash
# 使用本地nginx测试
nginx -t -c tools/nginx/nginx.conf
```

## 🔧 配置管理

### 环境变量配置
```bash
# 数据库配置
DB_HOST=192.168.1.254
DB_PORT=3306
DB_NAME=procontractledger

# Redis配置
REDIS_HOST=192.168.1.160
REDIS_PORT=6379

# 应用配置
NODE_ENV=production
BACKEND_PORT=8080
FRONTEND_API_BASE_URL=/api
```

### 端口映射
```yaml
# 标准端口配置
ports:
  - "8000:80"    # 前端服务
  - "8080:8080"  # 后端API
```

### 数据卷挂载
```yaml
# 数据持久化
volumes:
  - app_logs:/app/logs
  - app_uploads:/app/uploads
```

## 📊 监控和日志

### 健康检查
```yaml
# Docker健康检查
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
  interval: 30s
  timeout: 10s
  start_period: 30s
  retries: 3
```

### 日志配置
```yaml
# 日志驱动配置
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🔒 安全配置

### 容器安全
- 使用非root用户运行
- 最小权限原则
- 安全基础镜像
- 定期更新依赖

### 网络安全
- 内部网络隔离
- 端口最小化暴露
- 反向代理保护
- HTTPS配置支持

## 📋 维护清单

### 定期维护任务
1. **镜像更新**: 定期更新基础镜像
2. **配置检查**: 验证配置文件有效性
3. **性能监控**: 监控容器资源使用
4. **安全扫描**: 扫描镜像安全漏洞
5. **日志清理**: 清理过期日志文件

### 故障排除
1. **构建失败**: 检查Dockerfile语法和依赖
2. **启动失败**: 检查环境变量和端口冲突
3. **代理失败**: 检查nginx配置和后端连接
4. **性能问题**: 检查资源限制和网络配置

## 🔗 相关文档

- [Docker构建指南](../docs/deployment/docker-build-guide.md)
- [Dockerfile配置说明](../docs/deployment/dockerfile-configuration.md)
- [部署检查清单](../docs/deployment/build-checklist.md)
- [Docker部署文档](../docs/development/Docker_Deployment.md)
