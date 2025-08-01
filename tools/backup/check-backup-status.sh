#!/bin/bash

# 检查备份状态脚本
# 查看备份历史、状态和磁盘使用情况

set -e

BACKUP_BASE_DIR="/opt/projectcontractledger/backups"
LOG_DIR="/opt/projectcontractledger/backup_logs"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📊 备份状态检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 检查时间: $(date)"

# 1. 检查备份目录
echo ""
echo "📁 备份目录状态:"
if [ -d "$BACKUP_BASE_DIR" ]; then
    echo "✅ 备份目录存在: $BACKUP_BASE_DIR"
    
    # 显示目录权限
    ls -ld "$BACKUP_BASE_DIR" | awk '{print "   权限: " $1 "  所有者: " $3 ":" $4}'
    
    # 显示磁盘使用情况
    echo "💾 磁盘使用情况:"
    df -h "$BACKUP_BASE_DIR" | tail -1 | awk '{print "   总空间: " $2 "  已使用: " $3 "  可用: " $4 "  使用率: " $5}'
    
    # 显示备份目录大小
    BACKUP_SIZE=$(du -sh "$BACKUP_BASE_DIR" 2>/dev/null | cut -f1)
    echo "   备份总大小: $BACKUP_SIZE"
else
    echo "❌ 备份目录不存在: $BACKUP_BASE_DIR"
    echo "   建议运行: sudo mkdir -p $BACKUP_BASE_DIR"
fi

# 2. 检查备份文件
echo ""
echo "📦 备份文件列表:"
if [ -d "$BACKUP_BASE_DIR" ]; then
    BACKUP_FILES=$(ls -1 "$BACKUP_BASE_DIR"/backup_*.tar.gz 2>/dev/null | wc -l)
    
    if [ "$BACKUP_FILES" -gt 0 ]; then
        echo "✅ 找到 $BACKUP_FILES 个备份文件"
        echo ""
        echo "📋 最近的备份文件:"
        ls -lht "$BACKUP_BASE_DIR"/backup_*.tar.gz 2>/dev/null | head -10 | while read line; do
            filename=$(echo "$line" | awk '{print $9}')
            size=$(echo "$line" | awk '{print $5}')
            date=$(echo "$line" | awk '{print $6, $7, $8}')
            basename_file=$(basename "$filename")
            echo "   $basename_file  ($size, $date)"
        done
        
        # 显示最新和最旧的备份
        echo ""
        NEWEST=$(ls -t "$BACKUP_BASE_DIR"/backup_*.tar.gz 2>/dev/null | head -1)
        OLDEST=$(ls -t "$BACKUP_BASE_DIR"/backup_*.tar.gz 2>/dev/null | tail -1)
        
        if [ -n "$NEWEST" ]; then
            NEWEST_DATE=$(stat -c %y "$NEWEST" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1)
            echo "🆕 最新备份: $(basename "$NEWEST") ($NEWEST_DATE)"
        fi
        
        if [ -n "$OLDEST" ] && [ "$OLDEST" != "$NEWEST" ]; then
            OLDEST_DATE=$(stat -c %y "$OLDEST" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1)
            echo "📅 最旧备份: $(basename "$OLDEST") ($OLDEST_DATE)"
        fi
    else
        echo "⚠️  未找到备份文件"
        echo "   建议运行: ./backup-system.sh"
    fi
else
    echo "❌ 无法检查备份文件 (目录不存在)"
fi

# 3. 检查自动备份任务
echo ""
echo "⏰ 自动备份任务:"
CRON_JOBS=$(crontab -l 2>/dev/null | grep -E "backup-system\.sh|合同管理系统备份" || echo "")

