# Docker镜像构建说明文档

## 概述

本文档详细说明了客户合同管理系统的Docker镜像构建过程，包括多阶段构建、配置要求、构建命令和故障排除。

## 镜像架构

### 基础信息
- **基础镜像**: nginx:alpine (生产阶段)
- **Node.js版本**: 18-alpine (构建阶段)
- **架构**: 多阶段构建 (Multi-stage build)
- **最终镜像大小**: 约 200-300MB

### 构建阶段

#### 1. 后端构建阶段 (backend-build)
- **基础镜像**: `node:18-alpine`
- **工作目录**: `/app/backend`
- **构建工具**: yarn
- **输出**: 编译后的JavaScript文件

#### 2. 前端构建阶段 (frontend-build)
- **基础镜像**: `node:18-alpine`
- **工作目录**: `/app/frontend`
- **构建工具**: npm + vite (直接调用)
- **输出**: 静态HTML/CSS/JS文件

#### 3. 生产阶段 (production)
- **基础镜像**: `nginx:alpine`
- **Web服务器**: Nginx (前端)
- **应用服务器**: Node.js (后端)
- **进程管理**: 自定义启动脚本

## 构建要求

### 系统要求
- Docker Engine 20.10+
- Docker Buildx (多平台构建)
- 可用内存: 至少 4GB
- 可用磁盘空间: 至少 10GB

### 必需文件
```
项目根目录/
├── apps/
│   ├── backend/
│   │   ├── package.json
│   │   ├── yarn.lock
│   │   └── src/
│   └── frontend/
│       ├── package.json
│       └── src/
├── tools/
│   ├── docker/
│   │   └── Dockerfile
│   └── nginx/
│       └── nginx.conf
├── scripts/
│   └── dev/
│       └── start.sh
└── .dockerignore
```

## 构建命令

### 基本构建
```bash
# 在项目根目录执行
docker build -f tools/docker/Dockerfile -t contract-ledger:latest .
```

### 多平台构建
```bash
# 构建支持 AMD64 和 ARM64 的镜像
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f tools/docker/Dockerfile \
  -t contract-ledger:latest \
  --push .
```

### GitHub Container Registry构建
```bash
# 构建并推送到GitHub Container Registry
docker build -f tools/docker/Dockerfile \
  -t ghcr.milu.moe/bluewatercg/projectcontractledger:latest .

docker push ghcr.milu.moe/bluewatercg/projectcontractledger:latest
```

### 带构建参数的构建
```bash
# 指定Node.js版本
docker build \
  --build-arg NODE_VERSION=18 \
  -f tools/docker/Dockerfile \
  -t contract-ledger:latest .
```

## 环境变量

### 构建时环境变量
| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| NODE_VERSION | 18 | Node.js版本 |

### 运行时环境变量
| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| NODE_ENV | production | 运行环境 |
| BACKEND_PORT | 8080 | 后端服务端口 |
| FRONTEND_HTTP_PORT | 80 | 前端HTTP端口 |
| LOG_LEVEL | info | 日志级别 |
| CORS_ORIGINS | * | 跨域配置 |
| JWT_EXPIRES_IN | 7d | JWT过期时间 |
| DB_HOST | - | 数据库主机 |
| DB_PORT | 3306 | 数据库端口 |
| DB_USERNAME | - | 数据库用户名 |
| DB_PASSWORD | - | 数据库密码 |
| DB_DATABASE | - | 数据库名称 |
| REDIS_HOST | - | Redis主机 |
| REDIS_PORT | 6379 | Redis端口 |
| REDIS_PASSWORD | - | Redis密码 |
| REDIS_DB | 0 | Redis数据库编号 |

## 构建过程详解

### 阶段1: 后端构建
1. **安装构建工具**: python3, make, g++
2. **复制依赖文件**: package.json, yarn.lock
3. **安装依赖**: `yarn install --production=false`
4. **复制源代码**: 整个backend目录
5. **执行构建**: `yarn build`
6. **验证构建**: 检查dist目录

### 阶段2: 前端构建
1. **安装构建工具**: python3, make, g++
2. **复制依赖文件**: package.json
3. **安装依赖**: `npm install` (避免yarn权限问题)
4. **复制源代码**: 整个frontend目录
5. **执行构建**: `node node_modules/vite/bin/vite.js build`
6. **验证构建**: 检查dist/index.html
7. **失败处理**: 创建fallback页面

