# Nginx代理404错误修复指南

## 🚨 问题现象
- 前端请求：`POST /api/v1/auth/login`
- 后端接收：`POST /v1/auth/login`（缺少 `/api/` 前缀）
- 错误响应：`404 - 请求的资源不存在`

## 🔍 问题根源
Nginx代理配置中的 `proxy_pass` 末尾有斜杠，导致路径前缀被去掉：

```nginx
# ❌ 错误配置（会去掉 /api/ 前缀）
location /api/ {
    proxy_pass http://backend/;  # 末尾斜杠导致路径重写
}

# ✅ 正确配置（保留完整路径）
location /api/ {
    proxy_pass http://backend;   # 无末尾斜杠，保留原路径
}
```

## ⚡ 立即修复方案

### 方案1：修改现有容器配置（立即生效）

```bash
# 1. 进入前端容器
docker exec -it contract-ledger-frontend sh

# 2. 备份原配置
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# 3. 修复代理配置
sed -i 's|proxy_pass http://backend/;|proxy_pass http://backend;|g' /etc/nginx/nginx.conf

# 4. 验证配置
nginx -t

# 5. 重新加载nginx配置
nginx -s reload

# 6. 退出容器
exit
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

### 1. 检查nginx配置
```bash
# 进入容器检查配置
docker exec contract-ledger-frontend cat /etc/nginx/nginx.conf | grep -A 3 "location /api/"
```

应该看到：
```nginx
location /api/ {
    proxy_pass http://backend;  # 注意：没有末尾斜杠
```

### 2. 测试API请求
访问 `http://192.168.1.115:8000` 并尝试登录，检查网络请求：

**修复前**：
```
前端请求: POST /api/v1/auth/login
nginx代理: POST /v1/auth/login (❌ 缺少 /api/ 前缀)
后端响应: 404 Not Found
```

**修复后**：
```
前端请求: POST /api/v1/auth/login
nginx代理: POST /api/v1/auth/login (✅ 保留完整路径)
后端响应: 200 OK 或 401 Unauthorized (正常业务逻辑)
```

### 3. 检查后端日志
```bash
# 查看后端容器日志
docker logs contract-ledger-backend -f
```

修复后应该看到正确的API路径访问日志。

## 📋 技术原理

### Nginx代理路径处理规则

```nginx
# 规则1：proxy_pass 末尾有斜杠 - 路径替换
location /api/ {
    proxy_pass http://backend/;
}
# 请求 /api/v1/auth/login → 代理到 /v1/auth/login

# 规则2：proxy_pass 末尾无斜杠 - 路径追加
location /api/ {
    proxy_pass http://backend;
}
# 请求 /api/v1/auth/login → 代理到 /api/v1/auth/login
```

### 后端路由匹配

```typescript
// 后端控制器期望的完整路径
@Controller('/api/v1/auth')
export class AuthController {
  @Post('/login')  // 完整路径: /api/v1/auth/login
  async login() { ... }
}
```

## 🚨 注意事项

1. **方案1是临时修复**：容器重启后会丢失，需要重新执行
2. **方案2是永久修复**：修改了镜像，重启后仍然有效
3. **配置验证**：修改后务必执行 `nginx -t` 验证配置语法
4. **服务重载**：使用 `nginx -s reload` 而不是重启容器

## 🔄 回滚方案

如果修复后出现其他问题：

```bash
# 恢复备份配置
docker exec -it contract-ledger-frontend sh -c '
cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
nginx -t && nginx -s reload
'
```

## 🎯 预期效果

修复后的完整请求流程：
```
1. 前端发起: POST http://192.168.1.115:8080/api/v1/auth/login
2. nginx接收: POST /api/v1/auth/login
3. nginx代理: POST http://backend/api/v1/auth/login
4. 后端处理: AuthController.login() ✅
5. 返回响应: 登录成功或业务错误
```
