# 备份工具

本目录包含系统备份和恢复相关的脚本。

## 📋 脚本说明

### 🔄 备份脚本
- **`backup-system.sh`** - 主备份脚本，备份数据库和附件文件
- **`setup-auto-backup.sh`** - 设置自动备份定时任务
- **`check-backup-status.sh`** - 检查备份状态和历史

### 🔄 恢复脚本
- **`restore-system.sh`** - 通用恢复脚本
- **`restore_backup_YYYYMMDD_HHMMSS.sh`** - 自动生成的特定备份恢复脚本

## 🚀 使用方法

### 手动备份
```bash
cd tools/backup
./backup-system.sh
```

### 设置自动备份
```bash
cd tools/backup
./setup-auto-backup.sh
```

### 检查备份状态
```bash
cd tools/backup
./check-backup-status.sh
```

### 恢复数据
```bash
cd /opt/projectcontractledger/backups
./restore_backup_20250801_165434.sh
```

## 📁 备份内容

- ✅ **MySQL数据库**：完整导出并压缩
- ✅ **附件文件**：`/opt/projectcontractledger/backend_uploads`
- ✅ **日志文件**：`/opt/projectcontractledger/backend_logs`
- ✅ **配置文件**：`.env`和`docker-compose.yml`

## 🎯 备份位置

```
/opt/projectcontractledger/backups/
├── backup_20250801_165434.tar.gz
├── restore_backup_20250801_165434.sh
└── ...
```

## ⚠️ 注意事项

1. **权限要求**：某些操作需要sudo权限
2. **磁盘空间**：确保备份目录有足够空间
3. **数据库连接**：确保能连接到MySQL服务器
4. **安全性**：恢复脚本从.env文件读取配置，不包含敏感信息