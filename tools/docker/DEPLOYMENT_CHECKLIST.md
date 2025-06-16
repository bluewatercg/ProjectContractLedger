# Docker 部署验证清单

## 部署前检查

### 环境准备
- [ ] Docker 已安装 (`docker --version`)
- [ ] Docker Compose 已安装 (`docker-compose --version`)
- [ ] 项目代码已克隆到服务器
- [ ] 服务器端口 80, 8080, 3306 可用

### 配置文件检查
- [ ] 复制 `.env.example` 为 `.env`
- [ ] 设置安全的数据库密码 (`DB_PASSWORD`)
- [ ] 设置安全的 JWT 密钥 (`JWT_SECRET`)
- [ ] 配置正确的镜像仓库 (`GITHUB_REPOSITORY`)
- [ ] 验证配置文件语法 (`docker-compose config`)

### 目录权限
- [ ] 创建数据目录 (`mkdir -p data/uploads data/logs`)
- [ ] 设置目录权限 (`chmod -R 755 data/`)
- [ ] 验证目录可写入

## 部署步骤

### 开发环境部署
```bash
# 1. 进入 Docker 目录
cd tools/docker

# 2. 运行启动脚本
./start-dev.sh

# 3. 验证服务状态
docker-compose ps
```

### 生产环境部署
```bash
# 1. 设置环境变量
export GITHUB_REPOSITORY=your-username/your-repo
export IMAGE_TAG=latest
export DB_PASSWORD=your-secure-password
export JWT_SECRET=your-jwt-secret

# 2. 运行启动脚本
./start-prod.sh

# 3. 验证服务状态
docker-compose -f docker-compose.prod.yml ps
```

## 部署后验证

### 服务状态检查
- [ ] 所有容器状态为 "Up" (`docker-compose ps`)
- [ ] 应用容器健康检查通过
- [ ] MySQL 容器健康检查通过
- [ ] Redis 容器健康检查通过（生产环境）

### 网络连接测试
- [ ] 前端页面可访问 (`curl http://localhost`)
- [ ] 后端 API 可访问 (`curl http://localhost:8080/api/v1/statistics/dashboard`)
- [ ] Swagger 文档可访问 (`curl http://localhost:8080/swagger-ui/index.html`)

### 功能测试
- [ ] 用户登录功能正常
- [ ] 客户管理功能正常
- [ ] 合同管理功能正常
- [ ] 发票管理功能正常
- [ ] 支付管理功能正常
- [ ] 附件上传功能正常
- [ ] 附件下载功能正常
- [ ] 附件预览功能正常

### 数据持久化验证
- [ ] 重启容器后数据保持 (`docker-compose restart`)
- [ ] 附件文件在 `data/uploads` 目录中
- [ ] 日志文件在 `data/logs` 目录中
- [ ] 数据库数据持久化正常

### 性能和监控
- [ ] 容器资源使用正常 (`docker stats`)
- [ ] 磁盘空间充足 (`df -h`)
- [ ] 日志文件正常生成
- [ ] 错误日志无异常

## 故障排除

### 常见问题
1. **容器启动失败**
   - 检查端口占用 (`netstat -tulpn | grep :80`)
   - 检查 Docker 日志 (`docker-compose logs app`)
   - 验证配置文件 (`docker-compose config`)

2. **数据库连接失败**
   - 检查数据库容器状态 (`docker-compose logs mysql`)
   - 验证数据库配置
   - 检查网络连接

3. **附件上传失败**
   - 检查 uploads 目录权限
   - 验证文件大小限制
   - 检查磁盘空间

4. **日志文件缺失**
   - 检查 logs 目录权限
   - 验证日志配置
   - 检查容器挂载

### 监控命令
```bash
# 系统监控
./monitor.sh

# 查看日志
docker-compose logs -f app

# 资源使用
docker stats

# 磁盘使用
du -sh data/*
```

### 备份恢复
```bash
# 创建备份
./backup.sh

# 恢复数据
tar -xzf backups/uploads_YYYYMMDD_HHMMSS.tar.gz
tar -xzf backups/logs_YYYYMMDD_HHMMSS.tar.gz
```

## 安全检查

### 配置安全
- [ ] 数据库密码已修改
- [ ] JWT 密钥已设置为随机字符串
- [ ] 生产环境禁用调试模式
- [ ] 文件上传限制已配置

### 网络安全
- [ ] 防火墙规则已配置
- [ ] 仅开放必要端口
- [ ] SSL 证书已配置（如需要）

### 数据安全
- [ ] 数据目录权限正确
- [ ] 备份策略已实施
- [ ] 日志轮转已配置

## 维护计划

### 定期任务
- [ ] 每日数据备份
- [ ] 每周日志清理
- [ ] 每月安全更新
- [ ] 季度性能优化

### 监控告警
- [ ] 磁盘空间监控
- [ ] 服务状态监控
- [ ] 错误日志监控
- [ ] 性能指标监控
