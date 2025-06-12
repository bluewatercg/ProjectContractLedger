#!/bin/bash

# GitHub Actions 诊断脚本

echo "=== GitHub Actions 诊断工具 ==="
echo "时间: $(date)"
echo

# 检查Git配置
echo "1. 检查Git配置"
echo "当前分支: $(git branch --show-current)"
echo "远程仓库: $(git remote get-url origin 2>/dev/null || echo '未配置')"
echo "最近提交: $(git log --oneline -1 2>/dev/null || echo '无提交记录')"
echo

# 检查工作流文件
echo "2. 检查工作流文件"
if [ -d ".github/workflows" ]; then
    echo "工作流目录存在: ✅"
    echo "工作流文件:"
    ls -la .github/workflows/
    echo
    
    # 检查YAML语法
    echo "3. 检查YAML语法"
    for file in .github/workflows/*.yml .github/workflows/*.yaml; do
        if [ -f "$file" ]; then
            echo "检查文件: $file"
            # 使用Python检查YAML语法（如果可用）
            if command -v python3 &> /dev/null; then
                python3 -c "
import yaml
import sys
try:
    with open('$file', 'r') as f:
        yaml.safe_load(f)
    print('  ✅ YAML语法正确')
except Exception as e:
    print(f'  ❌ YAML语法错误: {e}')
    sys.exit(1)
" 2>/dev/null || echo "  ⚠️  无法验证YAML语法（需要Python和PyYAML）"
            else
                echo "  ⚠️  无法验证YAML语法（需要Python）"
            fi
        fi
    done
else
    echo "工作流目录不存在: ❌"
    echo "请确保 .github/workflows 目录存在"
fi
echo

# 检查分支配置
echo "4. 检查分支触发配置"
current_branch=$(git branch --show-current)
echo "当前分支: $current_branch"

if [ -f ".github/workflows/docker-build-push.yml" ]; then
    echo "检查 docker-build-push.yml 中的分支配置:"
    grep -A 5 "branches:" .github/workflows/docker-build-push.yml || echo "未找到分支配置"
fi

if [ -f ".github/workflows/test-build.yml" ]; then
    echo "检查 test-build.yml 中的分支配置:"
    grep -A 5 "branches:" .github/workflows/test-build.yml || echo "未找到分支配置"
fi
echo

# 检查提交状态
echo "5. 检查提交和推送状态"
if git status --porcelain | grep -q .; then
    echo "有未提交的更改: ⚠️"
    git status --short
else
    echo "工作目录干净: ✅"
fi

# 检查是否有未推送的提交
if git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null | grep -q .; then
    echo "有未推送的提交: ⚠️"
    git log origin/$(git branch --show-current)..HEAD --oneline
elif git ls-remote origin $(git branch --show-current) &>/dev/null; then
    echo "所有提交已推送: ✅"
else
    echo "远程分支不存在，可能是新分支: ⚠️"
fi
echo

# 检查Docker文件
echo "6. 检查Docker配置"
if [ -f "Dockerfile" ]; then
    echo "Dockerfile存在: ✅"
    echo "Dockerfile大小: $(wc -l < Dockerfile) 行"
else
    echo "Dockerfile不存在: ❌"
fi

if [ -f "docker-compose.yml" ]; then
    echo "docker-compose.yml存在: ✅"
else
    echo "docker-compose.yml不存在: ❌"
fi
echo

# 提供解决建议
echo "7. 解决建议"
echo "如果GitHub Actions没有触发，请检查以下项目:"
echo
echo "a) 确保当前分支在工作流的触发分支列表中"
echo "   当前分支: $current_branch"
echo "   建议: 将 '$current_branch' 添加到工作流的 branches 列表中"
echo
echo "b) 确保所有更改已提交并推送到GitHub"
echo "   命令: git add . && git commit -m 'trigger actions' && git push"
echo
echo "c) 检查GitHub仓库设置"
echo "   - 访问: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/actions"
echo "   - 确保Actions已启用"
echo "   - 检查工作流权限设置"
echo
echo "d) 手动触发工作流（如果支持）"
echo "   - 访问: https://github.com/YOUR_USERNAME/YOUR_REPO/actions"
echo "   - 选择工作流并点击 'Run workflow'"
echo
echo "e) 查看Actions日志"
echo "   - 访问: https://github.com/YOUR_USERNAME/YOUR_REPO/actions"
echo "   - 查看是否有失败的工作流运行"
echo

echo "=== 诊断完成 ==="
