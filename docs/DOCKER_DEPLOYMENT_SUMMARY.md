# Docker 部署配置更新总结

## 🎯 更新概述

本次更新完善了 Docker 部署配置，实现了文件夹映射和系统日志的正确管理，同时添加了完整的附件管理功能。

## 📁 文件夹映射配置

### 开发环境 (docker-compose.yml)
```yaml
volumes:
  # 附件存储目录映射到宿主机
  - ./data/uploads:/app/uploads
  # 应用日志映射到宿主机
  - ./data/logs:/app/logs
```

### 生产环境 (docker-compose.prod.yml)
```yaml
volumes:
  # 应用日志映射到宿主机
  - ./data/logs:/app/logs
  # 附件存储映射到宿主机
  - ./data/uploads:/app/uploads
```

## 🗂️ 目录结构

```
tools/docker/
├── data/                           # 数据持久化目录
│   ├── uploads/                   # 附件存储目录
│   │   ├── contracts/             # 合同附件
│   │   └── invoices/              # 发票附件
│   └── logs/                      # 应用日志目录
│       ├── app.log               # 应用日志
│       ├── error.log             # 错误日志
│       └── core.log              # 核心日志
├── docker-compose.yml             # 开发环境配置
├── docker-compose.prod.yml        # 生产环境配置
├── .env.example                   # 环境变量模板
├── start-dev.sh                   # 开发环境启动脚本
├── start-prod.sh                  # 生产环境启动脚本
├── backup.sh                      # 数据备份脚本
├── monitor.sh                     # 系统监控脚本
├── README.md                      # 部署说明文档
└── DEPLOYMENT_CHECKLIST.md        # 部署验证清单
```

## 🚀 快速部署

### 开发环境
```bash
cd tools/docker
./start-dev.sh
```

### 生产环境
```bash
cd tools/docker
cp .env.example .env
# 编辑 .env 文件设置密码和密钥
./start-prod.sh
```

## 📊 系统监控

### 监控脚本
```bash
# 运行系统监控
./monitor.sh

# 查看输出内容：
# 1. Docker 服务状态
# 2. 容器健康状态  
# 3. 资源使用情况
# 4. 磁盘使用情况
# 5. 日志文件状态
# 6. 附件存储状态
# 7. 网络连接状态
# 8. 最近的应用日志
```

## 💾 数据备份

### 备份脚本
```bash
# 运行数据备份
./backup.sh

# 备份内容：
# - 附件文件 (uploads_YYYYMMDD_HHMMSS.tar.gz)
# - 日志文件 (logs_YYYYMMDD_HHMMSS.tar.gz)  
# - 数据库 (database_YYYYMMDD_HHMMSS.sql.gz)
# - 备份清单 (backup_YYYYMMDD_HHMMSS.txt)
```

## 📎 附件管理功能

### 后端功能
- ✅ 合同附件实体和服务
- ✅ 发票附件实体和服务
- ✅ 文件上传控制器
- ✅ 文件下载和预览接口
- ✅ 安全验证和权限控制

### 前端功能
- ✅ 文件上传组件 (支持拖拽)
- ✅ 附件列表组件 (预览、下载、删除)
- ✅ 合同页面集成附件功能
- ✅ 发票页面集成附件功能

### 技术特性
- **支持格式**: PDF、JPG、JPEG、PNG
- **文件大小**: 最大 10MB
- **存储方式**: 本地文件系统
- **安全控制**: 文件类型白名单、大小限制
- **预览功能**: PDF 和图片在线预览

## 🔧 配置优化

### 日志配置
```typescript
// apps/backend/src/config/config.default.ts
midwayLogger: {
  default: {
    level: 'info',
    dir: '/app/logs',
    fileLogName: 'app.log',
    errorLogName: 'error.log',
    maxFiles: '30d',
    maxSize: '100m',
  }
}
```

### 文件上传配置
```typescript
upload: {
  mode: 'file',
  fileSize: '10mb',
  whitelist: ['.pdf', '.jpg', '.jpeg', '.png'],
  tmpdir: '/tmp',
  cleanTimeout: 5 * 60 * 1000,
}
```

## 🛡️ 安全措施

### 文件安全
- 文件类型白名单验证
- 文件大小限制 (10MB)
- 文件名规范化处理
- 路径遍历攻击防护

### 访问控制
- JWT 认证保护
- 文件下载权限验证
- API 接口权限控制

## 📋 部署验证

使用部署验证清单确保部署成功：
```bash
# 查看部署验证清单
cat DEPLOYMENT_CHECKLIST.md
```

### 关键验证点
- [ ] 容器状态正常
- [ ] 网络连接正常
- [ ] 附件上传功能正常
- [ ] 日志文件正常生成
- [ ] 数据持久化正常

## 🔄 维护操作

### 常用命令
```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 清理系统
docker system prune -f
```

### 定期维护
- 每日运行备份脚本
- 每周检查磁盘空间
- 每月清理旧日志文件
- 季度更新 Docker 镜像

## 📞 技术支持

如遇到部署问题，请参考：
1. [Docker 部署说明](./tools/docker/README.md)
2. [部署验证清单](./tools/docker/DEPLOYMENT_CHECKLIST.md)
3. [项目主文档](./README.md)

---

**更新完成时间**: 2025-06-16  
**更新内容**: Docker 部署优化 + 附件管理功能  
**版本**: v2.1.0
