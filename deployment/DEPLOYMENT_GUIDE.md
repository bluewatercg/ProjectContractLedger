# 部署脚本使用指南

## 概述

`deploy-separated.sh` 是一个功能完善的前后端分离部署脚本，支持自动备份、回滚、健康检查和日志管理。

## 新增功能

### 1. 自动备份功能

部署前自动备份数据库和上传文件，确保数据安全。

**特性：**
- 数据库备份：自动导出 MySQL 数据库并压缩
- 文件备份：打包上传目录（contracts、invoices 等）
- 部署快照：记录容器状态、镜像版本和环境配置
- 自动清理：删除超过保留期限的旧备份

**配置参数：**
```bash
BACKUP_DIR="${SCRIPT_DIR}/backups"      # 备份目录
BACKUP_RETENTION_DAYS=7                 # 备份保留天数
```

**备份文件位置：**
```
backups/
├── database/
│   ├── db_backup_20240130_143000.sql.gz
│   └── db_backup_20240129_120000.sql.gz
├── uploads/
│   ├── uploads_backup_20240130_143000.tar.gz
│   └── uploads_backup_20240129_120000.tar.gz
└── snapshots/
    ├── snapshot_20240130_143000.txt
    └── snapshot_20240129_120000.txt
```

**手动备份：**
```bash
./deploy-separated.sh --backup
```

### 2. 自动回滚机制

如果部署后健康检查失败，自动回滚到上一个备份版本。

**回滚流程：**
1. 检测服务健康状态失败
2. 停止当前服务
3. 恢复最新的数据库备份
4. 恢复最新的上传文件备份
5. 重启服务

**手动回滚：**
```bash
./deploy-separated.sh --rollback
```

**注意事项：**
- 回滚会使用最新的备份文件
- 确保备份文件存在且完整
- 回滚后需要验证数据一致性

### 3. 可配置的健康检查

健康检查参数可配置，适应不同的部署环境。

**配置参数：**
```bash
HEALTH_CHECK_RETRIES=5      # 健康检查重试次数
HEALTH_CHECK_INTERVAL=5     # 健康检查间隔（秒）
```

**检查内容：**
- 后端服务：检查 `/health` 端点
- 前端服务：检查根路径响应
- 失败处理：超过重试次数后触发回滚

**自定义配置：**
编辑脚本顶部的配置变量：
```bash
# 快速部署（适合开发环境）
HEALTH_CHECK_RETRIES=3
HEALTH_CHECK_INTERVAL=3

# 稳定部署（适合生产环境）
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=10
```

### 4. 日志轮转功能

自动管理日志文件，防止磁盘空间耗尽。

**配置参数：**
```bash
LOG_MAX_SIZE_MB=100         # 日志文件最大大小（MB）
LOG_RETENTION_DAYS=30       # 日志保留天数
```

**轮转规则：**
- 当日志文件超过 `LOG_MAX_SIZE_MB` 时自动轮转
- 轮转后的文件自动压缩（.gz）
- 删除超过 `LOG_RETENTION_DAYS` 的旧日志

**手动执行日志轮转：**
```bash
./deploy-separated.sh --rotate-logs
```

**日志文件命名：**
```
logs/
├── app.log                          # 当前日志
├── app.log.20240130_143000.gz      # 已轮转的日志
└── app.log.20240129_120000.gz      # 已轮转的日志
```

## 使用方法

### 基础部署
```bash
./deploy-separated.sh
# 或
./deploy-separated.sh --basic
```

### 带代理的部署
```bash
./deploy-separated.sh --proxy
```

### 更新现有部署
```bash
./deploy-separated.sh --update
```

### 停止服务
```bash
./deploy-separated.sh --stop
```

### 查看日志
```bash
./deploy-separated.sh --logs
```

### 查看状态
```bash
./deploy-separated.sh --status
```

### 清理旧镜像
```bash
./deploy-separated.sh --cleanup
```

### 手动备份
```bash
./deploy-separated.sh --backup
```

### 回滚部署
```bash
./deploy-separated.sh --rollback
```

### 日志轮转
```bash
./deploy-separated.sh --rotate-logs
```

## 部署流程

### 完整部署流程（带备份和回滚）

```
1. 环境检查
   ├── 检查 Docker 环境
   ├── 检查环境变量配置
   └── 初始化数据目录

2. 备份阶段
   ├── 备份数据库
   ├── 备份上传文件
   ├── 创建部署快照
   └── 清理旧备份

3. 部署阶段
   ├── 拉取最新镜像
   ├── 清理旧镜像
   ├── 停止现有服务
   └── 启动新服务

4. 验证阶段
   ├── 健康检查（后端）
   ├── 健康检查（前端）
   └── 验证上传权限

5. 维护阶段
   ├── 日志轮转
   └── 显示访问信息

如果验证失败 → 自动回滚到备份
```

