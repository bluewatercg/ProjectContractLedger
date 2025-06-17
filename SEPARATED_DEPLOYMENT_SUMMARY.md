# 分离式前后端容器部署总结

本文档总结了将前后端从合并容器分离为独立容器的完整实现过程。

## 🎯 项目目标

将原有的合并前后端Docker容器分离成两个独立的容器，解决合并部署中的各种问题，提供更灵活的部署方案。

## ✅ 完成的任务

### 1. 后端独立容器配置 ✅
- **文件**: `apps/backend/Dockerfile` (已存在，优化完善)
- **配置**: `apps/backend/docker-compose.yml`
- **特性**:
  - 独立的Node.js后端服务
  - 支持IP地址通讯
  - 健康检查配置
  - 资源限制设置
  - 数据卷持久化

### 2. 前端独立容器配置 ✅
- **文件**: `apps/frontend/Dockerfile` (优化完善)
- **配置**: `apps/frontend/docker-compose.yml`
- **Nginx配置**: `apps/frontend/nginx.conf`
- **启动脚本**: `apps/frontend/start.sh`
- **特性**:
  - 基于Nginx的静态文件服务
  - 运行时环境变量替换
  - 支持后端IP地址配置
  - 反向代理到后端API

### 3. GitHub Actions工作流更新 ✅
- **主工作流**: `.github/workflows/docker-build-push.yml`
- **测试工作流**: `.github/workflows/test-build.yml`
- **改进**:
  - 分离的前后端镜像构建
  - 独立的缓存策略
  - 并行构建支持
  - 镜像命名规范化

### 4. 分离部署配置 ✅
- **Docker Compose**: `deployment/docker-compose.separated.yml`
- **环境变量模板**: `deployment/.env.separated.template`
- **部署脚本**: 
  - `deployment/deploy-separated.sh` (Linux/macOS)
  - `deployment/deploy-separated.ps1` (Windows)
- **特性**:
  - 支持IP地址通讯
  - 可选的Nginx代理
  - 健康检查和依赖管理
  - 资源限制配置

### 5. 网络和代理配置 ✅
- **Nginx代理配置**: `deployment/nginx/nginx-separated.conf`
- **特性**:
  - 统一入口代理
  - 支持环境变量配置
  - 静态资源缓存优化
  - 直接访问端口配置

### 6. 测试和验证脚本 ✅
- **测试脚本**: 
  - `scripts/test-separated-build.sh` (Linux/macOS)
  - `scripts/test-separated-build.ps1` (Windows)
- **功能**:
  - Docker环境检查
  - 前后端容器构建测试
  - 部署配置验证
  - 自动清理测试资源

### 7. 文档更新 ✅
- **部署指南**: `docs/deployment/分离式前后端部署指南.md`
- **README更新**: 添加分离部署说明
- **总结文档**: `SEPARATED_DEPLOYMENT_SUMMARY.md`

## 🏗️ 架构变化

### 原架构 (合并容器)
```
┌─────────────────────────────────────┐
│         单一容器                     │
│  ┌─────────────┐  ┌─────────────┐   │
│  │   前端      │  │   后端      │   │
│  │  (Nginx)    │  │ (Node.js)   │   │
│  │  Port: 80   │  │ Port: 8080  │   │
│  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────┘
```

### 新架构 (分离容器)
```
┌─────────────────┐    HTTP/API    ┌─────────────────┐
│   前端容器       │ ◄─────────────► │   后端容器       │
│  (Nginx + Vue)  │   IP通讯       │  (Node.js API)  │
│  Port: 80       │                │  Port: 8080     │
└─────────────────┘                └─────────────────┘
         ▲                                   ▲
         │                                   │
         ▼                                   ▼
┌─────────────────────────────────────────────────────┐
│              可选 Nginx 代理                        │
│  统一入口: 8000  │  直接后端: 8081  │  直接前端: 8082 │
└─────────────────────────────────────────────────────┘
```

## 📦 镜像构建

### GitHub Container Registry
- **后端镜像**: `ghcr.io/bluewatercg/projectcontractledger-backend:latest`
- **前端镜像**: `ghcr.io/bluewatercg/projectcontractledger-frontend:latest`

### 构建触发条件
- 推送到主分支 (main, master, develop, midwayjs)
- 创建标签 (v*)
- Pull Request
- 手动触发

## 🚀 部署方式

### 方式一：分离部署 (推荐)
```bash
cd deployment
./deploy-separated.sh  # Linux/macOS
# 或
.\deploy-separated.ps1  # Windows
```

### 方式二：手动部署
```bash
cd deployment
docker-compose -f docker-compose.separated.yml --env-file .env.separated up -d
```

### 方式三：带代理的统一入口
```bash
cd deployment
docker-compose -f docker-compose.separated.yml --profile proxy --env-file .env.separated up -d
```

## 🔧 配置要点

### 环境变量配置
```bash
# 服务器IP配置
BACKEND_HOST=192.168.1.115
FRONTEND_HOST=192.168.1.115

# 端口配置
BACKEND_PORT=8080
FRONTEND_PORT=80

# 代理配置 (可选)
PROXY_PORT=8000
BACKEND_DIRECT_PORT=8081
FRONTEND_DIRECT_PORT=8082

# 数据库配置
DB_HOST=192.168.1.254
REDIS_HOST=192.168.1.160
```

### 网络配置
- 支持 `bridge` 和 `host` 网络模式
- 前后端通过IP地址通讯
- 可配置的端口映射

## 🎉 优势总结

### 1. 独立性
- 前后端可以独立更新和扩展
- 故障隔离，一个服务的问题不影响另一个
- 独立的资源配置和监控

### 2. 灵活性
- 支持多种部署模式
- 可以部署在不同的服务器上
- 灵活的网络配置选项

### 3. 可维护性
- 清晰的服务边界
- 独立的日志和监控
- 更容易调试和排错

### 4. 扩展性
- 可以独立扩展前端或后端
- 支持负载均衡配置
- 更好的资源利用率

## 📋 使用指南

### 快速开始
1. 克隆项目到本地
2. 配置环境变量 (`deployment/.env.separated`)
3. 运行部署脚本
4. 访问服务验证功能

### 生产部署
1. 确保服务器已安装Docker和Docker Compose
2. 配置防火墙和网络
3. 设置数据库和Redis连接
4. 运行部署脚本
5. 配置监控和备份

### 故障排除
- 查看容器日志: `docker-compose logs -f`
- 检查容器状态: `docker-compose ps`
- 验证网络连通性: `docker exec -it container ping target`
- 重启服务: `docker-compose restart`

## 🔮 后续优化

### 可能的改进方向
1. **监控集成**: 添加Prometheus和Grafana监控
2. **日志聚合**: 集成ELK或类似的日志系统
3. **自动扩展**: 基于负载的自动扩展配置
4. **安全加固**: HTTPS配置和安全策略
5. **CI/CD优化**: 更完善的测试和部署流水线

### 性能优化
1. **缓存策略**: Redis缓存和CDN配置
2. **数据库优化**: 连接池和查询优化
3. **静态资源**: 压缩和缓存策略
4. **负载均衡**: 多实例部署配置

## 📞 支持

如有问题或建议，请：
1. 查看部署指南文档
2. 检查GitHub Issues
3. 运行测试脚本验证环境
4. 查看容器日志排查问题

---

**项目状态**: ✅ 完成
**最后更新**: 2024年
**维护者**: ProjectContractLedger Team
