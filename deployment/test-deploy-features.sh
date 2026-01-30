#!/bin/bash

# 部署脚本功能测试
# 用于验证新增的备份、回滚、健康检查和日志轮转功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT="${SCRIPT_DIR}/deploy-separated.sh"

log_info() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# 测试脚本是否存在
test_script_exists() {
    log_info "测试 1: 检查部署脚本是否存在"

    if [ -f "$DEPLOY_SCRIPT" ]; then
        log_success "部署脚本存在: $DEPLOY_SCRIPT"
        return 0
    else
        log_error "部署脚本不存在: $DEPLOY_SCRIPT"
        return 1
    fi
}

# 测试脚本是否可执行
test_script_executable() {
    log_info "测试 2: 检查脚本是否可执行"

    if [ -x "$DEPLOY_SCRIPT" ]; then
        log_success "脚本可执行"
        return 0
    else
        log_error "脚本不可执行，尝试添加执行权限..."
        chmod +x "$DEPLOY_SCRIPT"
        if [ -x "$DEPLOY_SCRIPT" ]; then
            log_success "已添加执行权限"
            return 0
        else
            log_error "无法添加执行权限"
            return 1
        fi
    fi
}

# 测试配置变量是否存在
test_config_variables() {
    log_info "测试 3: 检查配置变量"

    local missing_vars=0

    # 检查备份配置
    if grep -q "BACKUP_DIR=" "$DEPLOY_SCRIPT"; then
        log_success "找到 BACKUP_DIR 配置"
    else
        log_error "缺少 BACKUP_DIR 配置"
        ((missing_vars++))
    fi

    if grep -q "BACKUP_RETENTION_DAYS=" "$DEPLOY_SCRIPT"; then
        log_success "找到 BACKUP_RETENTION_DAYS 配置"
    else
        log_error "缺少 BACKUP_RETENTION_DAYS 配置"
        ((missing_vars++))
    fi

    # 检查健康检查配置
    if grep -q "HEALTH_CHECK_RETRIES=" "$DEPLOY_SCRIPT"; then
        log_success "找到 HEALTH_CHECK_RETRIES 配置"
    else
        log_error "缺少 HEALTH_CHECK_RETRIES 配置"
        ((missing_vars++))
    fi

    if grep -q "HEALTH_CHECK_INTERVAL=" "$DEPLOY_SCRIPT"; then
        log_success "找到 HEALTH_CHECK_INTERVAL 配置"
    else
        log_error "缺少 HEALTH_CHECK_INTERVAL 配置"
        ((missing_vars++))
    fi

    # 检查日志配置
    if grep -q "LOG_MAX_SIZE_MB=" "$DEPLOY_SCRIPT"; then
        log_success "找到 LOG_MAX_SIZE_MB 配置"
    else
        log_error "缺少 LOG_MAX_SIZE_MB 配置"
        ((missing_vars++))
    fi

    if grep -q "LOG_RETENTION_DAYS=" "$DEPLOY_SCRIPT"; then
        log_success "找到 LOG_RETENTION_DAYS 配置"
    else
        log_error "缺少 LOG_RETENTION_DAYS 配置"
        ((missing_vars++))
    fi

    if [ $missing_vars -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# 测试备份函数是否存在
test_backup_functions() {
    log_info "测试 4: 检查备份函数"

    local missing_funcs=0

    if grep -q "^backup_database()" "$DEPLOY_SCRIPT"; then
        log_success "找到 backup_database 函数"
    else
        log_error "缺少 backup_database 函数"
        ((missing_funcs++))
    fi

    if grep -q "^backup_uploads()" "$DEPLOY_SCRIPT"; then
        log_success "找到 backup_uploads 函数"
    else
        log_error "缺少 backup_uploads 函数"
        ((missing_funcs++))
    fi

    if grep -q "^cleanup_old_backups()" "$DEPLOY_SCRIPT"; then
        log_success "找到 cleanup_old_backups 函数"
    else
        log_error "缺少 cleanup_old_backups 函数"
        ((missing_funcs++))
    fi

    if grep -q "^create_deployment_snapshot()" "$DEPLOY_SCRIPT"; then
        log_success "找到 create_deployment_snapshot 函数"
    else
        log_error "缺少 create_deployment_snapshot 函数"
        ((missing_funcs++))
    fi

    if [ $missing_funcs -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# 测试回滚函数是否存在
test_rollback_functions() {
    log_info "测试 5: 检查回滚函数"

    local missing_funcs=0

    if grep -q "^rollback_deployment()" "$DEPLOY_SCRIPT"; then
        log_success "找到 rollback_deployment 函数"
    else
        log_error "缺少 rollback_deployment 函数"
        ((missing_funcs++))
    fi

    if grep -q "^restore_database()" "$DEPLOY_SCRIPT"; then
        log_success "找到 restore_database 函数"
    else
        log_error "缺少 restore_database 函数"
        ((missing_funcs++))
    fi

    if grep -q "^restore_uploads()" "$DEPLOY_SCRIPT"; then
        log_success "找到 restore_uploads 函数"
    else
        log_error "缺少 restore_uploads 函数"
        ((missing_funcs++))
    fi

    if [ $missing_funcs -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# 测试日志轮转函数是否存在
test_log_rotation_function() {
    log_info "测试 6: 检查日志轮转函数"

    if grep -q "^rotate_logs()" "$DEPLOY_SCRIPT"; then
        log_success "找到 rotate_logs 函数"
        return 0
    else
        log_error "缺少 rotate_logs 函数"
        return 1
    fi
}

# 测试健康检查改进
test_health_check_improvements() {
    log_info "测试 7: 检查健康检查改进"

    local improvements=0

    # 检查是否使用配置变量
    if grep -q "HEALTH_CHECK_RETRIES" "$DEPLOY_SCRIPT" && \
       grep -q "HEALTH_CHECK_INTERVAL" "$DEPLOY_SCRIPT"; then
        log_success "健康检查使用可配置参数"
        ((improvements++))
    else
        log_error "健康检查未使用可配置参数"
    fi

    # 检查是否有返回值
    if grep -q "return 1" "$DEPLOY_SCRIPT" | grep -A5 "check_services"; then
        log_success "健康检查失败时返回错误码"
        ((improvements++))
    else
        log_error "健康检查未返回错误码"
    fi

    if [ $improvements -eq 2 ]; then
        return 0
    else
        return 1
    fi
}

# 测试命令行选项
test_command_options() {
    log_info "测试 8: 检查命令行选项"

    local missing_opts=0

    if grep -q "\-\-backup)" "$DEPLOY_SCRIPT"; then
        log_success "找到 --backup 选项"
    else
        log_error "缺少 --backup 选项"
        ((missing_opts++))
    fi

    if grep -q "\-\-rollback)" "$DEPLOY_SCRIPT"; then
        log_success "找到 --rollback 选项"
    else
        log_error "缺少 --rollback 选项"
        ((missing_opts++))
    fi

    if grep -q "\-\-rotate-logs)" "$DEPLOY_SCRIPT"; then
        log_success "找到 --rotate-logs 选项"
    else
        log_error "缺少 --rotate-logs 选项"
        ((missing_opts++))
    fi

    if [ $missing_opts -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# 测试帮助信息
test_help_message() {
    log_info "测试 9: 检查帮助信息"

    if bash "$DEPLOY_SCRIPT" --help 2>&1 | grep -q "backup"; then
        log_success "帮助信息包含备份说明"
        return 0
    else
        log_error "帮助信息缺少备份说明"
        return 1
    fi
}

# 测试部署流程集成
test_deployment_integration() {
    log_info "测试 10: 检查部署流程集成"

    local integrated=0

    # 检查 deploy_basic 是否调用备份
    if grep -A20 "^deploy_basic()" "$DEPLOY_SCRIPT" | grep -q "backup_database"; then
        log_success "基础部署集成了备份功能"
        ((integrated++))
    else
        log_error "基础部署未集成备份功能"
    fi

    # 检查 deploy_proxy 是否调用备份
    if grep -A20 "^deploy_proxy()" "$DEPLOY_SCRIPT" | grep -q "backup_database"; then
        log_success "代理部署集成了备份功能"
        ((integrated++))
    else
        log_error "代理部署未集成备份功能"
    fi

    # 检查是否有回滚逻辑
    if grep -A20 "^deploy_basic()" "$DEPLOY_SCRIPT" | grep -q "rollback"; then
        log_success "部署流程集成了回滚机制"
        ((integrated++))
    else
        log_error "部署流程未集成回滚机制"
    fi

    if [ $integrated -eq 3 ]; then
        return 0
    else
        return 1
    fi
}

# 运行所有测试
run_all_tests() {
    echo ""
    echo "=========================================="
    echo "  部署脚本功能测试"
    echo "=========================================="
    echo ""

    local total_tests=10
    local passed_tests=0

    test_script_exists && ((passed_tests++))
    echo ""

    test_script_executable && ((passed_tests++))
    echo ""

    test_config_variables && ((passed_tests++))
    echo ""

    test_backup_functions && ((passed_tests++))
    echo ""

    test_rollback_functions && ((passed_tests++))
    echo ""

    test_log_rotation_function && ((passed_tests++))
    echo ""

    test_health_check_improvements && ((passed_tests++))
    echo ""

    test_command_options && ((passed_tests++))
    echo ""

    test_help_message && ((passed_tests++))
    echo ""

    test_deployment_integration && ((passed_tests++))
    echo ""

    echo "=========================================="
    echo "  测试结果"
    echo "=========================================="
    echo -e "总测试数: ${total_tests}"
    echo -e "通过: ${GREEN}${passed_tests}${NC}"
    echo -e "失败: ${RED}$((total_tests - passed_tests))${NC}"
    echo ""

    if [ $passed_tests -eq $total_tests ]; then
        log_success "所有测试通过！"
        return 0
    else
        log_error "部分测试失败，请检查脚本"
        return 1
    fi
}

# 执行测试
run_all_tests
