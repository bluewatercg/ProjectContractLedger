# 部署脚本改进总结

## 改进概述

已成功为 `deploy-separated.sh` 添加了以下四个主要功能：

1. ✅ **自动备份功能**
2. ✅ **自动回滚机制**
3. ✅ **可配置的健康检查**
4. ✅ **日志轮转功能**

---

## 1. 自动备份功能

### 新增配置
```bash
BACKUP_DIR="${SCRIPT_DIR}/backups"      # 备份目录
BACKUP_RETENTION_DAYS=7                 # 备份保留天数
```

### 新增函数
- `backup_database()` - 备份 MySQL 数据库
- `backup_uploads()` - 备份上传文件目录
- `create_deployment_snapshot()` - 创建部署快照
- `cleanup_old_backups()` - 清理过期备份

### 功能特点
- 自动压缩备份文件（.gz）
- 按时间戳命名，便于追溯
- 自动清理超过保留期的旧备份
- 记录部署快照（容器状态、镜像版本、环境配置）

### 使用方法
```bash
# 自动备份（部署时自动执行）
./deploy-separated.sh --update

# 手动备份
./deploy-separated.sh --backup
```

### 备份文件结构
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

---

## 2. 自动回滚机制

### 新增函数
- `rollback_deployment()` - 执行回滚流程
- `restore_database()` - 恢复数据库备份
- `restore_uploads()` - 恢复上传文件备份

### 功能特点
- 健康检查失败时自动触发回滚
- 恢复最新的数据库和文件备份
- 自动重启服务
- 完整的错误处理和日志记录

### 回滚流程
```
1. 检测服务健康状态失败
   ↓
2. 停止当前服务
   ↓
3. 恢复数据库备份（最新的 .sql.gz）
   ↓
4. 恢复上传文件备份（最新的 .tar.gz）
   ↓
5. 重启服务
   ↓
6. 完成回滚
```

### 使用方法
```bash
# 自动回滚（健康检查失败时自动触发）
# 部署时如果服务启动失败，会自动回滚

# 手动回滚
./deploy-separated.sh --rollback
```

### 集成到部署流程
```bash
# 在 deploy_basic() 和 deploy_proxy() 中
if ! check_services "${COMPOSE_FILE}"; then
    log_error "服务健康检查失败，开始回滚..."
    rollback_deployment
    return 1
fi
```

---

## 3. 可配置的健康检查

### 新增配置
```bash
HEALTH_CHECK_RETRIES=5      # 健康检查重试次数
HEALTH_CHECK_INTERVAL=5     # 健康检查间隔（秒）
```

### 改进内容
- 使用配置变量替代硬编码的重试次数和间隔
- 健康检查失败时返回错误码（return 1）
- 支持自定义超时设置

### 使用场景

**开发环境（快速部署）**
```bash
HEALTH_CHECK_RETRIES=3
HEALTH_CHECK_INTERVAL=3
# 总等待时间: 3 × 3 = 9 秒
```

**生产环境（稳定部署）**
```bash
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=10
# 总等待时间: 10 × 10 = 100 秒
```

### 检查内容
- 后端服务：`curl http://localhost:8080/health`
- 前端服务：`curl http://localhost:8000`
- 失败处理：超过重试次数后触发回滚

---

## 4. 日志轮转功能

### 新增配置
```bash
LOG_MAX_SIZE_MB=100         # 日志文件最大大小（MB）
LOG_RETENTION_DAYS=30       # 日志保留天数
```

### 新增函数
- `rotate_logs()` - 执行日志轮转

### 功能特点
- 自动检测超过大小限制的日志文件
- 轮转后自动压缩（.gz）
- 自动删除过期的旧日志
- 支持手动执行

### 轮转规则
1. 当日志文件 > 100MB 时触发轮转
2. 轮转文件命名：`app.log.20240130_143000.gz`
3. 删除超过 30 天的旧日志文件

### 使用方法
```bash
# 自动轮转（部署时自动执行）
./deploy-separated.sh --update

# 手动轮转
./deploy-separated.sh --rotate-logs

# 定时任务（推荐）
# 每天凌晨 2 点执行
0 2 * * * /opt/projectcontractledger/deploy-separated.sh --rotate-logs
```

---

## 部署流程对比

### 改进前
```
1. 检查环境
2. 拉取镜像
3. 停止服务
4. 启动服务
5. 简单检查
6. 完成
```

