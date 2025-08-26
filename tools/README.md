# 🔧 Tools 开发工具目录

> **最新更新**: 2025-08-26  
> **维护状态**: ✅ 活跃维护  
> **兼容版本**: v2.2.0+

本目录包含项目开发和部署过程中使用的各种工具、配置文件和辅助脚本，为开发和运维提供完整的工具链支持。

## 📁 目录结构

```
tools/
├── README.md                    # 本说明文件
├── configs/                    # 配置文件模板（预留）
├── docker/                     # Docker相关工具和配置
│   ├── README.md               # Docker工具说明
│   ├── DEPLOYMENT_CHECKLIST.md # 部署检查清单
│   ├── docker-compose.yml      # 开发环境Docker编排
│   ├── docker-compose.prod.yml # 生产环境Docker编排
│   ├── start-dev.sh           # 开发环境启动脚本
│   ├── start-prod.sh          # 生产环境启动脚本
│   ├── backup.sh              # 数据备份脚本
│   ├── monitor.sh             # 容器监控脚本
│   └── data/                  # 数据目录
│       ├── logs/              # 日志存储
│       └── uploads/           # 文件上传存储
└── nginx/                     # Nginx配置文件
    └── nginx.conf             # Nginx主配置文件
```

## ⚙️ 配置模板 (`configs/`)

### 预留配置目录
**计划内容：**
- 🌍 多环境配置模板
- 🗄️ 数据库配置模板
- 📊 监控配置模板
- 🔐 安全配置模板
- 📝 日志配置模板

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

### 🚀 部署文档
- [🐳 **Docker构建指南**](../docs/deployment/docker-build-guide.md) - Docker镜像构建详细指南
- [📄 **Dockerfile配置说明**](../docs/deployment/dockerfile-configuration.md) - Dockerfile配置参数说明
- [📋 **部署检查清单**](../docs/deployment/build-checklist.md) - 部署前检查清单
- [📚 **Docker部署文档**](../docs/development/Docker_Deployment.md) - 完整的Docker部署文档

### 📚 项目文档
- [📚 **项目文档中心**](../docs/README.md) - 完整的文档导航
- [🛠️ **开发指南**](../docs/development/) - 开发环境和技术文档
- [🚀 **部署指南**](../docs/DEPLOYMENT_GUIDE.md) - 生产环境部署配置
- [🔧 **故障排除**](../docs/TROUBLESHOOTING.md) - 常见问题解决方案

### 🔧 相关工具
- [📜 **脚本工具**](../scripts/) - 自动化脚本和部署工具
- [🧪 **测试工具**](../testing/) - 自动化测试和质量保障
- [📁 **配置模板**](../config/templates/) - 环境配置模板

### 🔄 最新更新 (v2.2.0 - 2025-08-26)
- ✅ **多架构支持**: 完善ARM64和AMD64双平台Docker构建
- ✅ **网络优化**: 解决yarn网络超时问题，提供多重安装策略
- ✅ **构建缓存**: 改进GitHub Actions缓存机制，提升构建效率
- ✅ **安全增强**: 优化容器安全配置，加强网络防护
- ✅ **Docker Compose**: 更新各种部署模式的配置文件

### 📊 工具特性
- **多环境支持**: 开发、测试、生产环境配置
- **高效构建**: 多阶段构建优化，缩短构建时间
- **安全保障**: 容器安全扫描和最优安全配置
- **箱包化部署**: 一键部署，环境一致性保障

---

**ProjectContractLedger Tools** - 为开发和部署提供完整工具链支持！

> 📝 如需添加新工具或修改配置，请参考[开发文档](../docs/development/)并遵循项目规范。  
> 🐳 推荐使用Docker Compose进行开发和部署，获得最佳体验。

**文档版本**: v2.2.0  
**最后更新**: 2025-08-26  
**维护状态**: ✅ 活跃维护
