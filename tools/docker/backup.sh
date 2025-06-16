#!/bin/bash

# 数据备份脚本

echo "=== 合同管理系统 - 数据备份 ==="

# 进入脚本所在目录
cd "$(dirname "$0")"

# 设置备份目录
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo "开始备份数据..."

# 1. 备份附件文件
echo "备份附件文件..."
if [ -d "data/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" data/uploads/
    echo "附件备份完成: $BACKUP_DIR/uploads_$DATE.tar.gz"
else
    echo "警告: 附件目录不存在"
fi

# 2. 备份日志文件
echo "备份日志文件..."
if [ -d "data/logs" ]; then
    tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" data/logs/
    echo "日志备份完成: $BACKUP_DIR/logs_$DATE.tar.gz"
else
    echo "警告: 日志目录不存在"
fi

# 3. 备份数据库
echo "备份数据库..."
if docker-compose ps mysql | grep -q "Up"; then
    # 从环境变量或默认值获取数据库配置
    DB_NAME=${DB_DATABASE:-contract_ledger}
    DB_USER=${DB_USERNAME:-contract_user}
    DB_PASS=${DB_PASSWORD:-contract_pass}
    
    # 备份数据库
    docker-compose exec -T mysql mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_DIR/database_$DATE.sql"
    
    if [ $? -eq 0 ]; then
        echo "数据库备份完成: $BACKUP_DIR/database_$DATE.sql"
        # 压缩数据库备份文件
        gzip "$BACKUP_DIR/database_$DATE.sql"
        echo "数据库备份已压缩: $BACKUP_DIR/database_$DATE.sql.gz"
    else
        echo "错误: 数据库备份失败"
    fi
else
    echo "警告: MySQL 容器未运行，跳过数据库备份"
fi

# 4. 创建备份清单
echo "创建备份清单..."
cat > "$BACKUP_DIR/backup_$DATE.txt" << EOF
备份时间: $(date)
备份内容:
- 附件文件: uploads_$DATE.tar.gz
- 日志文件: logs_$DATE.tar.gz
- 数据库: database_$DATE.sql.gz

备份目录: $BACKUP_DIR
EOF

echo "备份清单创建完成: $BACKUP_DIR/backup_$DATE.txt"

# 5. 清理旧备份（保留最近7天）
echo "清理旧备份文件..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.txt" -mtime +7 -delete

echo ""
echo "=== 备份完成 ==="
echo "备份文件位置: $BACKUP_DIR"
echo "备份文件列表:"
ls -la "$BACKUP_DIR"/*$DATE*

# 显示磁盘使用情况
echo ""
echo "磁盘使用情况:"
df -h "$BACKUP_DIR"
