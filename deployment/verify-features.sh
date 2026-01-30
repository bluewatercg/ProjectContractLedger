#!/bin/bash

# 快速验证脚本 - 检查新功能是否正确添加

echo "=========================================="
echo "  部署脚本功能快速验证"
echo "=========================================="
echo ""

SCRIPT="./deploy-separated.sh"

# 检查脚本是否存在
if [ ! -f "$SCRIPT" ]; then
    echo "❌ 错误: 找不到 deploy-separated.sh"
    exit 1
fi

echo "✅ 脚本文件存在"
echo ""

# 检查新增的配置变量
echo "检查配置变量:"
grep -q "BACKUP_DIR=" "$SCRIPT" && echo "  ✅ BACKUP_DIR" || echo "  ❌ BACKUP_DIR"
grep -q "BACKUP_RETENTION_DAYS=" "$SCRIPT" && echo "  ✅ BACKUP_RETENTION_DAYS" || echo "  ❌ BACKUP_RETENTION_DAYS"
grep -q "HEALTH_CHECK_RETRIES=" "$SCRIPT" && echo "  ✅ HEALTH_CHECK_RETRIES" || echo "  ❌ HEALTH_CHECK_RETRIES"
grep -q "HEALTH_CHECK_INTERVAL=" "$SCRIPT" && echo "  ✅ HEALTH_CHECK_INTERVAL" || echo "  ❌ HEALTH_CHECK_INTERVAL"
grep -q "LOG_MAX_SIZE_MB=" "$SCRIPT" && echo "  ✅ LOG_MAX_SIZE_MB" || echo "  ❌ LOG_MAX_SIZE_MB"
grep -q "LOG_RETENTION_DAYS=" "$SCRIPT" && echo "  ✅ LOG_RETENTION_DAYS" || echo "  ❌ LOG_RETENTION_DAYS"
echo ""

# 检查新增的函数
echo "检查新增函数:"
grep -q "^backup_database()" "$SCRIPT" && echo "  ✅ backup_database()" || echo "  ❌ backup_database()"
grep -q "^backup_uploads()" "$SCRIPT" && echo "  ✅ backup_uploads()" || echo "  ❌ backup_uploads()"
grep -q "^cleanup_old_backups()" "$SCRIPT" && echo "  ✅ cleanup_old_backups()" || echo "  ❌ cleanup_old_backups()"
grep -q "^create_deployment_snapshot()" "$SCRIPT" && echo "  ✅ create_deployment_snapshot()" || echo "  ❌ create_deployment_snapshot()"
grep -q "^restore_database()" "$SCRIPT" && echo "  ✅ restore_database()" || echo "  ❌ restore_database()"
grep -q "^restore_uploads()" "$SCRIPT" && echo "  ✅ restore_uploads()" || echo "  ❌ restore_uploads()"
grep -q "^rollback_deployment()" "$SCRIPT" && echo "  ✅ rollback_deployment()" || echo "  ❌ rollback_deployment()"
grep -q "^rotate_logs()" "$SCRIPT" && echo "  ✅ rotate_logs()" || echo "  ❌ rotate_logs()"
echo ""

# 检查新增的命令选项
echo "检查命令选项:"
grep -q "\-\-backup)" "$SCRIPT" && echo "  ✅ --backup" || echo "  ❌ --backup"
grep -q "\-\-rollback)" "$SCRIPT" && echo "  ✅ --rollback" || echo "  ❌ --rollback"
grep -q "\-\-rotate-logs)" "$SCRIPT" && echo "  ✅ --rotate-logs" || echo "  ❌ --rotate-logs"
echo ""

# 测试帮助命令
echo "测试帮助命令:"
if bash "$SCRIPT" --help 2>&1 | grep -q "backup"; then
    echo "  ✅ 帮助信息包含新功能说明"
else
    echo "  ❌ 帮助信息缺少新功能说明"
fi
echo ""

echo "=========================================="
echo "  验证完成"
echo "=========================================="
echo ""
echo "可用的新命令:"
echo "  ./deploy-separated.sh --backup       # 手动备份"
echo "  ./deploy-separated.sh --rollback     # 回滚部署"
echo "  ./deploy-separated.sh --rotate-logs  # 日志轮转"
echo ""
