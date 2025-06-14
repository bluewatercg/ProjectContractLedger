# 部署目录说明

## 目录结构

```
deployment/
├── README.md                           # 本说明文件
├── docker-compose.production.yml      # 生产环境完整配置（包含数据库、监控等）
├── docker-compose.simple.yml          # 简化配置（仅应用，使用外部服务）
├── deploy.sh                          # 主要部署脚本（功能完整）
└── deploy-production.sh               # 生产环境部署脚本（简化版）
```

**注意**: 环境配置模板和文档已移至项目根目录和docs目录：
- `.env.production.template` → 项目根目录
- 构建和配置文档 → `docs/deployment/` 目录

## 文件用途说明

### Docker Compose配置

#### docker-compose.production.yml
- **用途**: 完整的生产环境配置
- **包含**: 应用、数据库、Redis、监控、日志等完整服务栈
- **适用场景**: 全新部署，需要完整的基础设施

#### docker-compose.simple.yml
- **用途**: 简化的应用配置
- **包含**: 仅应用容器
- **适用场景**: 使用外部MySQL和Redis服务器的部署

### 部署脚本

#### deploy.sh
- **用途**: 主要部署脚本，功能最完整
- **功能**: 初始化、部署、更新、备份、恢复、监控
- **推荐**: 生产环境使用

#### deploy-production.sh
- **用途**: 简化的生产环境部署脚本
- **功能**: 基本的部署和健康检查
- **适用**: 快速部署场景

### 配置文件

#### .env.production.template
- **用途**: 环境变量配置模板
- **使用**: 复制为 `.env` 并填写实际配置值

### 文档

#### docker-build-guide.md
- **用途**: 完整的Docker镜像构建指南
- **内容**: 构建命令、环境要求、故障排除

#### dockerfile-configuration.md
- **用途**: Dockerfile配置详解
- **内容**: 多阶段构建、安全配置、优化技巧

#### build-checklist.md
- **用途**: 构建和部署检查清单
- **内容**: 质量保证流程、验证步骤

## 使用建议

### 场景1: 使用外部MySQL和Redis（推荐）
```bash
# 1. 复制环境配置
cp .env.production.template .env
# 编辑 .env 文件，填写数据库和Redis配置

# 2. 使用简化配置部署
docker-compose -f docker-compose.simple.yml up -d

# 或使用部署脚本
./deploy-production.sh
```

### 场景2: 完整基础设施部署
```bash
# 1. 复制环境配置
cp .env.production.template .env.production
# 编辑配置文件

# 2. 使用完整部署脚本
./deploy.sh --init
./deploy.sh --deploy
```

### 场景3: 快速测试部署
```bash
# 直接使用Docker命令
docker run -d --name contract-ledger \
  -p 8000:80 -p 8080:8080 \
  -e DB_HOST=your_db_host \
  -e REDIS_HOST=your_redis_host \
  ghcr.milu.moe/bluewatercg/projectcontractledger:latest
```

## 清理说明

### 已删除的文件
以下文件已被删除，因为它们是重复的或过时的：

#### 临时修复文档（已过时）
- `api-config-fix-summary.md` - API配置修复总结
- `dockerignore-fix-summary.md` - .dockerignore修复总结
- `production-deployment-adjustments.md` - 生产环境调整说明

#### 重复的中文文档
- `反向代理部署指南.md` - 与英文文档重复
- `外部服务器部署指南.md` - 与英文文档重复
- `生产环境部署说明.md` - 与英文文档重复

#### 重复的Docker Compose文件
- `docker-compose.app-only.yml` - 与simple版本重复
- `docker-compose.external-mysql.yml` - 与simple版本重复
- `docker-compose.external-services.yml` - 与simple版本功能重复

#### 重复的部署脚本
- `deploy-app-only.sh` - 功能被主脚本包含
- `deploy-external.sh` - 功能被主脚本包含

#### 过时的指南文档
- `external-services-deployment-guide.md` - 信息已整合到其他文档

### 保留原则
- **功能完整性**: 保留功能最完整的版本
- **维护性**: 保留最容易维护的版本
- **实用性**: 保留最常用的配置
- **文档质量**: 保留最详细和准确的文档

## 维护建议

1. **定期更新**: 保持环境配置和文档的时效性
2. **版本控制**: 重要配置变更要有版本记录
3. **测试验证**: 配置变更后要进行完整测试
4. **文档同步**: 代码变更时同步更新相关文档

## 相关链接

- [Docker构建指南](./docker-build-guide.md)
- [Dockerfile配置说明](./dockerfile-configuration.md)
- [构建检查清单](./build-checklist.md)
- [项目主文档](../README.md)
