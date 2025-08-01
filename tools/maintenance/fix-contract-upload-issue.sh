#!/bin/bash

# 合同附件上传问题修复脚本
# 解决Docker环境下文件上传权限和路径问题

set -e

echo "🔧 开始修复合同附件上传问题..."

# 1. 检查并创建正确的上传目录
echo "📁 检查上传目录..."

# 根据你的配置，实际的挂载路径是 /opt/projectcontractledger/backend_uploads
UPLOAD_HOST_PATH="/opt/projectcontractledger/backend_uploads"
LOGS_HOST_PATH="/opt/projectcontractledger/backend_logs"

echo "🎯 检测到的挂载路径："
echo "  上传目录: $UPLOAD_HOST_PATH"
echo "  日志目录: $LOGS_HOST_PATH"

# 创建宿主机目录
echo "📁 创建宿主机目录..."
sudo mkdir -p "$UPLOAD_HOST_PATH/contracts"
sudo mkdir -p "$UPLOAD_HOST_PATH/invoices"
sudo mkdir -p "$LOGS_HOST_PATH"

# 设置权限 - 确保容器可以写入
echo "🔐 设置目录权限..."
sudo chmod -R 777 "$UPLOAD_HOST_PATH"
sudo chmod -R 755 "$LOGS_HOST_PATH"

echo "✅ 目录权限设置完成"
ls -la "$UPLOAD_HOST_PATH" 2>/dev/null || echo "⚠️  需要sudo权限查看目录"

# 2. 检查容器状态
echo "🐳 检查容器状态..."
if docker ps | grep -q "contract-ledger-backend"; then
    echo "✅ 后端容器正在运行"
    
    # 检查容器内目录
    echo "📂 检查容器内上传目录..."
    docker exec contract-ledger-backend ls -la /app/uploads/ || echo "⚠️  容器内目录不存在"
    
    # 测试容器内权限
    echo "🧪 测试容器内文件创建权限..."
    if docker exec contract-ledger-backend touch /app/uploads/test.txt 2>/dev/null; then
        echo "✅ 容器内文件创建权限正常"
        docker exec contract-ledger-backend rm /app/uploads/test.txt 2>/dev/null || true
    else
        echo "❌ 容器内文件创建权限失败"
    fi
    
    # 测试子目录创建
    if docker exec contract-ledger-backend mkdir -p /app/uploads/contracts/test 2>/dev/null; then
        echo "✅ 容器内子目录创建权限正常"
        docker exec contract-ledger-backend rmdir /app/uploads/contracts/test 2>/dev/null || true
    else
        echo "❌ 容器内子目录创建权限失败"
    fi
    
    # 检查现有文件
    echo "📋 检查现有上传文件..."
    echo "容器内文件:"
    docker exec contract-ledger-backend find /app/uploads -type f -name "*" 2>/dev/null | head -10 || echo "  无文件"
    
    echo "宿主机文件:"
    sudo find "$UPLOAD_HOST_PATH" -type f -name "*" 2>/dev/null | head -10 || echo "  无文件"
    
else
    echo "⚠️  后端容器未运行，请先启动服务"
fi

# 3. 检查环境变量
echo "🔍 检查环境变量配置..."
if docker ps | grep -q "contract-ledger-backend"; then
    echo "容器内环境变量:"
    docker exec contract-ledger-backend env | grep UPLOAD || echo "  未找到UPLOAD相关变量"
fi

# 4. 检查数据库中的附件记录
echo "�️检  检查数据库中的附件记录..."
if docker ps | grep -q "contract-ledger-backend"; then
    echo "提示: 可以通过以下方式检查数据库中的附件记录"
    echo "docker exec -it contract-ledger-backend node -e \"console.log('检查数据库附件表')\""
fi

# 5. 提供诊断信息
echo ""
echo "🔍 诊断信息："
echo "宿主机上传目录: $UPLOAD_HOST_PATH"
echo "容器内上传目录: /app/uploads"
echo "目录权限:"
sudo ls -la "$UPLOAD_HOST_PATH" 2>/dev/null || echo "  目录不存在或无权限"

# 6. 检查是否有孤立文件
echo ""
echo "🔍 查找可能的孤立文件..."
echo "检查常见路径中是否有上传文件:"
for path in "/opt/projectcontractledger" "./data/uploads" "/tmp" "/var/lib/docker/volumes"; do
    if [ -d "$path" ]; then
        echo "检查 $path :"
        sudo find "$path" -name "*.pdf" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" 2>/dev/null | head -5 || echo "  无相关文件"
    fi
done

# 7. 提供修复建议
echo ""
echo "🛠️  修复建议："
echo "1. 如果问题仍然存在，请重启容器："
echo "   docker-compose restart backend"
echo ""
echo "2. 检查容器日志中的错误："
echo "   docker logs contract-ledger-backend | grep -i upload"
echo "   docker logs contract-ledger-backend | grep -i error"
echo ""
echo "3. 验证文件上传路径："
echo "   - 上传一个测试文件"
echo "   - 立即检查: sudo ls -la $UPLOAD_HOST_PATH/contracts/"
echo "   - 检查容器内: docker exec contract-ledger-backend ls -la /app/uploads/contracts/"
echo ""
echo "4. 如果发现文件在错误位置，可以移动文件："
echo "   sudo find /opt/projectcontractledger -name '*.pdf' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.png'"
echo ""
echo "5. 数据库一致性检查："
echo "   - 检查数据库中的 contract_attachments 表"
echo "   - 确认 file_path 字段指向正确的文件位置"

echo ""
echo "✅ 修复脚本执行完成！"
echo ""
echo "🎯 关键问题总结："
echo "根据你的配置，文件应该保存在: $UPLOAD_HOST_PATH"
echo "如果同事上传的文件你看不到，很可能是因为："
echo "1. 权限问题 - 文件保存了但你无权访问"
echo "2. 路径问题 - 文件保存在了其他位置"
echo "3. 挂载问题 - Docker卷挂载不正确"