### 改进后
```
1. 检查环境
2. 创建备份 ⭐ 新增
   ├── 备份数据库
   ├── 备份上传文件
   └── 创建部署快照
3. 清理旧备份 ⭐ 新增
4. 拉取镜像
5. 停止服务
6. 启动服务
7. 健康检查（可配置） ⭐ 改进
   ├── 后端健康检查
   ├── 前端健康检查
   └── 失败时自动回滚 ⭐ 新增
8. 日志轮转 ⭐ 新增
9. 完成
```

---

## 新增命令

```bash
# 手动备份
./deploy-separated.sh --backup

# 手动回滚
./deploy-separated.sh --rollback

# 日志轮转
./deploy-separated.sh --rotate-logs

# 查看帮助（已更新）
./deploy-separated.sh --help
```

---

## 验证方法

### 方法 1: 查看帮助信息
```bash
./deploy-separated.sh --help
```
应该看到新增的 `--backup`、`--rollback`、`--rotate-logs` 选项。

### 方法 2: 运行验证脚本
```bash
chmod +x verify-features.sh
./verify-features.sh
```

### 方法 3: 手动检查
```bash
# 检查配置变量
grep "BACKUP_DIR\|HEALTH_CHECK_RETRIES\|LOG_MAX_SIZE_MB" deploy-separated.sh

# 检查新增函数
grep "^backup_database\|^rollback_deployment\|^rotate_logs" deploy-separated.sh

# 检查命令选项
grep "\-\-backup)\|\-\-rollback)\|\-\-rotate-logs)" deploy-separated.sh
```

---

## 推荐的定时任务

在服务器上设置 cron 任务：

```bash
# 编辑 crontab
crontab -e

# 添加以下任务
# 每天凌晨 1 点创建备份
0 1 * * * /opt/projectcontractledger/deploy-separated.sh --backup

# 每天凌晨 2 点执行日志轮转
0 2 * * * /opt/projectcontractledger/deploy-separated.sh --rotate-logs

# 每周日凌晨 3 点清理旧镜像
0 3 * * 0 /opt/projectcontractledger/deploy-separated.sh --cleanup
```

---

## 文件清单

### 修改的文件
- `deploy-separated.sh` - 主部署脚本（已添加所有新功能）

### 新增的文件
- `DEPLOYMENT_GUIDE.md` - 完整的部署指南
- `verify-features.sh` - 快速验证脚本
- `test-deploy-features.sh` - 详细测试脚本
- `IMPROVEMENTS_SUMMARY.md` - 本文档

---

## 配置参数参考

| 参数 | 默认值 | 说明 | 推荐值 |
|------|--------|------|--------|
| `BACKUP_RETENTION_DAYS` | 7 | 备份保留天数 | 生产: 30, 开发: 7 |
| `HEALTH_CHECK_RETRIES` | 5 | 健康检查重试次数 | 生产: 10, 开发: 3 |
| `HEALTH_CHECK_INTERVAL` | 5 | 健康检查间隔（秒） | 生产: 10, 开发: 3 |
| `LOG_MAX_SIZE_MB` | 100 | 日志文件最大大小 | 根据磁盘空间调整 |
| `LOG_RETENTION_DAYS` | 30 | 日志保留天数 | 根据需求调整 |

---

## 注意事项

1. **首次使用前**
   - 确保有足够的磁盘空间存储备份
   - 测试备份和恢复功能
   - 验证数据库凭据正确

2. **生产环境部署**
   - 在非高峰时段部署
   - 提前通知用户
   - 准备好回滚计划

3. **备份管理**
   - 定期检查备份文件完整性
   - 考虑将备份复制到远程存储
   - 测试恢复流程

4. **监控建议**
   - 监控备份目录磁盘使用率
   - 设置备份失败告警
   - 记录部署和回滚事件

---

## 故障排查

### 备份失败
```bash
# 检查数据库容器
docker ps | grep db

# 检查备份目录权限
ls -la backups/

# 手动测试备份
./deploy-separated.sh --backup
```

### 回滚失败
```bash
# 检查备份文件
ls -la backups/database/
ls -la backups/uploads/

# 查看详细日志
./deploy-separated.sh --rollback 2>&1 | tee rollback.log
```

### 健康检查超时
```bash
# 增加重试次数和间隔
# 编辑 deploy-separated.sh
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=10

# 检查服务日志
docker logs contract-ledger-backend
docker logs contract-ledger-frontend
```

---

## 总结

所有四个改进功能已成功实现并集成到部署脚本中：

✅ **备份功能** - 自动备份数据库和文件，支持手动备份
✅ **回滚机制** - 健康检查失败时自动回滚，支持手动回滚
✅ **健康检查** - 可配置的重试次数和间隔，失败时返回错误码
✅ **日志轮转** - 自动管理日志文件大小和保留期限

这些改进大大提高了部署的可靠性和可维护性，适合生产环境使用。
