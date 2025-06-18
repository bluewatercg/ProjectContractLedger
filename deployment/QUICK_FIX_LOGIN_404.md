# 登录404错误快速修复指南

## 🚨 问题现象
登录请求发送到错误地址：`http://192.168.1.115:8000/api/v1/auth/login`
应该发送到：`http://192.168.1.115:8080/api/v1/auth/login`

## 🔍 问题根源
前端配置中设置了 `API_BASE_URL: '/api/v1'`，导致前端使用相对路径而不是自动检测后端地址。

## ⚡ 快速修复方案

### 方案1：修改现有容器配置（立即生效）

```bash
# 1. 进入前端容器
docker exec -it contract-ledger-frontend sh

# 2. 修改配置文件
cat > /usr/share/nginx/html/config.js << 'EOF'
// 运行时环境配置
window.__APP_CONFIG__ = {
  // API版本配置（不设置API_BASE_URL，让前端自动检测）
  API_VERSION: 'v1',
  
  // 后端配置（用于前端自动构建API URL）
  BACKEND_HOST: '192.168.1.115',
  BACKEND_PORT: '8080',
  BACKEND_HOST_PORT: '8080',
  
  // 应用配置
  APP_TITLE: '客户合同管理系统',
  APP_VERSION: '1.0.0',
  NODE_ENV: 'production'
};

console.log('App Config Loaded:', window.__APP_CONFIG__);
console.log('Frontend will auto-detect API URL based on environment');
EOF

# 3. 退出容器
exit

# 4. 刷新浏览器页面测试
```

### 方案2：重新构建镜像（永久修复）

```bash
# 1. 构建新的前端镜像
cd apps/frontend
docker build -t ghcr.io/bluewatercg/projectcontractledger-frontend:latest .

# 2. 重新部署
cd ../../deployment
./deploy-separated.sh --update
```

## 🔧 验证修复

### 1. 检查配置文件
访问：`http://192.168.1.115:8000/config.js`

应该看到：
```javascript
window.__APP_CONFIG__ = {
  API_VERSION: 'v1',
  BACKEND_HOST_PORT: '8080',
  // 注意：没有 API_BASE_URL 字段
};
```

### 2. 检查浏览器控制台
打开开发者工具，应该看到：
```
App Config Loaded: {API_VERSION: "v1", BACKEND_HOST_PORT: "8080", ...}
Frontend will auto-detect API URL based on environment
API Request: POST /auth/login
API Version: v1 Base URL: http://192.168.1.115:8080/api/v1
```

### 3. 测试登录
登录时，网络请求应该是：
```
POST http://192.168.1.115:8080/api/v1/auth/login ✅
```

## 📋 技术原理

### 前端URL构建逻辑
```typescript
// 当 API_BASE_URL 未设置时，前端会自动检测：
if (import.meta.env.PROD) {
  const currentHost = window.location.hostname  // 192.168.1.115
  const currentPort = window.location.port      // 8000
  const backendPort = runtimeConfig.BACKEND_HOST_PORT || '8080'
  
  // 前后端分离部署（不同端口）
  if (currentPort !== backendPort && backendPort !== '80') {
    return `http://${currentHost}:${backendPort}/api/v1`
    // 返回: http://192.168.1.115:8080/api/v1 ✅
  }
}
```

### 错误配置 vs 正确配置

**❌ 错误配置（导致404）：**
```javascript
window.__APP_CONFIG__ = {
  API_BASE_URL: '/api/v1',  // 相对路径，导致请求发送到8000端口
  BACKEND_HOST_PORT: '8080'
};
// 结果：http://192.168.1.115:8000/api/v1/auth/login
```

**✅ 正确配置（自动检测）：**
```javascript
window.__APP_CONFIG__ = {
  // 不设置 API_BASE_URL，让前端自动检测
  API_VERSION: 'v1',
  BACKEND_HOST_PORT: '8080'
};
// 结果：http://192.168.1.115:8080/api/v1/auth/login
```

## 🚨 注意事项

1. **方案1是临时修复**：容器重启后会丢失，需要重新执行
2. **方案2是永久修复**：修改了镜像，重启后仍然有效
3. **清除浏览器缓存**：修复后建议清除浏览器缓存或硬刷新（Ctrl+F5）

## 🔄 回滚方案

如果修复后出现其他问题：

```bash
# 恢复原始配置
docker exec -it contract-ledger-frontend sh -c '
cat > /usr/share/nginx/html/config.js << "EOF"
window.__APP_CONFIG__ = {
  API_BASE_URL: "/api/v1",
  API_VERSION: "v1",
  BACKEND_HOST_PORT: "8080"
};
EOF'
```