## 配置参数说明

在脚本顶部可以修改以下配置：

```bash
# 备份配置
BACKUP_DIR="${SCRIPT_DIR}/backups"      # 备份目录位置
BACKUP_RETENTION_DAYS=7                 # 备份文件保留天数

# 健康检查配置
HEALTH_CHECK_RETRIES=5                  # 健康检查重试次数
HEALTH_CHECK_INTERVAL=5                 # 健康检查间隔（秒）

# 日志配置
LOG_MAX_SIZE_MB=100                     # 日志文件最大大小（MB）
LOG_RETENTION_DAYS=30                   # 日志文件保留天数
```

## 最佳实践

### 生产环境部署建议

1. **部署前准备**
   ```bash
   # 1. 手动创建备份
   ./deploy-separated.sh --backup

   # 2. 检查当前状态
   ./deploy-separated.sh --status

   # 3. 查看最近的日志
   ./deploy-separated.sh --logs
   ```

2. **执行部署**
   ```bash
   # 使用更新模式（自动检测当前部署类型）
   ./deploy-separated.sh --update
   ```

3. **部署后验证**
   ```bash
   # 1. 检查服务状态
   ./deploy-separated.sh --status

   # 2. 测试关键功能
   # - 登录功能
   # - 文件上传
   # - API 调用

   # 3. 查看日志确认无错误
   ./deploy-separated.sh --logs
   ```

4. **如果出现问题**
   ```bash
   # 立即回滚
   ./deploy-separated.sh --rollback
   ```

### 定期维护任务

建议设置 cron 任务定期执行维护：

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点执行日志轮转
0 2 * * * /path/to/deployment/deploy-separated.sh --rotate-logs

# 每周日凌晨 3 点清理旧镜像
0 3 * * 0 /path/to/deployment/deploy-separated.sh --cleanup

# 每天凌晨 1 点创建备份
0 1 * * * /path/to/deployment/deploy-separated.sh --backup
```

## 故障排查

### 备份失败

**问题：** 数据库备份失败
```
[ERROR] 数据库备份失败
```

**解决方案：**
1. 检查数据库容器是否运行：`docker ps | grep db`
2. 检查 `.env` 文件中的数据库凭据
3. 检查备份目录权限：`ls -la backups/`

### 健康检查失败

**问题：** 服务健康检查超时
```
[ERROR] 后端服务健康检查失败
```

**解决方案：**
1. 增加健康检查重试次数和间隔
2. 检查容器日志：`docker logs contract-ledger-backend`
3. 检查端口是否被占用：`netstat -tulpn | grep 8080`

### 回滚失败

**问题：** 回滚时找不到备份文件
```
[ERROR] 未找到备份文件，无法回滚
```

**解决方案：**
1. 检查备份目录：`ls -la backups/database/ backups/uploads/`
2. 如果没有备份，需要手动恢复或重新部署
3. 建议在首次部署后立即创建备份

### 日志轮转问题

**问题：** 日志目录权限不足
```
[WARNING] 日志目录不存在，跳过日志轮转
```

**解决方案：**
1. 检查日志目录是否存在
2. 检查目录权限：`ls -la data/logs/`
3. 手动创建目录：`mkdir -p data/logs && chmod 755 data/logs`

## 安全建议

1. **备份文件安全**
   - 备份文件包含敏感数据，确保目录权限正确
   - 定期将备份文件复制到远程存储
   - 加密重要的备份文件

2. **环境变量保护**
   - 不要将 `.env` 文件提交到版本控制
   - 定期更换数据库密码和 JWT 密钥
   - 使用强密码

3. **日志管理**
   - 确保日志文件不包含敏感信息（密码、token）
   - 定期审查日志文件
   - 使用日志轮转防止磁盘满

## 更新日志

### v2.0.0 (2024-01-30)
- ✨ 新增：自动备份功能（数据库 + 上传文件）
- ✨ 新增：自动回滚机制
- ✨ 新增：可配置的健康检查参数
- ✨ 新增：日志轮转功能
- 🔧 改进：健康检查失败时返回错误码
- 📝 新增：完整的部署指南文档

### v1.0.0
- 基础部署功能
- 代理部署模式
- 镜像清理
- 权限验证
