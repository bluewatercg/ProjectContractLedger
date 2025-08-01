#!/bin/bash

# 合同管理系统恢复脚本
# 从备份中恢复MySQL数据库和附件文件

set -e

# 配置信息
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_BASE_DIR="/opt/projectcontractledger/backups"

# 数据库配置 (从.env文件读取)
ENV_FILE="$SCRIPT_DIR/deployment/.env"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
else
    echo "❌ 未找到.env文件: $ENV_FILE"
    exit 1
fi

# 附件目录配置
UPLOADS_DIR="/opt/projectcontractledger/backend_uploads"
LOGS_DIR="/opt/projectcontractledger/backend_logs"

# 显示使用说明
show_usage() {
    echo "使用方法: $0 [备份文件名]"
    echo ""
    echo "参数:"
    echo "  备份文件名    指定要恢复的备份文件 (例如: backup_20241201_143022.tar.gz)"
    echo ""
    echo "示例:"
    echo "  $0 backup_20241201_143022.tar.gz"
    echo ""
    echo "可用备份文件:"
    ls -1 "$BACKUP_BASE_DIR"/backup_*.tar.gz 2>/dev/null | sed 's|.*/||' || echo "  无可用备份文件"
    exit 1
}

# 检查参数
if [ $# -eq 0 ]; then
    show_usage
fi

BACKUP_FILE="$1"
BACKUP_PATH="$BACKUP_BASE_DIR/$BACKUP_FILE"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_PATH" ]; then
    echo "❌ 备份文件不存在: $BACKUP_PATH"
    echo ""
    echo "可用备份文件:"
    ls -1 "$BACKUP_BASE_DIR"/backup_*.tar.gz 2>/dev/null | sed 's|.*/||' || echo "  无可用备份文件"
    exit 1
fi

# 提取备份时间戳
BACKUP_DATE=$(echo "$BACKUP_FILE" | sed 's/backup_\(.*\)\.tar\.gz/\1/')
RESTORE_DIR="/tmp/restore_$BACKUP_DATE"

echo "🔄 开始系统恢复..."
echo "📅 恢复时间: $(date)"
echo "📁 备份文件: $BACKUP_PATH"
echo "📂 临时目录: $RESTORE_DIR"

# 确认恢复操作
echo ""
echo "⚠️  警告: 此操作将覆盖现有数据！"
echo "📊 当前系统信息:"
echo "   数据库: $DB_HOST:$DB_PORT/$DB_DATABASE"
echo "   附件目录: $UPLOADS_DIR"
echo ""
read -p "确认要继续恢复吗? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 恢复操作已取消"
    exit 1
fi

# 1. 解压备份文件
echo "📦 解压备份文件..."
mkdir -p "$RESTORE_DIR"
cd "$RESTORE_DIR"
tar -xzf "$BACKUP_PATH"

if [ $? -eq 0 ]; then
    echo "✅ 备份文件解压完成"
else
    echo "❌ 备份文件解压失败"
    exit 1
fi

# 查找解压后的目录
EXTRACTED_DIR=$(find "$RESTORE_DIR" -maxdepth 1 -type d -name "*$BACKUP_DATE*" | head -1)
if [ -z "$EXTRACTED_DIR" ]; then
    # 如果没找到，可能直接解压到当前目录
    EXTRACTED_DIR="$RESTORE_DIR"
fi

echo "📂 解压目录: $EXTRACTED_DIR"

# 2. 停止相关服务 (可选)
echo "⏸️  建议停止相关服务..."
read -p "是否停止Docker容器? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "$SCRIPT_DIR/deployment/docker-compose.yml" ]; then
        cd "$SCRIPT_DIR/deployment"
        docker-compose stop backend
        echo "✅ 后端服务已停止"
    fi
fi

# 3. 备份当前数据 (安全措施)
echo "🛡️  备份当前数据..."
CURRENT_BACKUP_DIR="/tmp/current_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$CURRENT_BACKUP_DIR"

# 备份当前数据库
echo "💾 备份当前数据库..."
mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" \
    --single-transaction \
    "$DB_DATABASE" > "$CURRENT_BACKUP_DIR/current_database.sql" 2>/dev/null || echo "⚠️  当前数据库备份失败"

# 备份当前附件
if [ -d "$UPLOADS_DIR" ]; then
    echo "📎 备份当前附件..."
    sudo cp -r "$UPLOADS_DIR" "$CURRENT_BACKUP_DIR/uploads" 2>/dev/null || echo "⚠️  当前附件备份失败"
fi

echo "✅ 当前数据已备份到: $CURRENT_BACKUP_DIR"

# 4. 恢复数据库
echo "🗄️  开始恢复数据库..."
DB_RESTORE_FILE=$(find "$EXTRACTED_DIR" -name "*.sql.gz" | head -1)

if [ -n "$DB_RESTORE_FILE" ] && [ -f "$DB_RESTORE_FILE" ]; then
    echo "📂 找到数据库备份: $DB_RESTORE_FILE"
    
    # 检查数据库连接
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
    echo "⚠️  未找到数据库备份文件"
fi

# 5. 恢复附件文件
echo "📎 开始恢复附件文件..."
UPLOADS_RESTORE_DIR="$EXTRACTED_DIR/uploads"

if [ -d "$UPLOADS_RESTORE_DIR" ]; then
    echo "📂 找到附件备份: $UPLOADS_RESTORE_DIR"
    
    # 创建目标目录
    sudo mkdir -p "$UPLOADS_DIR"
    
    # 清空现有附件 (可选)
    read -p "是否清空现有附件目录? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo rm -rf "$UPLOADS_DIR"/*
        echo "🗑️  已清空现有附件"
    fi
    
    # 恢复附件
    echo "🔄 恢复附件中..."
    sudo cp -r "$UPLOADS_RESTORE_DIR"/* "$UPLOADS_DIR/" 2>/dev/null || echo "⚠️  部分附件恢复失败"
    
    # 设置权限
    sudo chmod -R 777 "$UPLOADS_DIR"
    
    # 统计恢复的文件
    RESTORED_COUNT=$(sudo find "$UPLOADS_DIR" -type f 2>/dev/null | wc -l)
    echo "✅ 附件恢复完成，共恢复 $RESTORED_COUNT 个文件"
else
    echo "⚠️  未找到附件备份目录"
fi

# 6. 恢复配置文件 (可选)
echo "⚙️  恢复配置文件..."
CONFIG_RESTORE_DIR="$EXTRACTED_DIR/config"

if [ -d "$CONFIG_RESTORE_DIR" ]; then
    echo "📂 找到配置备份: $CONFIG_RESTORE_DIR"
    
    read -p "是否恢复配置文件? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "$CONFIG_RESTORE_DIR/.env" ]; then
            cp "$CONFIG_RESTORE_DIR/.env" "$SCRIPT_DIR/deployment/.env.restored"
            echo "✅ 配置文件已恢复为 .env.restored (请手动检查后重命名)"
        fi
    fi
fi

# 7. 启动服务
echo "🚀 启动服务..."
read -p "是否启动Docker容器? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "$SCRIPT_DIR/deployment/docker-compose.yml" ]; then
        cd "$SCRIPT_DIR/deployment"
        docker-compose start backend
        echo "✅ 后端服务已启动"
        
        # 等待服务启动
        echo "⏳ 等待服务启动..."
        sleep 10
        
        # 检查服务状态
        if docker ps | grep -q "contract-ledger-backend"; then
            echo "✅ 服务启动成功"
        else
            echo "⚠️  服务可能未正常启动，请检查日志"
        fi
    fi
fi

# 8. 清理临时文件
echo "🧹 清理临时文件..."
rm -rf "$RESTORE_DIR"
echo "✅ 临时文件已清理"

# 9. 显示恢复统计
echo ""
echo "📊 恢复完成统计:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 恢复时间: $(date)"
echo "📁 备份文件: $BACKUP_FILE"
echo "🗄️  数据库: $([ -n "$DB_RESTORE_FILE" ] && echo '已恢复' || echo '未恢复')"
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