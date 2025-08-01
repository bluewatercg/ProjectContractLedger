# 登录API 404问题修复总结

## 🐛 问题描述

生产环境部署最新版本后，登录功能出现404错误：
```
{success: false, message: "请求的资源不存在", code: 404, path: "/auth/login"}
```

请求URL：`http://192.168.1.115:8000/api/auth/login` 返回 404 Not Found

## 🔍 问题分析

### 根本原因
前端API基础URL配置错误，导致请求路径不匹配：

1. **前端实际请求**：`http://192.168.1.115:8000/api/auth/login`
2. **后端控制器路径**：`/api/v1/auth/login`
3. **路径不匹配**：缺少 `/v1` 部分

### 配置链路分析
```
启动脚本 → 运行时配置 → 前端API配置 → 实际请求
```

1. **启动脚本配置**：
   ```bash
   # scripts/dev/start.sh (第75行)
   API_BASE_URL: '${FRONTEND_API_BASE_URL:-/api}',  # 默认值错误
   ```

2. **环境变量配置**：
   ```bash
   # .env 文件
   FRONTEND_API_BASE_URL=/api/v1  # 正确配置
   ```

3. **前端运行时配置**：
   ```javascript
   // window.__APP_CONFIG__.API_BASE_URL
   // 如果环境变量未传递，使用默认值 /api
   ```

4. **前端API调用**：
   ```javascript
   // apps/frontend/src/api/auth.ts
   apiClient.post('/auth/login', data)
   // baseURL + path = /api + /auth/login = /api/auth/login ❌
   ```

5. **后端控制器**：
   ```typescript
   // apps/backend/src/controller/auth.controller.ts
   @Controller('/api/v1/auth')  // 期望路径: /api/v1/auth/login ✅
   ```

## 🛠️ 修复方案

### 1. 修复启动脚本默认值

#### 修复前
```bash
# scripts/dev/start.sh
API_BASE_URL: '${FRONTEND_API_BASE_URL:-/api}',  # 默认值错误
```

#### 修复后
```bash
# scripts/dev/start.sh
API_BASE_URL: '${FRONTEND_API_BASE_URL:-/api/v1}',  # 默认值正确
```

### 2. 确保环境变量配置正确

#### .env 文件配置
```bash
# 确保环境变量设置正确
FRONTEND_API_BASE_URL=/api/v1
```

#### docker-compose.yml 配置
```yaml
environment:
  - FRONTEND_API_BASE_URL=${FRONTEND_API_BASE_URL:-/api/v1}
```

## 📋 修复文件清单

### 已修改的文件
- ✅ `scripts/dev/start.sh` - 修复运行时配置默认值
- ✅ `.env.production.template` - 确保环境变量配置正确
- ✅ `docker-compose.yml` - 确保环境变量传递正确

## 🚀 部署修复

### 方法1：重新构建并部署
```bash
# 1. 构建修复后的镜像
docker build -f tools/docker/Dockerfile -t bluewatercg/projectcontractledger:fixed .

# 2. 停止当前容器
docker stop <current-container-name>
docker rm <current-container-name>

# 3. 启动修复后的容器
docker run -d \
  --name contract-ledger-fixed \
  --restart unless-stopped \
  -p 8000:80 \
  -p 8080:8080 \
  --env-file .env \
  -v contract_uploads:/app/uploads \
  -v contract_logs:/app/logs \
  bluewatercg/projectcontractledger:fixed
```

### 方法2：使用docker-compose
```bash
# 1. 确保 .env 文件配置正确
echo "FRONTEND_API_BASE_URL=/api/v1" >> .env

# 2. 重新部署
docker-compose down
docker-compose pull  # 如果使用远程镜像
docker-compose up -d
```

## 🧪 验证修复

### 1. 检查运行时配置
在浏览器控制台查看：
```javascript
console.log(window.__APP_CONFIG__)
// 应该显示: { API_BASE_URL: "/api/v1", ... }
```

### 2. 测试登录API
```bash
# 测试登录接口（应该返回401而不是404）
curl -X POST http://192.168.1.115:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### 3. 前端功能测试
1. 访问 http://192.168.1.115:8000
2. 尝试登录
3. 检查网络请求是否正确指向 `/api/v1/auth/login`

## 🎯 预期效果

修复后，API调用应该：

1. ✅ 正确的登录API路径：`/api/v1/auth/login`
2. ✅ 不再出现404错误
3. ✅ 登录功能正常工作
4. ✅ 其他API调用也正常工作

## 🔧 技术细节

### API路径映射流程
```
前端配置: window.__APP_CONFIG__.API_BASE_URL = "/api/v1"
         ↓
前端调用: apiClient.post('/auth/login', data)
         ↓
实际请求: /api/v1 + /auth/login = /api/v1/auth/login
         ↓
Nginx代理: location /api/ → proxy_pass http://backend/
         ↓
后端接收: /api/v1/auth/login
         ↓
控制器: @Controller('/api/v1/auth') + @Post('/login')
         ↓
最终匹配: /api/v1/auth/login ✅
```

### 配置优先级
```
1. 运行时配置 (window.__APP_CONFIG__.API_BASE_URL) - 最高优先级
2. 构建时环境变量 (VITE_API_BASE_URL)
3. 生产环境动态配置
4. 开发环境默认配置
```

## 🚨 注意事项

1. **环境变量传递**：确保 `FRONTEND_API_BASE_URL` 正确传递到容器
2. **配置缓存**：浏览器可能缓存旧的配置，建议清除缓存
3. **网络检查**：确保前后端网络连接正常
4. **日志监控**：部署后检查容器日志确认配置正确

## 📞 故障排除

### 如果修复后仍有问题

1. **检查运行时配置**
   ```bash
   # 进入容器检查配置文件
   docker exec -it <container-name> cat /usr/share/nginx/html/config.js
   ```

2. **检查环境变量**
   ```bash
   docker exec -it <container-name> env | grep FRONTEND_API_BASE_URL
   ```

3. **检查网络请求**
   - 打开浏览器开发者工具
   - 查看Network标签页
   - 确认请求URL是否正确

4. **查看详细日志**
   ```bash
   docker logs <container-name> --tail 100
   ```

### 常见问题

1. **Q: 修复后还是404**
   A: 检查浏览器缓存，尝试硬刷新或清除缓存

2. **Q: 环境变量没有生效**
   A: 确认docker-compose.yml中正确传递了环境变量

3. **Q: 其他API也有问题**
   A: 这个修复会同时解决所有API路径问题

## 🎉 总结

这个问题的根本原因是启动脚本中运行时配置的默认值设置错误，导致前端API基础URL缺少 `/v1` 部分。通过修复启动脚本的默认值，确保了前端API调用路径与后端控制器路径的正确匹配。
