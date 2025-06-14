# API配置修复总结

## 问题描述

前端代码中硬编码了 `https://api.yourdomain.com/api/v1` 的API地址，导致在您的服务器环境中无法正常访问后端API。

## 问题位置

- **文件**: `apps/frontend/.env.production`
- **问题**: `VITE_API_BASE_URL=https://api.yourdomain.com/api/v1`

## 解决方案

### 1. 修复生产环境配置

**修改前**:
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

**修改后**:
```env
# 在容器化部署中，前后端在同一个镜像中，通过nginx代理到后端
VITE_API_BASE_URL=/api
```

### 2. 增强API配置逻辑

创建了多层次的API配置策略：

```typescript
const getApiBaseUrl = () => {
  const runtimeConfig = getRuntimeConfig()
  
  // 1. 优先使用运行时配置（容器启动时注入）
  if (runtimeConfig.API_BASE_URL) {
    return runtimeConfig.API_BASE_URL
  }
  
  // 2. 使用构建时环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // 3. 容器化部署默认配置
  if (import.meta.env.PROD) {
    return '/api'  // 通过nginx代理到后端
  }
  
  // 4. 开发环境默认配置
  return '/api/v1'
}
```

### 3. 运行时环境变量注入

创建了 `scripts/utils/inject-env-vars.sh` 脚本，在容器启动时动态生成前端配置：

```javascript
window.__APP_CONFIG__ = {
  API_BASE_URL: '/api',
  APP_TITLE: '客户合同管理系统',
  APP_VERSION: '1.0.0',
  BACKEND_PORT: '8080',
  NODE_ENV: 'production'
};
```

### 4. Nginx代理配置

确认nginx配置正确处理API代理：

```nginx
# API代理到后端服务 (将 /api/ 代理到后端的 /api/v1/)
location /api/ {
    proxy_pass http://backend/api/v1/;
    # ... 其他代理配置
}
```

## 配置层次

### 优先级顺序
1. **运行时配置** (最高优先级) - 容器启动时注入
2. **构建时环境变量** - .env.production 文件
3. **生产环境默认值** - `/api`
4. **开发环境默认值** - `/api/v1`

### 支持的配置方式

#### 方式一：环境变量（推荐）
```bash
docker run -e FRONTEND_API_BASE_URL=/api your-image
```

#### 方式二：Docker Compose
```yaml
environment:
  - FRONTEND_API_BASE_URL=/api
```

#### 方式三：构建时配置
```env
# apps/frontend/.env.production
VITE_API_BASE_URL=/api
```

## 部署验证

### 1. 检查API配置
```bash
# 访问前端，检查浏览器控制台
# 应该看到: App Config Loaded: {API_BASE_URL: "/api", ...}
```

### 2. 测试API调用
```bash
# 前端应该能正常调用后端API
curl http://your-server:8000/api/auth/login
```

### 3. 检查nginx代理
```bash
# nginx应该将 /api/ 代理到后端的 /api/v1/
curl http://your-server:8000/api/health
```

## 文件修改清单

- ✅ `apps/frontend/.env.production` - 修复硬编码API地址
- ✅ `apps/frontend/src/api/config.ts` - 增强API配置逻辑
- ✅ `scripts/utils/inject-env-vars.sh` - 运行时环境变量注入脚本
- ✅ `scripts/dev/start.sh` - 集成环境变量注入
- ✅ `tools/docker/Dockerfile` - 包含注入脚本
- ✅ `deployment/docker-compose.production.yml` - 支持前端配置

## 预期效果

修复后的配置应该能够：

1. **自动适配部署环境** - 无需修改代码即可在不同环境部署
2. **支持运行时配置** - 通过环境变量动态配置API地址
3. **向后兼容** - 保持开发环境和现有配置的兼容性
4. **灵活部署** - 支持容器化、传统部署等多种方式

## 访问地址

根据您的配置，应用访问地址为：

- **前端**: http://your-server:8000
- **后端API**: http://your-server:8000/api (通过nginx代理)
- **直接后端**: http://your-server:8080/api/v1
- **健康检查**: http://your-server:8000/health

## 总结

通过这些修复，前端不再依赖硬编码的API地址，能够自动适配您的服务器环境配置，确保前后端能够正常通信。
