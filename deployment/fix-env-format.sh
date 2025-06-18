#!/bin/bash

# 修复.env文件格式问题的脚本
# 解决Windows回车符导致的"$'\r'：未找到命令"错误

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 修复.env文件格式和特殊字符问题
fix_env_format() {
    local env_file="$1"

    if [ ! -f "$env_file" ]; then
        log_error "文件不存在: $env_file"
        return 1
    fi

    log_info "检查文件格式: $env_file"

    # 创建备份
    cp "$env_file" "$env_file.backup"
    log_info "已创建备份文件: $env_file.backup"

    # 修复Windows回车符
    if grep -q $'\r' "$env_file"; then
        log_warning "检测到Windows格式的回车符，正在修复..."

        if command -v dos2unix &> /dev/null; then
            dos2unix "$env_file"
            log_success "使用dos2unix修复回车符"
        else
            sed -i 's/\r$//' "$env_file"
            log_success "使用sed修复回车符"
        fi
    fi

    # 修复特殊字符问题 - 确保所有值都被正确引用
    log_info "修复特殊字符和引用问题..."

    # 创建临时文件
    local temp_file="${env_file}.tmp"

    # 处理每一行，确保值被正确引用
    while IFS= read -r line || [[ -n "$line" ]]; do
        # 跳过注释行和空行
        if [[ "$line" =~ ^[[:space:]]*# ]] || [[ "$line" =~ ^[[:space:]]*$ ]]; then
            echo "$line" >> "$temp_file"
            continue
        fi

        # 处理配置行
        if [[ "$line" =~ ^[[:space:]]*([^=]+)=(.*)$ ]]; then
            local key="${BASH_REMATCH[1]}"
            local value="${BASH_REMATCH[2]}"

            # 移除key和value的前后空格
            key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

            # 如果值包含特殊字符且没有被引用，则添加引号
            if [[ "$value" =~ [[:space:],\&\*\(\)\[\]\{\}\|\\\;\<\>\?\$\`\!\@\#\%\^\~] ]] && [[ ! "$value" =~ ^[\"\'].*[\"\']$ ]]; then
                echo "${key}=\"${value}\"" >> "$temp_file"
            else
                echo "${key}=${value}" >> "$temp_file"
            fi
        else
            echo "$line" >> "$temp_file"
        fi
    done < "$env_file"

    # 替换原文件
    mv "$temp_file" "$env_file"

    log_success "文件格式和特殊字符修复完成: $env_file"
}

# 主函数
main() {
    echo "=== .env文件格式修复工具 ==="
    echo ""
    
    # 切换到脚本目录
    cd "$(dirname "$0")"
    
    # 修复.env文件
    if [ -f ".env" ]; then
        fix_env_format ".env"
    else
        log_warning ".env文件不存在"
        
        if [ -f ".env.template" ]; then
            log_info "发现模板文件，是否复制为.env文件？(y/N)"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                cp ".env.template" ".env"
                fix_env_format ".env"
                log_warning "请编辑.env文件，填写正确的配置值"
            fi
        fi
    fi
    
    echo ""
    log_success "格式修复完成！现在可以运行部署脚本了"
}

# 执行主函数
main "$@"
