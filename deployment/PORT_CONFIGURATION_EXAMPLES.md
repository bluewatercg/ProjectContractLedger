# 端口配置示例

本文档提供了不同部署环境下的端口配置示例，适应各种宿主机端口限制情况。

## 🔧 端口配置原理

### 端口映射格式
```
宿主机端口:容器内端口
```

- **宿主机端口**: 外部访问的端口，可根据环境调整
- **容器内端口**: Docker镜像内部端口，通常固定

### 配置变量说明
```bash
# 前端服务
FRONTEND_HOST_PORT=8000        # 宿主机端口（外部访问）
FRONTEND_CONTAINER_PORT=80     # 容器内端口（镜像内部）

# 后端服务  
BACKEND_HOST_PORT=8080         # 宿主机端口（外部访问）
BACKEND_CONTAINER_PORT=8080    # 容器内端口（镜像内部）

# 代理服务
PROXY_HOST_PORT=8001           # 宿主机端口（外部访问）
PROXY_CONTAINER_PORT=80        # 容器内端口（镜像内部）
```

## 📋 常见部署场景

### 场景1: 默认配置（推荐）
**适用**: 大多数环境，避免使用80端口
```bash
# 前端: 8000:80
FRONTEND_HOST_PORT=8000
FRONTEND_CONTAINER_PORT=80

# 后端: 8080:8080  
BACKEND_HOST_PORT=8080
BACKEND_CONTAINER_PORT=8080

# 代理: 8001:80
PROXY_HOST_PORT=8001
PROXY_CONTAINER_PORT=80
```

**访问地址**:
- 前端: http://192.168.1.115:8000
- 后端: http://192.168.1.115:8080
- 代理: http://192.168.1.115:8001

### 场景2: 高端口配置
**适用**: 避免端口冲突，使用高端口
```bash
# 前端: 9000:80
FRONTEND_HOST_PORT=9000
FRONTEND_CONTAINER_PORT=80

# 后端: 9080:8080
BACKEND_HOST_PORT=9080
BACKEND_CONTAINER_PORT=8080

# 代理: 9001:80
PROXY_HOST_PORT=9001
PROXY_CONTAINER_PORT=80
```

**访问地址**:
- 前端: http://192.168.1.115:9000
- 后端: http://192.168.1.115:9080
- 代理: http://192.168.1.115:9001

### 场景3: 连续端口配置
**适用**: 便于管理，使用连续端口
```bash
# 前端: 8100:80
FRONTEND_HOST_PORT=8100
FRONTEND_CONTAINER_PORT=80

# 后端: 8101:8080
BACKEND_HOST_PORT=8101
BACKEND_CONTAINER_PORT=8080

# 代理: 8102:80
PROXY_HOST_PORT=8102
PROXY_CONTAINER_PORT=80
```

**访问地址**:
- 前端: http://192.168.1.115:8100
- 后端: http://192.168.1.115:8101
- 代理: http://192.168.1.115:8102

### 场景4: 开发环境配置
**适用**: 开发环境，使用常见的开发端口
```bash
# 前端: 3000:80
FRONTEND_HOST_PORT=3000
FRONTEND_CONTAINER_PORT=80

# 后端: 3001:8080
BACKEND_HOST_PORT=3001
BACKEND_CONTAINER_PORT=8080

# 代理: 3002:80
PROXY_HOST_PORT=3002
PROXY_CONTAINER_PORT=80
```

**访问地址**:
- 前端: http://192.168.1.115:3000
- 后端: http://192.168.1.115:3001
- 代理: http://192.168.1.115:3002

### 场景5: 自定义容器内端口
**适用**: 需要修改容器内端口的情况
```bash
# 前端: 8000:8000 (容器内也使用8000)
FRONTEND_HOST_PORT=8000
FRONTEND_CONTAINER_PORT=8000

# 后端: 8080:3000 (容器内使用3000)
BACKEND_HOST_PORT=8080
BACKEND_CONTAINER_PORT=3000

# 代理: 8001:8080 (容器内使用8080)
PROXY_HOST_PORT=8001
PROXY_CONTAINER_PORT=8080
```

## 🚀 配置步骤

### 1. 编辑环境变量文件
```bash
cd /opt/projectcontractledger/deployment
nano .env
```

### 2. 设置端口配置
选择上述场景之一，或自定义端口配置：
```bash
# 示例：使用场景2的高端口配置
FRONTEND_HOST_PORT=9000
FRONTEND_CONTAINER_PORT=80
BACKEND_HOST_PORT=9080
BACKEND_CONTAINER_PORT=8080
PROXY_HOST_PORT=9001
PROXY_CONTAINER_PORT=80
```

### 3. 重启服务
```bash
./deploy-separated.sh --update
```

### 4. 验证访问
```bash
# 检查端口是否正常监听
netstat -tlnp | grep :9000
netstat -tlnp | grep :9080

# 测试访问
curl -I http://192.168.1.115:9000
curl -I http://192.168.1.115:9080/health
```

## 🔍 故障排除

### 端口冲突
```bash
# 检查端口占用
netstat -tlnp | grep :8000
lsof -i :8000

# 更换端口或停止冲突服务
sudo systemctl stop conflicting-service
```

### 防火墙问题
```bash
# 开放端口
sudo ufw allow 8000
sudo ufw allow 8080
sudo ufw allow 8001

# 或者开放端口范围
sudo ufw allow 8000:8100/tcp
```

### 容器启动失败
```bash
# 查看容器日志
docker logs contract-ledger-frontend
docker logs contract-ledger-backend

# 检查端口映射
docker port contract-ledger-frontend
docker port contract-ledger-backend
```

## 📝 注意事项

1. **端口范围**: 建议使用1024以上的端口，避免需要root权限
2. **端口冲突**: 确保选择的端口没有被其他服务占用
3. **防火墙**: 确保防火墙允许访问选择的端口
4. **负载均衡**: 如果使用负载均衡器，需要相应调整配置
5. **SSL证书**: 如果使用HTTPS，需要在代理层配置SSL证书

## 🔄 向后兼容

系统同时支持新旧两种配置方式：

### 新配置方式（推荐）
```bash
FRONTEND_HOST_PORT=8000
FRONTEND_CONTAINER_PORT=80
BACKEND_HOST_PORT=8080
BACKEND_CONTAINER_PORT=8080
```

### 旧配置方式（兼容）
```bash
FRONTEND_PORT=8000
BACKEND_PORT=8080
```

如果同时存在新旧配置，系统会优先使用新配置方式。
