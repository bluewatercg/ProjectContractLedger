#!/bin/bash

# API版本升级脚本
# 支持无缝升级API版本，无需修改前端代码

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE=".env"
BACKUP_DIR="./backups"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "API版本升级脚本"
    echo ""
    echo "使用方法: $0 [选项] [目标版本]"
    echo ""
    echo "选项:"
    echo "  --check         检查当前版本和可用版本"
    echo "  --upgrade       升级到指定版本"
    echo "  --rollback      回滚到上一个版本"
    echo "  --list          列出所有可用版本"
    echo "  --help          显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --check                # 检查当前版本"
    echo "  $0 --upgrade v2           # 升级到v2版本"
    echo "  $0 --rollback             # 回滚到上一个版本"
    echo "  $0 --list                 # 列出可用版本"
}

# 获取当前API版本
get_current_version() {
    if [ -f "$ENV_FILE" ]; then
        grep "^API_VERSION=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1
    else
        echo "v1"
    fi
}

# 检查版本格式是否有效
is_valid_version() {
    local version="$1"

    # 支持 v1, v2, v3... 或 v1.0, v2.1... 格式
    if [[ "$version" =~ ^v[0-9]+(\.[0-9]+)?$ ]]; then
        return 0
    else
        return 1
    fi
}

# 获取可用版本列表（动态检测）
get_available_versions() {
    # 方法1: 从后端API获取支持的版本
    local api_versions=$(curl -s "http://localhost:8080/api/versions" 2>/dev/null | grep -o 'v[0-9]\+' | sort -V | uniq 2>/dev/null)

    # 方法2: 如果API不可用，使用默认版本范围
    if [ -z "$api_versions" ]; then
        api_versions="v1 v2 v3 v4 v5"  # 支持到v5，可根据需要扩展
    fi

    echo "$api_versions"
}

# 检查版本是否存在
check_version_exists() {
    local version="$1"

    # 首先检查格式是否有效
    if ! is_valid_version "$version"; then
        return 1
    fi

    # 检查是否在支持的版本范围内
    local available_versions=$(get_available_versions)

    for v in $available_versions; do
        if [ "$v" = "$version" ]; then
            return 0
        fi
    done

    # 如果不在预定义列表中，但格式有效，也认为是有效的（支持未来版本）
    return 0
}

# 备份当前配置
backup_config() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/env_backup_$timestamp"
    
    mkdir -p "$BACKUP_DIR"
    
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$backup_file"
        log_success "配置已备份到: $backup_file"
        echo "$backup_file" > "$BACKUP_DIR/latest_backup"
    fi
}

# 更新API版本
update_api_version() {
    local new_version="$1"
    
    log_info "更新API版本到: $new_version"
    
    # 更新API_VERSION
    if grep -q "^API_VERSION=" "$ENV_FILE"; then
        sed -i "s/^API_VERSION=.*/API_VERSION=$new_version/" "$ENV_FILE"
    else
        echo "API_VERSION=$new_version" >> "$ENV_FILE"
    fi
    
    # 更新FRONTEND_API_BASE_URL
    if grep -q "^FRONTEND_API_BASE_URL=" "$ENV_FILE"; then
        sed -i "s|^FRONTEND_API_BASE_URL=.*|FRONTEND_API_BASE_URL=/api/$new_version|" "$ENV_FILE"
    else
        echo "FRONTEND_API_BASE_URL=/api/$new_version" >> "$ENV_FILE"
    fi
    
    log_success "API版本已更新到: $new_version"
}

# 检查当前版本
check_version() {
    local current_version=$(get_current_version)
    
    echo ""
    log_info "=== API版本信息 ==="
    echo "当前版本: $current_version"
    echo "配置文件: $ENV_FILE"
    
    if [ -f "$ENV_FILE" ]; then
        echo ""
        echo "当前API配置:"
        grep -E "^(API_VERSION|FRONTEND_API_BASE_URL)=" "$ENV_FILE" || echo "未找到API版本配置"
    fi
    
    echo ""
    echo "可用版本: v1, v2"
}

# 获取版本功能描述
get_version_features() {
    local version="$1"
    local version_num=$(echo "$version" | sed 's/v//')

    local base_features="认证、客户、合同、发票、支付、统计"

    case "$version_num" in
        1)
            echo "$base_features"
            ;;
        2)
            echo "$base_features + 附件管理、通知系统"
            ;;
        3)
            echo "$base_features + 附件管理、通知系统 + 报表、分析、Webhooks"
            ;;
        4)
            echo "$base_features + v2/v3功能 + AI洞察、自动化、集成"
            ;;
        5)
            echo "$base_features + v2-v4功能 + 移动API、实时功能、高级搜索"
            ;;
        *)
            echo "$base_features + 扩展功能（版本 $version）"
            ;;
    esac
}

# 列出可用版本
list_versions() {
    echo ""
    log_info "=== 可用API版本 ==="

    local available_versions=$(get_available_versions)
    local current_version=$(get_current_version)

    for version in $available_versions; do
        local features=$(get_version_features "$version")
        local status=""

        if [ "$version" = "$current_version" ]; then
            status=" ${GREEN}(当前版本)${NC}"
        fi

        echo "$version - $features$status"
    done

    echo ""
    echo "当前版本: $current_version"
    echo ""
    echo "使用方法:"
    echo "  升级到指定版本: $0 --upgrade vX"
    echo "  例如: $0 --upgrade v3"
}

# 升级版本
upgrade_version() {
    local target_version="$1"
    
    if [ -z "$target_version" ]; then
        log_error "请指定目标版本"
        show_help
        exit 1
    fi
    
    if ! check_version_exists "$target_version"; then
        log_error "版本 $target_version 不存在"
        list_versions
        exit 1
    fi
    
    local current_version=$(get_current_version)
    
    if [ "$current_version" = "$target_version" ]; then
        log_warning "当前已经是版本 $target_version"
        exit 0
    fi
    
    log_info "开始升级API版本..."
    log_info "从版本 $current_version 升级到 $target_version"
    
    # 备份配置
    backup_config
    
    # 更新版本
    update_api_version "$target_version"
    
    # 重启服务
    log_info "重启服务以应用新版本..."
    if [ -f "./deploy-separated.sh" ]; then
        ./deploy-separated.sh --update
    else
        log_warning "未找到部署脚本，请手动重启服务"
    fi
    
    log_success "API版本升级完成！"
    log_info "新版本: $target_version"
    log_info "请测试应用功能确保升级成功"
}

# 回滚版本
rollback_version() {
    local backup_file
    
    if [ -f "$BACKUP_DIR/latest_backup" ]; then
        backup_file=$(cat "$BACKUP_DIR/latest_backup")
    else
        log_error "未找到备份文件"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        exit 1
    fi
    
    log_info "开始回滚API版本..."
    log_info "从备份文件恢复: $backup_file"
    
    # 恢复配置
    cp "$backup_file" "$ENV_FILE"
    
    # 重启服务
    log_info "重启服务以应用回滚..."
    if [ -f "./deploy-separated.sh" ]; then
        ./deploy-separated.sh --update
    else
        log_warning "未找到部署脚本，请手动重启服务"
    fi
    
    log_success "API版本回滚完成！"
    log_info "当前版本: $(get_current_version)"
}

# 主函数
main() {
    # 切换到脚本目录
    cd "$SCRIPT_DIR"
    
    case "$1" in
        --check)
            check_version
            ;;
        --upgrade)
            upgrade_version "$2"
            ;;
        --rollback)
            rollback_version
            ;;
        --list)
            list_versions
            ;;
        --help|"")
            show_help
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
