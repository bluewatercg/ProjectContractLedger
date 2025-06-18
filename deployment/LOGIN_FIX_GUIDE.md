# 登录404错误修复指南

## 🚨 问题描述

用户在访问 `http://192.168.1.115:8000` 进行登录时，遇到以下错误：

```
请求 URL: http://192.168.1.115:8000/api/auth/login
请求方法: POST
状态代码: 404 Not Found
```

## 🔍 问题分析

### 错误的API请求路径
- **前端请求**: `http://192.168.1.115:8000/api/auth/login` ❌
- **正确路径**: `http://192.168.1.115:8080/api/v1/auth/login` ✅

### 根本原因
1. **前端配置缺失**: 前端容器中的 `window.__APP_CONFIG__` 配置没有正确注入
2. **环境变量不完整**: 前端容器缺少必要的环境变量
3. **启动脚本问题**: 前端启动脚本没有生成运行时配置文件

## 🛠️ 解决方案

### 1. 修复前端启动脚本 ✅

已修复 `apps/frontend/start.sh`，现在会：
- 生成 `window.__APP_CONFIG__` 配置
- 注入正确的API配置
- 自动配置前后端通信

### 2. 更新Docker Compose配置 ✅

已更新 `deployment/docker-compose.yml`，添加了：
```yaml
environment:
  - BACKEND_HOST_PORT=${BACKEND_HOST_PORT:-8080}
  - FRONTEND_API_BASE_URL=${FRONTEND_API_BASE_URL:-/api/v1}
  - API_VERSION=${API_VERSION:-v1}
```

### 3. 完善环境变量配置 ✅

已创建 `deployment/.env` 文件，包含：
```bash
FRONTEND_API_BASE_URL=/api/v1
BACKEND_HOST_PORT=8080
API_VERSION=v1
```

## 🚀 部署步骤

### 方案A：重新构建前端镜像（推荐）

```bash
# 1. 构建新的前端镜像
cd apps/frontend
docker build -t ghcr.io/bluewatercg/projectcontractledger-frontend:latest .

# 2. 推送到镜像仓库（如果需要）
docker push ghcr.io/bluewatercg/projectcontractledger-frontend:latest

# 3. 重新部署
cd ../../deployment
./deploy-separated.sh --update
```

### 方案B：临时修复（快速解决）

如果无法重新构建镜像，可以通过以下方式临时修复：

```bash
# 1. 停止当前服务
./deploy-separated.sh --stop

# 2. 手动创建配置文件
docker run --rm -v frontend_data:/data \
  -e FRONTEND_API_BASE_URL=/api/v1 \
  -e BACKEND_HOST_PORT=8080 \
  -e API_VERSION=v1 \
  alpine sh -c '
    mkdir -p /data
    cat > /data/config.js << EOF
window.__APP_CONFIG__ = {
  API_BASE_URL: "/api/v1",
  API_VERSION: "v1",
  BACKEND_HOST_PORT: "8080",
  APP_TITLE: "客户合同管理系统"
};
EOF'

# 3. 重新启动服务
./deploy-separated.sh
```

## 🔧 验证修复

### 1. 检查前端配置

访问 `http://192.168.1.115:8000/config.js`，应该看到：

```javascript
window.__APP_CONFIG__ = {
  API_BASE_URL: '/api/v1',
  API_VERSION: 'v1',
  BACKEND_HOST_PORT: '8080',
  // ...其他配置
};
```

### 2. 检查浏览器控制台

打开浏览器开发者工具，应该看到：
```
App Config Loaded: {API_BASE_URL: "/api/v1", ...}
```

### 3. 测试API请求

登录时，网络请求应该是：
```
POST http://192.168.1.115:8080/api/v1/auth/login
```

## 📋 预期效果

修复后的API调用流程：

```
1. 前端加载: http://192.168.1.115:8000
2. 配置注入: window.__APP_CONFIG__.API_BASE_URL = "/api/v1"
3. 检测环境: 生产环境 + 不同端口 (8000 ≠ 8080)
4. 构建URL: http://192.168.1.115:8080/api/v1
5. API调用: POST http://192.168.1.115:8080/api/v1/auth/login ✅
```

## 🚨 注意事项

1. **镜像版本**: 确保使用修复后的前端镜像
2. **环境变量**: 确保所有必要的环境变量都已设置
3. **网络连通性**: 确保前端容器能访问后端容器
4. **端口配置**: 确保端口映射正确

## 🔄 回滚方案

如果修复后出现问题，可以：

```bash
# 1. 停止服务
./deploy-separated.sh --stop

# 2. 使用旧版本镜像
# 编辑 docker-compose.yml，使用之前的镜像版本

# 3. 重新启动
./deploy-separated.sh
```
