# JWT令牌刷新功能使用指南

## 概述

本系统已成功实现JWT令牌自动刷新功能，解决了令牌过期导致的认证失败问题。

## 功能特性

### 1. 后端功能
- ✅ 新增 `/api/v1/auth/refresh` 端点用于刷新令牌
- ✅ 支持过期令牌的刷新（在合理时间范围内）
- ✅ 保持用户会话连续性

### 2. 前端功能
- ✅ 自动检测令牌过期状态
- ✅ 自动刷新即将过期的令牌
- ✅ 统一的令牌存储管理
- ✅ 失败重试机制
- ✅ 令牌状态监控

## API端点

### 刷新令牌
```
POST /api/v1/auth/refresh
Authorization: Bearer <current_token>
```

**响应示例：**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@qiji.com"
  }
}
```

## 前端使用方法

### 1. 自动刷新
系统会自动在以下情况刷新令牌：
- 令牌在5分钟内即将过期
- API请求返回401错误时

### 2. 手动刷新
```javascript
import authService from './assets/js/services/auth.js';

// 手动刷新令牌
try {
  const newToken = await authService.refreshToken();
  console.log('令牌刷新成功:', newToken);
} catch (error) {
  console.error('令牌刷新失败:', error);
}
```

### 3. 令牌状态检查
```javascript
import tokenManager from './assets/js/utils/tokenManager.js';

// 获取令牌状态
const tokenInfo = tokenManager.getTokenInfo();
console.log('令牌状态:', tokenInfo);

// 启动自动刷新
tokenManager.startAutoRefresh();
```

## 测试方法

### 1. 使用测试页面
访问 `http://127.0.0.1:8000/token-refresh-test.html` 进行完整测试

### 2. 命令行测试

**登录获取令牌：**
```powershell
$body = '{"username":"admin","password":"123456"}'
$headers = @{ "Content-Type" = "application/json" }
$response = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/v1/auth/login" -Method POST -Headers $headers -Body $body
$response.Content
```

**刷新令牌：**
```powershell
$token = "your_current_token_here"
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
$response = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/v1/auth/refresh" -Method POST -Headers $headers
$response.Content
```

**测试API访问：**
```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$response = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/v1/customers?page=1&pageSize=5" -Headers $headers
$response.Content
```

## 配置说明

### 令牌过期时间
在 `node_api_service/.env` 文件中配置：
```
JWT_EXPIRES_IN=24h
```

### 自动刷新阈值
在 `frontend/assets/js/utils/tokenManager.js` 中配置：
```javascript
this.REFRESH_THRESHOLD = 5 * 60 * 1000; // 5分钟
```

## 故障排除

### 1. 令牌刷新失败
- 检查原令牌是否完全过期
- 确认用户账户是否仍然激活
- 检查网络连接

### 2. 自动刷新不工作
- 确认已调用 `tokenManager.init()`
- 检查浏览器控制台是否有错误
- 验证令牌格式是否正确

### 3. API请求仍然返回401
- 确认新令牌已正确存储
- 检查API请求头是否包含正确的Authorization
- 验证服务器时间同步

## 安全注意事项

1. **令牌存储**：令牌存储在localStorage中，请确保HTTPS连接
2. **刷新限制**：系统会限制过度刷新，避免滥用
3. **用户状态**：刷新时会验证用户账户状态
4. **自动登出**：多次刷新失败会自动跳转到登录页

## 更新日志

- **2024-01-31**: 实现JWT令牌自动刷新功能
- **2024-01-31**: 添加令牌状态监控和管理工具
- **2024-01-31**: 完成前后端集成测试

## 相关文件

### 后端文件
- `node_api_service/controllers/authController.js` - 认证控制器
- `node_api_service/routes/authRoutes.js` - 认证路由
- `node_api_service/middleware/authMiddleware.js` - 认证中间件

### 前端文件
- `frontend/assets/js/services/auth.js` - 认证服务
- `frontend/assets/js/services/api.js` - API服务基类
- `frontend/assets/js/utils/tokenManager.js` - 令牌管理工具
- `frontend/token-refresh-test.html` - 测试页面
