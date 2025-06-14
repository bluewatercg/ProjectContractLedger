# Docker构建检查清单

## 构建前检查

### 环境检查
- [ ] Docker Engine 20.10+ 已安装
- [ ] Docker Buildx 已启用
- [ ] 可用内存 ≥ 4GB
- [ ] 可用磁盘空间 ≥ 10GB
- [ ] 网络连接正常 (用于下载依赖)

### 文件完整性检查
- [ ] `tools/docker/Dockerfile` 存在
- [ ] `apps/backend/package.json` 存在
- [ ] `apps/backend/yarn.lock` 存在
- [ ] `apps/frontend/package.json` 存在
- [ ] `scripts/dev/start.sh` 存在且可执行
- [ ] `tools/nginx/nginx.conf` 存在
- [ ] `.dockerignore` 配置正确

### 代码质量检查
- [ ] 后端代码编译通过
- [ ] 前端代码编译通过
- [ ] 单元测试通过
- [ ] 代码格式检查通过
- [ ] 安全扫描通过

## 构建过程检查

### 后端构建阶段
- [ ] 构建工具安装成功 (python3, make, g++)
- [ ] 依赖安装成功 (yarn install)
- [ ] 源代码复制完整
- [ ] TypeScript编译成功
- [ ] dist目录生成正确

### 前端构建阶段
- [ ] npm依赖安装成功
- [ ] Vite构建成功
- [ ] dist/index.html 生成
- [ ] 静态资源生成完整
- [ ] 构建产物大小合理

### 生产镜像阶段
- [ ] 基础镜像拉取成功
- [ ] Node.js运行时安装成功
- [ ] 用户和权限设置正确
- [ ] 后端文件复制完整
- [ ] 前端文件复制到nginx目录
- [ ] nginx配置复制成功
- [ ] 启动脚本权限正确

## 构建后验证

### 镜像基本信息
- [ ] 镜像大小 < 500MB
- [ ] 镜像层数合理 (< 20层)
- [ ] 镜像标签正确
- [ ] 镜像创建时间正确

### 功能验证
- [ ] 容器能正常启动
- [ ] 前端页面可访问 (端口80)
- [ ] 后端API可访问 (端口8080)
- [ ] 健康检查端点正常
- [ ] 日志输出正常

### 安全验证
- [ ] 容器以非root用户运行
- [ ] 敏感信息未硬编码
- [ ] 安全扫描通过
- [ ] 端口暴露最小化

## 性能检查

### 构建性能
- [ ] 构建时间 < 15分钟
- [ ] 缓存利用率 > 50%
- [ ] 并行构建正常
- [ ] 内存使用合理

### 运行时性能
- [ ] 容器启动时间 < 30秒
- [ ] 内存使用 < 1GB
- [ ] CPU使用率正常
- [ ] 响应时间 < 2秒

## 部署前检查

### 配置验证
- [ ] 环境变量配置正确
- [ ] 数据库连接配置正确
- [ ] Redis连接配置正确
- [ ] JWT密钥配置正确

### 网络验证
- [ ] 端口映射正确
- [ ] nginx代理配置正确
- [ ] 跨域配置正确
- [ ] 防火墙规则正确

### 数据持久化
- [ ] 日志目录挂载正确
- [ ] 上传目录挂载正确
- [ ] 数据卷权限正确
- [ ] 备份策略就绪

## 故障排除检查

### 常见问题检查
- [ ] .dockerignore 未排除必要文件
- [ ] 文件路径大小写正确
- [ ] 权限设置正确
- [ ] 环境变量格式正确

### 日志检查
- [ ] 构建日志无错误
- [ ] 运行时日志正常
- [ ] 错误日志可读
- [ ] 日志级别合适

## 发布前检查

### 版本管理
- [ ] 版本号符合语义化版本规范
- [ ] Git标签已创建
- [ ] 变更日志已更新
- [ ] 文档已更新

### 镜像仓库
- [ ] 镜像推送成功
- [ ] 镜像标签正确
- [ ] 镜像描述完整
- [ ] 访问权限正确

### 回滚准备
- [ ] 上一版本镜像可用
- [ ] 回滚脚本准备就绪
- [ ] 数据库迁移可回滚
- [ ] 监控告警已配置

## 自动化检查脚本

### 基础检查脚本
```bash
#!/bin/bash
# check-build-env.sh

echo "=== 构建环境检查 ==="

# 检查Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker: $(docker --version)"
else
    echo "❌ Docker未安装"
    exit 1
fi

# 检查内存
total_mem=$(free -g | awk '/^Mem:/{print $2}')
if [ "$total_mem" -ge 4 ]; then
    echo "✅ 内存: ${total_mem}GB"
else
    echo "❌ 内存不足: ${total_mem}GB (需要至少4GB)"
    exit 1
fi

# 检查磁盘空间
available_space=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
if [ "$available_space" -ge 10 ]; then
    echo "✅ 磁盘空间: ${available_space}GB"
else
    echo "❌ 磁盘空间不足: ${available_space}GB (需要至少10GB)"
    exit 1
fi

echo "✅ 环境检查通过"
```

### 构建验证脚本
```bash
#!/bin/bash
# verify-build.sh

IMAGE_NAME="$1"
if [ -z "$IMAGE_NAME" ]; then
    echo "用法: $0 <镜像名称>"
    exit 1
fi

echo "=== 构建验证 ==="

# 检查镜像存在
if docker images "$IMAGE_NAME" --format "{{.Repository}}" | grep -q "$IMAGE_NAME"; then
    echo "✅ 镜像存在"
else
    echo "❌ 镜像不存在"
    exit 1
fi

# 检查镜像大小
size=$(docker images "$IMAGE_NAME" --format "{{.Size}}")
echo "ℹ️  镜像大小: $size"

# 测试容器启动
echo "测试容器启动..."
if docker run --rm -d --name test-container "$IMAGE_NAME" sleep 10; then
    echo "✅ 容器启动成功"
    docker stop test-container
else
    echo "❌ 容器启动失败"
    exit 1
fi

echo "✅ 构建验证通过"
```

## 检查清单使用说明

### 使用流程
1. **构建前**: 执行环境检查和文件完整性检查
2. **构建中**: 监控各阶段构建状态
3. **构建后**: 执行镜像验证和功能测试
4. **部署前**: 确认配置和网络设置
5. **发布前**: 完成版本管理和回滚准备

### 自动化建议
- 将检查清单集成到CI/CD流水线
- 使用脚本自动化常规检查
- 设置构建失败时的自动通知
- 定期审查和更新检查清单

### 记录保存
- 保存每次构建的检查结果
- 记录构建时间和性能指标
- 维护问题和解决方案知识库
- 定期分析构建趋势和优化点
