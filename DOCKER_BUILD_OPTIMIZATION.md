# Docker构建优化配置说明

## 问题描述

在GitHub Actions中进行Docker多架构构建时，遇到以下问题：
- linux/arm64架构下yarn安装依赖失败
- 网络超时错误（ResponseError）
- 构建过程中断，错误代码：exit code 1

## 解决方案

### 1. 优化Dockerfile配置

#### 后端 (`apps/backend/Dockerfile`)
- ✅ 增加网络超时时间：从100秒增加到300秒
- ✅ 添加重试机制：三次尝试，逐步降低并发度
- ✅ 优化yarn配置：设置child-concurrency和network-concurrency
- ✅ 添加curl工具：用于网络调试
- ✅ 增强错误处理：详细的错误输出和诊断信息

#### 前端 (`apps/frontend/Dockerfile`)
- ✅ 同样的网络超时和重试机制优化
- ✅ 优化依赖安装流程
- ✅ 增强构建过程的容错性

### 2. GitHub Actions工作流优化 (`.github/workflows/docker-build-push.yml`)

- ✅ 添加`provenance: false`配置
- ✅ 增加构建参数优化
- ✅ 保持多平台构建支持

### 3. 备用构建策略 (`.github/workflows/docker-build-fallback.yml`)

- ✅ 提供单平台AMD64构建选项
- ✅ 可手动触发的备用方案
- ✅ 适用于紧急发布场景

### 4. ARM64专用优化 (`apps/backend/Dockerfile.arm64`)

- ✅ 针对ARM64架构的特殊优化
- ✅ 更长的超时时间（600秒）
- ✅ 分阶段依赖安装策略
- ✅ 跳过可选依赖和二进制下载

### 5. 构建上下文优化

#### 后端 (`apps/backend/.dockerignore`)
- ✅ 排除不必要的文件减少构建上下文
- ✅ 提升构建速度和稳定性

#### 前端 (`apps/frontend/.dockerignore`)
- ✅ 同样的优化策略
- ✅ 减少网络传输压力

### 6. 调试工具

#### Linux/Mac (`tools/docker/debug-build.sh`)
- ✅ 本地构建调试脚本
- ✅ 支持单独测试AMD64和ARM64构建
- ✅ 详细的错误诊断输出

#### Windows (`tools/docker/debug-build.bat`)
- ✅ Windows版本的调试脚本
- ✅ 相同的功能和诊断能力

## 使用方法

### 自动构建（推荐）
1. 提交代码到GitHub仓库
2. GitHub Actions自动触发多平台构建
3. 如果成功，将生成支持AMD64和ARM64的镜像

### 备用构建（如果多平台构建失败）
1. 在GitHub Actions页面手动触发"Docker Build Fallback"工作流
2. 将生成仅支持AMD64的镜像，适用于大多数服务器

### 本地调试
```bash
# Windows
tools\docker\debug-build.bat

# Linux/Mac
chmod +x tools/docker/debug-build.sh
./tools/docker/debug-build.sh
```

## 提交说明

本次优化主要解决了：
1. **网络超时问题**：大幅增加超时时间和重试机制
2. **ARM64构建稳定性**：专门的优化策略和配置
3. **构建效率**：减少构建上下文和优化缓存策略
4. **故障排查**：提供详细的调试工具和日志

## 验证步骤

1. 提交代码后，检查GitHub Actions构建状态
2. 如果多平台构建成功，镜像将包含AMD64和ARM64支持
3. 如果多平台构建失败，可使用备用工作流生成AMD64镜像
4. 使用调试脚本可以在本地重现和排查问题

## 注意事项

- ARM64构建仍可能受到GitHub Actions资源限制影响
- 备用单平台构建确保项目发布不受阻塞
- 本地调试脚本有助于快速定位问题
- 所有优化都向后兼容，不影响现有部署