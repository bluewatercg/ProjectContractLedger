# API路径重复问题修复总结

## 🐛 问题描述

生产环境中访问附件下载接口时出现404错误，错误信息显示API路径变成了：
```
/api/v1/v1/attachments/8/download
```

## 🔍 问题分析

### 根本原因
API路径出现重复的 `/v1`，导致请求路径错误。分析发现问题出现在nginx代理配置上：

1. **前端请求路径**：`/api/v1/attachments/8/download`
2. **Nginx代理配置**：`location /api/` 代理到 `http://backend/api/v1/`
3. **结果路径**：`/api/v1/attachments/8/download` → `http://backend/api/v1/v1/attachments/8/download`

### 配置冲突
```nginx
# 原配置（有问题）
location /api/ {
    proxy_pass http://backend/api/v1/;  # 这里导致了路径重复
}
```

当前端请求 `/api/v1/xxx` 时，nginx会将其代理到 `http://backend/api/v1/v1/xxx`。

## 🛠️ 修复方案

### 1. 修复nginx代理配置

#### 修复前
```nginx
# tools/nginx/nginx.conf
location /api/ {
    proxy_pass http://backend/api/v1/;  # 导致路径重复
}
```

#### 修复后
```nginx
# tools/nginx/nginx.conf
location /api/ {
    proxy_pass http://backend/;  # 直接代理到后端根路径
}
```

### 2. 修复环境变量配置

#### 修复前
```bash
# .env.production.template
FRONTEND_API_BASE_URL=/api  # 路径不完整
```

#### 修复后
```bash
# .env.production.template
FRONTEND_API_BASE_URL=/api/v1  # 完整的API路径
```

## 📋 修复文件清单

### 已修改的文件
- ✅ `tools/nginx/nginx.conf` - 修复nginx代理配置
- ✅ `.env.production.template` - 修复前端API基础URL配置
- ✅ `scripts/fix-api-path-production.sh` - 生产环境修复脚本

## 🚀 部署修复

### 方法1：使用修复脚本（推荐）
```bash
# 运行修复脚本
./scripts/fix-api-path-production.sh

# 查看服务状态
./scripts/fix-api-path-production.sh status

# 查看日志
./scripts/fix-api-path-production.sh logs

# 测试API修复
./scripts/fix-api-path-production.sh test
```

### 方法2：手动部署
```bash
# 1. 停止当前容器
docker stop <current-container-name>
docker rm <current-container-name>

# 2. 构建修复后的镜像
docker build -f tools/docker/Dockerfile -t bluewatercg/projectcontractledger:fixed .

# 3. 启动修复后的容器
docker run -d \
  --name contract-ledger-fixed \
  --restart unless-stopped \
  -p 8000:80 \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e DB_HOST=192.168.1.254 \
  -e DB_PORT=3306 \
  -e DB_USERNAME=procontractledger \
  -e DB_PASSWORD=your_db_password \
  -e DB_DATABASE=procontractledger \
  -e REDIS_HOST=192.168.1.160 \
  -e REDIS_PORT=6379 \
  -e REDIS_DB=13 \
  -e JWT_SECRET=your_jwt_secret \
  -e FRONTEND_API_BASE_URL=/api/v1 \
  -e UPLOAD_DIR=/app/uploads \
  -v contract_uploads:/app/uploads \
  -v contract_logs:/app/logs \
  bluewatercg/projectcontractledger:fixed
```

## 🧪 验证修复

### 1. 检查服务状态
```bash
# 检查容器状态
docker ps

# 检查服务健康
curl http://192.168.1.115:8000/api/v1/health
```

### 2. 测试API路径
```bash
# 测试附件下载接口（应该返回401未授权，而不是404）
curl -I http://192.168.1.115:8000/api/v1/attachments/1/download
```

### 3. 前端功能测试
1. 访问 http://192.168.1.115:8000
2. 登录系统
3. 上传合同或发票附件
4. 测试附件预览和下载功能

## 🎯 预期效果

修复后，API调用应该：

1. ✅ 正确的API路径：`/api/v1/attachments/8/download`
2. ✅ 不再出现路径重复：`/api/v1/v1/...`
3. ✅ 附件上传功能正常
4. ✅ 附件下载功能正常
5. ✅ 附件预览功能正常

## 🔧 技术细节

### API路径映射
```
前端请求: /api/v1/attachments/8/download
         ↓
Nginx代理: location /api/ → proxy_pass http://backend/
         ↓
后端接收: /api/v1/attachments/8/download
         ↓
控制器: @Controller('/api/v1') + @Get('/attachments/:id/download')
         ↓
最终路径: /api/v1/attachments/8/download ✅
```

### 环境变量优先级
```
1. 运行时配置 (window.__APP_CONFIG__.API_BASE_URL)
2. 构建时环境变量 (VITE_API_BASE_URL)
3. 生产环境动态配置
4. 开发环境默认配置
```

## 🚨 注意事项

1. **数据备份**: 部署前已自动备份当前容器为镜像
2. **环境变量**: 确保所有必要的环境变量都已正确设置
3. **网络访问**: 确保容器能访问外部MySQL和Redis服务
4. **端口映射**: 确保端口8000和8080没有被其他服务占用

## 📞 故障排除

### 如果修复后仍有问题

1. **检查nginx配置**
   ```bash
   docker exec contract-ledger-fixed nginx -t
   ```

2. **检查环境变量**
   ```bash
   docker exec contract-ledger-fixed env | grep API
   ```

3. **查看详细日志**
   ```bash
   docker logs contract-ledger-fixed --tail 100
   ```

4. **测试网络连接**
   ```bash
   docker exec contract-ledger-fixed curl -I http://localhost:8080/health
   ```

### 回滚方案
如果修复失败，可以快速回滚到备份镜像：
```bash
docker stop contract-ledger-fixed
docker rm contract-ledger-fixed
docker run -d --name contract-ledger-rollback <backup-image-tag>
```
