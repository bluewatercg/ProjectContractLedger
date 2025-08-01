#!/bin/bash

# 设置自动备份任务脚本
# 配置cron定时任务自动执行系统备份

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-system.sh"

echo "⚙️  设置自动备份任务..."

# 检查备份脚本是否存在
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ 备份脚本不存在: $BACKUP_SCRIPT"
    exit 1
fi

# 确保备份脚本有执行权限
chmod +x "$BACKUP_SCRIPT"

# 显示备份选项
echo ""
echo "📋 自动备份选项:"
echo "1. 每日备份 (凌晨2点)"
echo "2. 每周备份 (周日凌晨2点)"
echo "3. 每月备份 (每月1号凌晨2点)"
echo "4. 自定义时间"
echo "5. 查看当前定时任务"
echo "6. 删除自动备份任务"
echo ""

read -p "请选择选项 (1-6): " choice

case $choice in
    1)
        # 每日备份
        CRON_SCHEDULE="0 2 * * *"
        DESCRIPTION="每日凌晨2点备份"
        ;;
    2)
        # 每周备份
        CRON_SCHEDULE="0 2 * * 0"
        DESCRIPTION="每周日凌晨2点备份"
        ;;
    3)
        # 每月备份
        CRON_SCHEDULE="0 2 1 * *"
        DESCRIPTION="每月1号凌晨2点备份"
        ;;
    4)
        # 自定义时间
        echo ""
        echo "📝 自定义备份时间 (cron格式):"
        echo "格式: 分 时 日 月 周"
        echo "示例:"
        echo "  0 2 * * *     (每天凌晨2点)"
        echo "  30 14 * * 1   (每周一下午2:30)"
        echo "  0 3 1,15 * *  (每月1号和15号凌晨3点)"
        echo ""
        read -p "请输入cron时间表达式: " CRON_SCHEDULE
        DESCRIPTION="自定义时间: $CRON_SCHEDULE"
        ;;
    5)
        # 查看当前定时任务
        echo ""
        echo "📋 当前定时任务:"
        crontab -l | grep -E "backup-system\.sh|合同管理系统备份" || echo "  无相关备份任务"
        exit 0
        ;;
    6)
        # 删除自动备份任务
        echo ""
        echo "🗑️  删除自动备份任务..."
        
        # 获取当前crontab
        TEMP_CRON=$(mktemp)
        crontab -l > "$TEMP_CRON" 2>/dev/null || touch "$TEMP_CRON"
        
        # 删除包含backup-system.sh的行
        grep -v "backup-system\.sh" "$TEMP_CRON" > "${TEMP_CRON}.new" || touch "${TEMP_CRON}.new"
        
        # 更新crontab
        crontab "${TEMP_CRON}.new"
        
        # 清理临时文件
        rm -f "$TEMP_CRON" "${TEMP_CRON}.new"
        
        echo "✅ 自动备份任务已删除"
        exit 0
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

# 验证cron表达式格式
if ! echo "$CRON_SCHEDULE" | grep -E '^[0-9*,/-]+ [0-9*,/-]+ [0-9*,/-]+ [0-9*,/-]+ [0-9*,/-]+$' > /dev/null; then
    echo "❌ 无效的cron表达式格式"
    exit 1
fi

echo ""
echo "📅 备份计划: $DESCRIPTION"
echo "⏰ Cron表达式: $CRON_SCHEDULE"
echo "📁 备份脚本: $BACKUP_SCRIPT"

# 确认设置
read -p "确认设置此自动备份任务? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 设置已取消"
    exit 1
fi

# 创建日志目录
LOG_DIR="/opt/projectcontractledger/backup_logs"
sudo mkdir -p "$LOG_DIR"
sudo chmod 755 "$LOG_DIR"

# 获取当前crontab
TEMP_CRON=$(mktemp)
crontab -l > "$TEMP_CRON" 2>/dev/null || touch "$TEMP_CRON"

# 删除旧的备份任务 (如果存在)
grep -v "backup-system\.sh" "$TEMP_CRON" > "${TEMP_CRON}.new" || touch "${TEMP_CRON}.new"

# 添加新的备份任务
echo "# 合同管理系统自动备份 - $DESCRIPTION" >> "${TEMP_CRON}.new"
echo "$CRON_SCHEDULE $BACKUP_SCRIPT >> $LOG_DIR/backup.log 2>&1" >> "${TEMP_CRON}.new"

# 更新crontab
crontab "${TEMP_CRON}.new"

# 清理临时文件
rm -f "$TEMP_CRON" "${TEMP_CRON}.new"

echo ""
echo "✅ 自动备份任务设置完成！"
echo ""
echo "📋 任务详情:"
echo "   计划: $DESCRIPTION"
echo "   表达式: $CRON_SCHEDULE"
echo "   脚本: $BACKUP_SCRIPT"
echo "   日志: $LOG_DIR/backup.log"
echo ""
echo "🔧 管理命令:"
echo "   查看任务: crontab -l"
echo "   查看日志: tail -f $LOG_DIR/backup.log"
echo "   手动备份: $BACKUP_SCRIPT"
echo ""
echo "📊 下次备份时间:"
# 尝试计算下次执行时间 (需要安装at包)
if command -v at >/dev/null 2>&1; then
    echo "   $(echo "$CRON_SCHEDULE $BACKUP_SCRIPT" | at -f - 2>&1 | grep -o '[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\} [0-9]\{2\}:[0-9]\{2\}' || echo '请使用 crontab -l 查看')"
else
    echo "   请使用 crontab -l 查看详细信息"
fi

# 测试备份脚本
echo ""
read -p "是否立即测试备份脚本? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧪 测试备份脚本..."
    "$BACKUP_SCRIPT"
fi

echo ""
echo "🎉 自动备份设置完成！系统将按计划自动备份数据库和附件文件。"