if [ -n "$CRON_JOBS" ]; then
    echo "✅ 找到自动备份任务:"
    echo "$CRON_JOBS" | while read line; do
        if [[ $line == \#* ]]; then
            echo "   📝 $line"
        else
            echo "   ⏰ $line"
        fi
    done
else
    echo "⚠️  未设置自动备份任务"
    echo "   建议运行: ./setup-auto-backup.sh"
fi

# 4. 检查备份日志
echo ""
echo "📋 备份日志状态:"
if [ -f "$LOG_DIR/backup.log" ]; then
    echo "✅ 备份日志存在: $LOG_DIR/backup.log"
    
    # 显示日志大小
    LOG_SIZE=$(ls -lh "$LOG_DIR/backup.log" | awk '{print $5}')
    echo "   日志大小: $LOG_SIZE"
    
    # 显示最近的日志条目
    echo ""
    echo "📄 最近的备份日志 (最后10行):"
    tail -10 "$LOG_DIR/backup.log" 2>/dev/null | sed 's/^/   /' || echo "   无法读取日志内容"
    
    # 检查最近的备份是否成功
    echo ""
    if tail -20 "$LOG_DIR/backup.log" 2>/dev/null | grep -q "✅ 系统备份完成"; then
        LAST_SUCCESS=$(tail -100 "$LOG_DIR/backup.log" 2>/dev/null | grep "✅ 系统备份完成" | tail -1)
        echo "✅ 最近备份状态: 成功"
        echo "   $LAST_SUCCESS" | sed 's/^/   /'
    else
        echo "⚠️  最近备份状态: 可能失败或未完成"
    fi
else
    echo "⚠️  备份日志不存在: $LOG_DIR/backup.log"
    echo "   这可能表示还未执行过自动备份"
fi

# 5. 检查数据库连接
echo ""
echo "🗄️  数据库连接检查:"
ENV_FILE="$SCRIPT_DIR/deployment/.env"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
    
    if command -v mysqladmin >/dev/null 2>&1; then
        if mysqladmin -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" ping &>/dev/null; then
            echo "✅ 数据库连接正常"
            echo "   主机: $DB_HOST:$DB_PORT"
            echo "   数据库: $DB_DATABASE"
            
            # 获取数据库大小
            DB_SIZE=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" -e "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'DB Size (MB)' FROM information_schema.tables WHERE table_schema='$DB_DATABASE';" 2>/dev/null | tail -1)
            if [ -n "$DB_SIZE" ] && [ "$DB_SIZE" != "NULL" ]; then
                echo "   数据库大小: ${DB_SIZE} MB"
            fi
        else
            echo "❌ 数据库连接失败"
            echo "   请检查数据库配置和网络连接"
        fi
    else
        echo "⚠️  未安装 mysql 客户端，无法检查数据库连接"
        echo "   安装命令: sudo apt-get install mysql-client"
    fi
else
    echo "❌ 未找到配置文件: $ENV_FILE"
fi

# 6. 检查附件目录
echo ""
echo "📎 附件目录检查:"
UPLOADS_DIR="/opt/projectcontractledger/backend_uploads"

if [ -d "$UPLOADS_DIR" ]; then
    echo "✅ 附件目录存在: $UPLOADS_DIR"
    
    # 统计文件数量
    FILE_COUNT=$(sudo find "$UPLOADS_DIR" -type f 2>/dev/null | wc -l)
    echo "   文件数量: $FILE_COUNT"
    
    # 计算目录大小
    UPLOADS_SIZE=$(sudo du -sh "$UPLOADS_DIR" 2>/dev/null | cut -f1)
    echo "   目录大小: $UPLOADS_SIZE"
    
    # 显示子目录结构
    echo "   子目录结构:"
    sudo find "$UPLOADS_DIR" -type d -maxdepth 2 2>/dev/null | head -10 | sed 's/^/     /' || echo "     无法访问子目录"
else
    echo "❌ 附件目录不存在: $UPLOADS_DIR"
    echo "   建议检查Docker卷挂载配置"
fi

# 7. 系统资源检查
echo ""
echo "💻 系统资源状态:"
echo "   CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "   内存使用: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')"
echo "   负载平均: $(uptime | awk -F'load average:' '{print $2}')"

# 8. Docker容器状态
echo ""
echo "🐳 Docker容器状态:"
if command -v docker >/dev/null 2>&1; then
    if docker ps | grep -q "contract-ledger-backend"; then
        echo "✅ 后端容器运行中"
        CONTAINER_STATUS=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep contract-ledger)
        echo "$CONTAINER_STATUS" | sed 's/^/   /'
    else
        echo "⚠️  后端容器未运行"
        echo "   建议检查: docker ps -a | grep contract-ledger"
    fi
else
    echo "⚠️  Docker未安装或无权限访问"
fi

# 9. 备份建议
echo ""
echo "💡 备份建议:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 根据检查结果给出建议
if [ "$BACKUP_FILES" -eq 0 ]; then
    echo "🔴 立即执行首次备份: ./backup-system.sh"
fi

if [ -z "$CRON_JOBS" ]; then
    echo "🟡 设置自动备份任务: ./setup-auto-backup.sh"
fi

if [ ! -f "$LOG_DIR/backup.log" ]; then
    echo "🟡 创建日志目录: sudo mkdir -p $LOG_DIR"
fi

# 检查备份频率建议
if [ "$BACKUP_FILES" -gt 0 ]; then
    NEWEST_BACKUP=$(ls -t "$BACKUP_BASE_DIR"/backup_*.tar.gz 2>/dev/null | head -1)
    if [ -n "$NEWEST_BACKUP" ]; then
        DAYS_OLD=$(( ($(date +%s) - $(stat -c %Y "$NEWEST_BACKUP")) / 86400 ))
        if [ "$DAYS_OLD" -gt 7 ]; then
            echo "🟡 最新备份已超过 $DAYS_OLD 天，建议执行新备份"
        elif [ "$DAYS_OLD" -gt 1 ]; then
            echo "🟢 最新备份 $DAYS_OLD 天前，状态良好"
        else
            echo "🟢 备份很新，状态良好"
        fi
    fi
fi

# 磁盘空间建议
DISK_USAGE=$(df "$BACKUP_BASE_DIR" 2>/dev/null | tail -1 | awk '{print $5}' | sed 's/%//')
if [ -n "$DISK_USAGE" ] && [ "$DISK_USAGE" -gt 80 ]; then
    echo "🔴 磁盘使用率过高 ($DISK_USAGE%)，建议清理旧备份"
elif [ -n "$DISK_USAGE" ] && [ "$DISK_USAGE" -gt 60 ]; then
    echo "🟡 磁盘使用率较高 ($DISK_USAGE%)，注意监控空间"
fi

echo ""
echo "✅ 备份状态检查完成！"