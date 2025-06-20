#!/bin/bash

# Docker容器内文件上传问题调试脚本

echo "=== Docker容器内文件上传调试 ==="
echo

# 1. 检查基本环境
echo "1. 基本环境信息:"
echo "   当前用户: $(whoami)"
echo "   当前目录: $(pwd)"
echo "   Node.js版本: $(node --version)"
echo

# 2. 检查上传目录
echo "2. 上传目录检查:"
UPLOAD_DIR=${UPLOAD_DIR:-/app/uploads}
echo "   配置的上传目录: $UPLOAD_DIR"
echo "   目录是否存在: $(test -d "$UPLOAD_DIR" && echo "是" || echo "否")"

if [ -d "$UPLOAD_DIR" ]; then
    echo "   目录权限: $(ls -ld "$UPLOAD_DIR")"
    echo "   目录内容:"
    ls -la "$UPLOAD_DIR" | sed 's/^/     /'
    
    # 检查子目录
    for subdir in contracts invoices; do
        subpath="$UPLOAD_DIR/$subdir"
        if [ -d "$subpath" ]; then
            echo "   $subdir 子目录内容:"
            find "$subpath" -type f -exec ls -la {} \; | sed 's/^/     /'
        else
            echo "   $subdir 子目录: 不存在"
        fi
    done
else
    echo "   尝试创建上传目录..."
    mkdir -p "$UPLOAD_DIR" && echo "   ✓ 创建成功" || echo "   ✗ 创建失败"
fi
echo

# 3. 检查临时目录
echo "3. 临时目录检查:"
TEMP_DIR=${TMPDIR:-/tmp}
echo "   临时目录: $TEMP_DIR"
echo "   目录是否存在: $(test -d "$TEMP_DIR" && echo "是" || echo "否")"
if [ -d "$TEMP_DIR" ]; then
    echo "   目录权限: $(ls -ld "$TEMP_DIR")"
    echo "   可用空间: $(df -h "$TEMP_DIR" | tail -1 | awk '{print $4}')"
fi
echo

# 4. 检查环境变量
echo "4. 相关环境变量:"
env | grep -E "(UPLOAD|TEMP|TMP|NODE)" | sed 's/^/   /'
echo

# 5. 测试文件操作
echo "5. 文件操作测试:"
TEST_DIR="$UPLOAD_DIR/test"
TEST_FILE="$TEST_DIR/test.txt"

# 创建测试目录
if mkdir -p "$TEST_DIR" 2>/dev/null; then
    echo "   ✓ 创建测试目录成功: $TEST_DIR"
    
    # 创建测试文件
    if echo "test content" > "$TEST_FILE" 2>/dev/null; then
        echo "   ✓ 创建测试文件成功: $TEST_FILE"
        
        # 读取测试文件
        if [ -f "$TEST_FILE" ]; then
            content=$(cat "$TEST_FILE")
            echo "   ✓ 读取测试文件成功: $content"
            
            # 清理测试文件
            rm -f "$TEST_FILE"
            rmdir "$TEST_DIR" 2>/dev/null
            echo "   ✓ 清理测试文件成功"
        else
            echo "   ✗ 测试文件不存在"
        fi
    else
        echo "   ✗ 创建测试文件失败"
    fi
else
    echo "   ✗ 创建测试目录失败"
fi
echo

# 6. 检查进程和端口
echo "6. 服务状态检查:"
echo "   Node.js进程:"
ps aux | grep node | grep -v grep | sed 's/^/     /'
echo "   监听端口:"
netstat -tlnp 2>/dev/null | grep :8080 | sed 's/^/     /' || echo "     无法获取端口信息"
echo

# 7. 检查日志目录
echo "7. 日志目录检查:"
LOG_DIR=${LOG_DIR:-/app/logs}
echo "   日志目录: $LOG_DIR"
if [ -d "$LOG_DIR" ]; then
    echo "   目录权限: $(ls -ld "$LOG_DIR")"
    echo "   最新日志文件:"
    find "$LOG_DIR" -name "*.log" -type f -exec ls -la {} \; | head -5 | sed 's/^/     /'
else
    echo "   日志目录不存在"
fi
echo

# 8. 磁盘空间检查
echo "8. 磁盘空间检查:"
df -h | grep -E "(Filesystem|/app|/tmp)" | sed 's/^/   /'
echo

echo "=== 调试完成 ==="
echo
echo "建议操作:"
echo "1. 检查Docker卷挂载是否正确配置"
echo "2. 确认容器有足够的磁盘空间"
echo "3. 验证文件权限设置"
echo "4. 查看应用日志获取详细错误信息"
