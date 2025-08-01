#!/bin/bash

# 合同管理系统完整备份脚本
# 包括MySQL数据库和附件文件备份

set -e

# 配置信息
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_BASE_DIR="/opt/projectcontractledger/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$BACKUP_BASE_DIR/$DATE"

# 数据库配置 (从.env文件读取)
# 检查多个可能的.env文件位置
if [ -f "$SCRIPT_DIR/.env" ]; then
    ENV_FILE="$SCRIPT_DIR/.env"
elif [ -f "$SCRIPT_DIR/deployment/.env" ]; then
    ENV_FILE="$SCRIPT_DIR/deployment/.env"
elif [ -f "$(pwd)/.env" ]; then
    ENV_FILE="$(pwd)/.env"
else
    echo "❌ 未找到.env文件，请确认文件位置"
    echo "检查的路径:"
    echo "  - $SCRIPT_DIR/.env"
    echo "  - $SCRIPT_DIR/deployment/.env" 
    echo "  - $(pwd)/.env"
    exit 1
fi

echo "📁 使用配置文件: $ENV_FILE"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
else
    echo "❌ 未找到.env文件: $ENV_FILE"
    exit 1
fi

# 附件目录配置
UPLOADS_DIR="/opt/projectcontractledger/backend_uploads"
LOGS_DIR="/opt/projectcontractledger/backend_logs"

# 备份保留天数
RETENTION_DAYS=30

echo "🚀 开始系统备份..."
echo "📅 备份时间: $(date)"
echo "📁 备份目录: $BACKUP_DIR"

# 1. 创建备份目录
echo "📁 创建备份目录..."
sudo mkdir -p "$BACKUP_DIR"
sudo mkdir -p "$BACKUP_DIR/database"
sudo mkdir -p "$BACKUP_DIR/uploads"
sudo mkdir -p "$BACKUP_DIR/logs"
sudo mkdir -p "$BACKUP_DIR/config"

# 2. 备份数据库
echo "🗄️  开始备份数据库..."
DB_BACKUP_FILE="$BACKUP_DIR/database/procontractledger_$DATE.sql"

# 检查数据库连接
echo "🔍 检查数据库连接..."

# 优先使用宿主机的MySQL客户端，如果没有则使用容器内的
if command -v mysqladmin >/dev/null 2>&1; then
    echo "使用宿主机MySQL客户端"
    if mysqladmin -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" ping &>/dev/null; then
        echo "✅ 数据库连接正常"
        USE_CONTAINER_MYSQL=false
    else
        echo "❌ 宿主机数据库连接失败，尝试使用容器内客户端"
        USE_CONTAINER_MYSQL=true
    fi
else
    echo "宿主机未安装MySQL客户端，使用容器内客户端"
    USE_CONTAINER_MYSQL=true
fi

# 如果需要使用容器内MySQL客户端，检查容器状态
if [ "$USE_CONTAINER_MYSQL" = true ]; then
    if ! docker ps | grep -q "contract-ledger-backend"; then
        echo "❌ 后端容器未运行，无法使用容器内MySQL客户端"
        echo "请先启动容器或在宿主机安装MySQL客户端"
        exit 1
    fi
    
    # 测试容器内连接
    if docker exec contract-ledger-backend mysqladmin -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" ping &>/dev/null; then
        echo "✅ 容器内数据库连接正常"
    else
        echo "❌ 容器内数据库连接也失败，请检查配置"
        exit 1
    fi
fi

# 执行数据库备份
echo "💾 导出数据库..."
if [ "$USE_CONTAINER_MYSQL" = true ]; then
    echo "使用容器内MySQL客户端进行备份..."
    docker exec contract-ledger-backend mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --hex-blob \
        --default-character-set=utf8mb4 \
        --column-statistics=0 \
        --set-gtid-purged=OFF \
        "$DB_DATABASE" > "$DB_BACKUP_FILE"