### 阶段3: 生产镜像
1. **安装运行时**: Node.js, npm
2. **创建用户**: appuser (非root)
3. **复制后端**: 构建产物 + 依赖
4. **复制前端**: 静态文件到nginx目录
5. **配置nginx**: 复制nginx.conf
6. **设置权限**: 文件所有权和执行权限
7. **创建目录**: 日志和上传目录
8. **健康检查**: HTTP健康检查端点

## 镜像特性

### 安全特性
- **非root用户**: 使用appuser运行应用
- **最小权限**: 只授予必要的文件权限
- **安全头**: nginx配置包含安全HTTP头
- **健康检查**: 内置应用健康监控

### 性能优化
- **多阶段构建**: 减少最终镜像大小
- **Alpine Linux**: 轻量级基础镜像
- **静态资源缓存**: nginx配置优化
- **Gzip压缩**: 减少传输大小

### 运维特性
- **日志持久化**: 支持外部日志卷挂载
- **配置外部化**: 支持环境变量配置
- **健康检查**: 自动故障检测
- **优雅关闭**: 支持SIGTERM信号处理

## 端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| 80 | Nginx | 前端HTTP服务 |
| 8080 | Node.js | 后端API服务 |

## 数据卷

### 推荐挂载点
```bash
# 日志持久化
-v app_logs:/app/logs

# 上传文件持久化
-v app_uploads:/app/uploads

# 自定义nginx配置 (可选)
-v ./custom-nginx.conf:/etc/nginx/nginx.conf:ro
```

## 网络配置

### Nginx代理规则
- `/api/` → `http://127.0.0.1:8080/api/v1/`
- `/health` → `http://127.0.0.1:8080/health`
- `/api-docs` → `http://127.0.0.1:8080/api-docs`
- `/` → 静态文件 (Vue.js SPA)

## 故障排除

### 常见构建错误

#### 1. 前端构建失败
**错误**: `vite: Permission denied`
**解决**: 已使用node直接调用vite，绕过权限问题

#### 2. 文件找不到
**错误**: `COPY failed: file not found`
**解决**: 检查.dockerignore配置，确保必要文件未被排除

#### 3. 内存不足
**错误**: `JavaScript heap out of memory`
**解决**: 增加Docker内存限制或使用`--max-old-space-size`

### 构建优化建议

#### 1. 使用构建缓存
```bash
# 启用BuildKit缓存
export DOCKER_BUILDKIT=1
docker build --cache-from contract-ledger:latest .
```

#### 2. 并行构建
```bash
# 使用buildx并行构建
docker buildx build --parallel .
```

#### 3. 减少构建上下文
确保.dockerignore正确配置，排除不必要的文件。

## 维护建议

### 定期更新
- **基础镜像**: 定期更新node:18-alpine和nginx:alpine
- **依赖包**: 定期更新package.json中的依赖
- **安全补丁**: 关注CVE安全公告

### 监控指标
- **构建时间**: 正常情况下5-10分钟
- **镜像大小**: 应保持在300MB以下
- **构建成功率**: 应保持在95%以上

### 版本管理
```bash
# 使用语义化版本标签
docker build -t contract-ledger:v1.2.3 .
docker build -t contract-ledger:latest .
```

## 快速参考

### 一键构建脚本
```bash
#!/bin/bash
# build-image.sh

set -e

echo "=== Docker镜像构建 ==="
echo "时间: $(date)"

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装"
    exit 1
fi

# 构建镜像
echo "开始构建镜像..."
docker build -f tools/docker/Dockerfile -t contract-ledger:latest .

# 验证构建
echo "验证镜像..."
docker images contract-ledger:latest

echo "✅ 构建完成"
```

### 构建状态检查
```bash
# 检查构建历史
docker history contract-ledger:latest

# 检查镜像详情
docker inspect contract-ledger:latest

# 检查镜像大小
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" contract-ledger
```

### 测试运行
```bash
# 快速测试
docker run --rm -p 8000:80 -p 8080:8080 contract-ledger:latest

# 带环境变量测试
docker run --rm \
  -p 8000:80 -p 8080:8080 \
  -e DB_HOST=192.168.1.254 \
  -e REDIS_HOST=192.168.1.160 \
  contract-ledger:latest
```

## 相关文档

- [部署指南](./deployment-guide.md)
- [环境配置](./environment-config.md)
- [故障排除](./troubleshooting.md)
- [API文档](../api/README.md)