else
    echo "使用宿主机MySQL客户端进行备份..."
    
    # 检查mysqldump版本并决定使用哪些参数
    MYSQLDUMP_VERSION=$(mysqldump --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+' | head -1)
    echo "检测到mysqldump版本: $MYSQLDUMP_VERSION"
    
    # 基础参数（所有版本都支持）
    MYSQLDUMP_ARGS="-h$DB_HOST -P$DB_PORT -u$DB_USERNAME -p$DB_PASSWORD"
    MYSQLDUMP_ARGS="$MYSQLDUMP_ARGS --single-transaction"
    MYSQLDUMP_ARGS="$MYSQLDUMP_ARGS --routines"
    MYSQLDUMP_ARGS="$MYSQLDUMP_ARGS --triggers"
    MYSQLDUMP_ARGS="$MYSQLDUMP_ARGS --events"
    MYSQLDUMP_ARGS="$MYSQLDUMP_ARGS --hex-blob"
    MYSQLDUMP_ARGS="$MYSQLDUMP_ARGS --default-character-set=utf8mb4"
    
    # 检查是否支持MySQL 8的新参数
    if mysqldump --help 2>/dev/null | grep -q "column-statistics"; then
        echo "支持column-statistics参数"
        MYSQLDUMP_ARGS="$MYSQLDUMP_ARGS --column-statistics=0"
    else
        echo "不支持column-statistics参数，跳过"
    fi
    
    if mysqldump --help 2>/dev/null | grep -q "set-gtid-purged"; then
        echo "支持set-gtid-purged参数"
        MYSQLDUMP_ARGS="$MYSQLDUMP_ARGS --set-gtid-purged=OFF"
    else
        echo "不支持set-gtid-purged参数，跳过"
    fi
    
    # 执行备份
    echo "执行备份命令: mysqldump $MYSQLDUMP_ARGS $DB_DATABASE"
    mysqldump $MYSQLDUMP_ARGS "$DB_DATABASE" > "$DB_BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo "✅ 数据库备份完成: $DB_BACKUP_FILE"
    # 压缩数据库备份
    gzip "$DB_BACKUP_FILE"
    echo "✅ 数据库备份已压缩: ${DB_BACKUP_FILE}.gz"
else
    echo "❌ 数据库备份失败"
    exit 1
fi

# 3. 备份附件文件
echo "📎 开始备份附件文件..."
if [ -d "$UPLOADS_DIR" ]; then
    echo "📂 备份上传文件: $UPLOADS_DIR"
    sudo cp -r "$UPLOADS_DIR"/* "$BACKUP_DIR/uploads/" 2>/dev/null || echo "⚠️  上传目录为空或无权限"
    
    # 统计文件数量
    UPLOAD_COUNT=$(sudo find "$UPLOADS_DIR" -type f 2>/dev/null | wc -l)
    echo "📊 备份文件数量: $UPLOAD_COUNT"
else
    echo "⚠️  上传目录不存在: $UPLOADS_DIR"
fi

# 4. 备份日志文件 (可选)
echo "📋 备份日志文件..."
if [ -d "$LOGS_DIR" ]; then
    echo "📂 备份日志文件: $LOGS_DIR"
    sudo cp -r "$LOGS_DIR"/* "$BACKUP_DIR/logs/" 2>/dev/null || echo "⚠️  日志目录为空或无权限"
else
    echo "⚠️  日志目录不存在: $LOGS_DIR"
fi

# 5. 备份配置文件
echo "⚙️  备份配置文件..."
if [ -f "$ENV_FILE" ]; then
    sudo cp "$ENV_FILE" "$BACKUP_DIR/config/.env"
    echo "✅ 已备份.env配置文件"
fi

# 备份docker-compose文件
if [ -f "$SCRIPT_DIR/deployment/docker-compose.yml" ]; then
    sudo cp "$SCRIPT_DIR/deployment/docker-compose.yml" "$BACKUP_DIR/config/"
    echo "✅ 已备份docker-compose.yml"
fi

if [ -f "$SCRIPT_DIR/deployment/docker-compose.separated.yml" ]; then
    sudo cp "$SCRIPT_DIR/deployment/docker-compose.separated.yml" "$BACKUP_DIR/config/"
    echo "✅ 已备份docker-compose.separated.yml"
fi

# 6. 创建备份信息文件
echo "📝 创建备份信息文件..."
cat > "$BACKUP_DIR/backup_info.txt" << EOF
备份信息
========
备份时间: $(date)
备份版本: $DATE
数据库主机: $DB_HOST:$DB_PORT
数据库名称: $DB_DATABASE
上传目录: $UPLOADS_DIR
日志目录: $LOGS_DIR

备份内容:
- 数据库: procontractledger_$DATE.sql.gz
- 附件文件: uploads/
- 日志文件: logs/
- 配置文件: config/

恢复说明:
1. 恢复数据库: gunzip -c database/procontractledger_$DATE.sql.gz | mysql -h[HOST] -u[USER] -p[PASSWORD] [DATABASE]
2. 恢复附件: sudo cp -r uploads/* /opt/projectcontractledger/backend_uploads/
3. 恢复配置: cp config/.env deployment/
EOF

sudo chown -R $USER:$USER "$BACKUP_DIR/backup_info.txt"

# 7. 生成恢复脚本
echo "�️ 生成恢复脚本..."
RESTORE_SCRIPT="$BACKUP_BASE_DIR/restore_backup_$DATE.sh"

cat > "$RESTORE_SCRIPT" << 'EOF'
#!/bin/bash

# 自动生成的恢复脚本
# 备份时间: BACKUP_TIME_PLACEHOLDER
# 备份版本: BACKUP_DATE_PLACEHOLDER

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_FILE="backup_BACKUP_DATE_PLACEHOLDER.tar.gz"
BACKUP_PATH="$SCRIPT_DIR/$BACKUP_FILE"
RESTORE_DIR="/tmp/restore_BACKUP_DATE_PLACEHOLDER"

# 数据库配置 - 从.env文件读取
ENV_FILE_PATH="ENV_FILE_PLACEHOLDER"
if [ -f "$ENV_FILE_PATH" ]; then
    source "$ENV_FILE_PATH"
    echo "📁 使用配置文件: $ENV_FILE_PATH"
else
    echo "❌ 未找到.env文件: $ENV_FILE_PATH"
    echo "请确保.env文件存在并包含数据库配置"
    exit 1
fi

echo "🔄 开始系统恢复..."
echo "📅 恢复时间: $(date)"
echo "📁 备份文件: $BACKUP_PATH"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_PATH" ]; then
    echo "❌ 备份文件不存在: $BACKUP_PATH"
    exit 1
fi

# 确认恢复操作
echo ""
echo "⚠️  警告: 此操作将覆盖现有数据！"
echo "📊 将要恢复的数据:"
echo "   数据库: $DB_HOST:$DB_PORT/$DB_DATABASE"
echo "   附件目录: UPLOADS_DIR_PLACEHOLDER"
echo ""
read -p "确认要继续恢复吗? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 恢复操作已取消"
    exit 1
fi

# 解压备份文件
echo "📦 解压备份文件..."
mkdir -p "$RESTORE_DIR"
cd "$RESTORE_DIR"
tar -xzf "$BACKUP_PATH"

EXTRACTED_DIR="$RESTORE_DIR/BACKUP_DATE_PLACEHOLDER"
if [ ! -d "$EXTRACTED_DIR" ]; then
    echo "❌ 解压失败或目录结构异常"
    exit 1
fi

echo "✅ 备份文件解压完成"

# 备份当前数据 (安全措施)
echo "🛡️  备份当前数据..."
CURRENT_BACKUP_DIR="/tmp/current_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$CURRENT_BACKUP_DIR"

# 备份当前数据库
echo "💾 备份当前数据库..."
if command -v mysqldump >/dev/null 2>&1; then
    mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" \
        --single-transaction "$DB_DATABASE" > "$CURRENT_BACKUP_DIR/current_database.sql" 2>/dev/null || echo "⚠️  当前数据库备份失败"
else
    echo "⚠️  未安装mysqldump，跳过当前数据库备份"
fi

# 备份当前附件
UPLOADS_DIR_VALUE="UPLOADS_DIR_PLACEHOLDER"
if [ -d "$UPLOADS_DIR_VALUE" ]; then
    echo "📎 备份当前附件..."
    sudo cp -r "$UPLOADS_DIR_VALUE" "$CURRENT_BACKUP_DIR/uploads" 2>/dev/null || echo "⚠️  当前附件备份失败"
fi

echo "✅ 当前数据已备份到: $CURRENT_BACKUP_DIR"

# 恢复数据库
echo "🗄️  开始恢复数据库..."
DB_RESTORE_FILE="$EXTRACTED_DIR/database/procontractledger_BACKUP_DATE_PLACEHOLDER.sql.gz"

if [ -f "$DB_RESTORE_FILE" ]; then
    echo "📂 找到数据库备份: $DB_RESTORE_FILE"
    
    # 检查数据库连接
    if command -v mysql >/dev/null 2>&1; then
        if mysqladmin -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" ping &>/dev/null; then
            echo "✅ 数据库连接正常"
            
            # 恢复数据库
            echo "🔄 恢复数据库中..."
            gunzip -c "$DB_RESTORE_FILE" | mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE"
            
            if [ $? -eq 0 ]; then
                echo "✅ 数据库恢复完成"
            else
                echo "❌ 数据库恢复失败"
                exit 1
            fi
        else
            echo "❌ 数据库连接失败"
            exit 1
        fi
    else
        echo "❌ 未安装mysql客户端"
        exit 1
    fi
else
    echo "⚠️  未找到数据库备份文件"
fi

# 恢复附件文件
echo "📎 开始恢复附件文件..."
UPLOADS_RESTORE_DIR="$EXTRACTED_DIR/uploads"

if [ -d "$UPLOADS_RESTORE_DIR" ]; then
    echo "📂 找到附件备份: $UPLOADS_RESTORE_DIR"
    
    # 创建目标目录
    sudo mkdir -p "UPLOADS_DIR_PLACEHOLDER"
    
    # 清空现有附件 (可选)
    read -p "是否清空现有附件目录? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo rm -rf "UPLOADS_DIR_PLACEHOLDER"/*
        echo "🗑️  已清空现有附件"
    fi
    
    # 恢复附件
    echo "🔄 恢复附件中..."
    sudo cp -r "$UPLOADS_RESTORE_DIR"/* "UPLOADS_DIR_PLACEHOLDER/" 2>/dev/null || echo "⚠️  部分附件恢复失败"
    
    # 设置权限
    sudo chmod -R 777 "UPLOADS_DIR_PLACEHOLDER"
    
    # 统计恢复的文件
    RESTORED_COUNT=$(sudo find "UPLOADS_DIR_PLACEHOLDER" -type f 2>/dev/null | wc -l)
    echo "✅ 附件恢复完成，共恢复 $RESTORED_COUNT 个文件"
else
    echo "⚠️  未找到附件备份目录"
fi

# 恢复配置文件 (可选)
echo "⚙️  恢复配置文件..."
CONFIG_RESTORE_DIR="$EXTRACTED_DIR/config"

if [ -d "$CONFIG_RESTORE_DIR" ]; then
    echo "📂 找到配置备份: $CONFIG_RESTORE_DIR"
    
    read -p "是否恢复配置文件? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "$CONFIG_RESTORE_DIR/.env" ]; then
            # 备份当前配置
            if [ -f "ENV_FILE_PLACEHOLDER" ]; then
                cp "ENV_FILE_PLACEHOLDER" "ENV_FILE_PLACEHOLDER.backup.$(date +%Y%m%d_%H%M%S)"
                echo "✅ 当前配置已备份"
            fi
            
            cp "$CONFIG_RESTORE_DIR/.env" "ENV_FILE_PLACEHOLDER"
            echo "✅ 配置文件已恢复"
        fi
    fi
fi

# 清理临时文件
echo "🧹 清理临时文件..."
rm -rf "$RESTORE_DIR"
echo "✅ 临时文件已清理"

# 显示恢复统计
echo ""
echo "📊 恢复完成统计:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 恢复时间: $(date)"
echo "📁 备份文件: $BACKUP_FILE"
echo "🗄️  数据库: $([ -f "$DB_RESTORE_FILE" ] && echo '已恢复' || echo '未恢复')"
echo "📎 附件文件: $([ -d "$UPLOADS_RESTORE_DIR" ] && echo "已恢复 $RESTORED_COUNT 个文件" || echo '未恢复')"
echo "🛡️  当前数据备份: $CURRENT_BACKUP_DIR"

echo ""
echo "✅ 系统恢复完成！"
echo ""
echo "🔧 后续操作建议:"
echo "1. 检查应用功能是否正常"
echo "2. 验证数据完整性"
echo "3. 测试文件上传下载功能"
echo "4. 如有问题，可从以下位置恢复原数据:"
echo "   $CURRENT_BACKUP_DIR"
EOF

# 替换占位符 - 只替换非敏感信息
sed -i "s/BACKUP_TIME_PLACEHOLDER/$(date)/g" "$RESTORE_SCRIPT"
sed -i "s/BACKUP_DATE_PLACEHOLDER/$DATE/g" "$RESTORE_SCRIPT"
sed -i "s|UPLOADS_DIR_PLACEHOLDER|$UPLOADS_DIR|g" "$RESTORE_SCRIPT"
sed -i "s|ENV_FILE_PLACEHOLDER|$ENV_FILE|g" "$RESTORE_SCRIPT"

# 设置执行权限
chmod +x "$RESTORE_SCRIPT"
sudo chown $USER:$USER "$RESTORE_SCRIPT"

echo "✅ 恢复脚本已生成: $RESTORE_SCRIPT"

# 8. 压缩整个备份
echo "🗜️  压缩备份文件..."
cd "$BACKUP_BASE_DIR"
sudo tar -czf "backup_$DATE.tar.gz" "$DATE/"
if [ $? -eq 0 ]; then
    echo "✅ 备份压缩完成: backup_$DATE.tar.gz"
    # 删除未压缩的目录以节省空间
    sudo rm -rf "$DATE/"
    echo "🗑️  已清理临时文件"
else
    echo "❌ 备份压缩失败"
fi

# 8. 清理旧备份
echo "🧹 清理旧备份文件..."
find "$BACKUP_BASE_DIR" -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
echo "✅ 已清理 $RETENTION_DAYS 天前的备份文件"

# 9. 显示备份统计
echo ""
echo "📊 备份完成统计:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 备份时间: $(date)"
echo "📁 备份位置: $BACKUP_BASE_DIR/backup_$DATE.tar.gz"
echo "💾 数据库大小: $(ls -lh $BACKUP_BASE_DIR/backup_$DATE.tar.gz 2>/dev/null | awk '{print $5}' || echo '未知')"
echo "📊 当前备份数量: $(ls -1 $BACKUP_BASE_DIR/backup_*.tar.gz 2>/dev/null | wc -l)"
echo "🗂️  磁盘使用情况:"
df -h "$BACKUP_BASE_DIR" 2>/dev/null || echo "  无法获取磁盘信息"

echo ""
echo "✅ 系统备份完成！"
echo ""
echo "🔧 备份文件:"
echo "   📦 备份文件: $BACKUP_BASE_DIR/backup_$DATE.tar.gz"
echo "   🔄 恢复脚本: $BACKUP_BASE_DIR/restore_backup_$DATE.sh"
echo ""
echo "📋 一键恢复命令:"
echo "   cd $BACKUP_BASE_DIR && ./restore_backup_$DATE.sh"
echo ""
echo "💡 恢复脚本功能:"
echo "   ✅ 自动解压备份文件"
echo "   ✅ 安全备份当前数据"
echo "   ✅ 恢复数据库和附件"
echo "   ✅ 交互式确认操作"
echo "   ✅ 详细的恢复日志"