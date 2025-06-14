# Scripts 文件夹说明

本文件夹包含项目的各种脚本文件，包括构建脚本、开发工具脚本和实用工具。

## 📁 文件夹结构

```
scripts/
├── build/            # 构建相关脚本
├── dev/              # 开发环境脚本
└── utils/            # 实用工具脚本
```

## 🔨 Build 构建脚本 (`scripts/build/`)

### Docker构建脚本
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `build-image.sh` | Docker镜像构建脚本 | ✅ 生产就绪 |

**功能特性**：
- 自动化Docker镜像构建
- 支持多种镜像标签
- 支持镜像仓库推送
- 构建过程验证
- 详细的构建日志
- 构建时间统计
- 悬空镜像清理

**使用方法**：
```bash
# 基本构建
./scripts/build/build-image.sh

# 指定镜像名称和标签
./scripts/build/build-image.sh contract-ledger v1.0.0

# 构建并推送到仓库
./scripts/build/build-image.sh contract-ledger latest ghcr.milu.moe true
```

**参数说明**：
- `$1`: 镜像名称 (默认: contract-ledger)
- `$2`: 镜像标签 (默认: latest)
- `$3`: 镜像仓库 (可选)
- `$4`: 是否推送 (默认: false)

## 💻 Dev 开发脚本 (`scripts/dev/`)

### 容器启动脚本
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `start.sh` | 容器内应用启动脚本 | ✅ 生产就绪 |

**功能特性**：
- 前后端服务协调启动
- 环境变量动态注入
- 健康检查和监控
- 优雅关闭处理
- 日志管理
- 错误恢复机制

### 本地开发脚本
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `start-dev.bat` | Windows开发环境启动 | ✅ 开发工具 |
| `start-dev.sh` | Linux开发环境启动 | ✅ 开发工具 |
| `start-dev.ps1` | PowerShell开发环境启动 | ✅ 开发工具 |
| `start-simple.bat` | Windows简化启动脚本 | ✅ 开发工具 |

**平台支持**：
- **Windows**: `.bat` 和 `.ps1` 脚本
- **Linux/Mac**: `.sh` 脚本
- **跨平台**: 统一的功能和体验

**功能对比**：

#### start-dev.bat (Windows完整版)
```batch
特点:
- 自动检查和安装依赖
- 分别启动前后端服务
- 显示服务状态和访问地址
- 包含数据库连接信息
- 提供默认登录账户信息
```

#### start-dev.sh (Linux版本)
```bash
特点:
- 使用gnome-terminal启动服务
- 后台运行前后端服务
- 简洁的状态显示
- 适合Linux桌面环境
```

#### start-simple.bat (简化版)
```batch
特点:
- 快速启动，最少交互
- 基本的依赖检查
- 适合熟悉项目的开发者
- 轻量级启动流程
```

## 🛠️ Utils 实用工具 (`scripts/utils/`)

### 环境变量工具
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `inject-env-vars.sh` | 前端环境变量注入脚本 | ✅ 生产就绪 |

**功能特性**：
- 动态生成前端配置文件
- 运行时环境变量注入
- 自动注入到HTML文件
- 支持多种配置参数
- 容器化环境适配

### 项目检查工具
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `check-github-actions.sh` | GitHub Actions诊断工具 | ✅ 开发工具 |
| `check-github-actions.bat` | Windows版GitHub Actions诊断 | ✅ 开发工具 |
| `check-project-status.bat` | 项目状态检查工具 | ✅ 开发工具 |

**诊断功能**：
- Git配置检查
- 工作流文件验证
- YAML语法检查
- 分支配置验证
- 提交状态检查
- Docker配置检查

### 项目清理工具
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `clean-project.sh` | 项目清理脚本 | ✅ 开发工具 |
| `clean-project.bat` | Windows版项目清理 | ✅ 开发工具 |

**清理内容**：
- node_modules目录
- yarn.lock文件
- 编译输出目录
- 临时文件和缓存
- 确认提示保护

## 🚀 使用指南

### 1. 开发环境启动

#### Windows环境
```batch
# 完整版启动（推荐新手）
scripts\dev\start-dev.bat

# 简化版启动（推荐熟手）
scripts\dev\start-simple.bat

# PowerShell版本
scripts\dev\start-dev.ps1
```

#### Linux/Mac环境
```bash
# 给脚本执行权限
chmod +x scripts/dev/start-dev.sh

# 启动开发环境
./scripts/dev/start-dev.sh
```

### 2. Docker镜像构建

#### 基本构建
```bash
# 给脚本执行权限
chmod +x scripts/build/build-image.sh

# 执行构建
./scripts/build/build-image.sh
```

#### 高级构建
```bash
# 构建特定版本并推送
./scripts/build/build-image.sh contract-ledger v1.2.0 ghcr.milu.moe true
```

### 3. 项目维护

#### 状态检查
```bash
# Windows
scripts\utils\check-project-status.bat

# Linux/Mac
chmod +x scripts/utils/check-github-actions.sh
./scripts/utils/check-github-actions.sh
```

#### 项目清理
```bash
# Windows
scripts\utils\clean-project.bat

# Linux/Mac
chmod +x scripts/utils/clean-project.sh
./scripts/utils/clean-project.sh
```

## 🔧 脚本配置

### 环境变量配置
```bash
# 数据库配置
DB_HOST=192.168.1.254
DB_PORT=3306
DB_NAME=procontractledger

# Redis配置
REDIS_HOST=192.168.1.160
REDIS_PORT=6379

# 前端配置
FRONTEND_API_BASE_URL=/api
APP_TITLE=客户合同管理系统
```

### 端口配置
```bash
# 默认端口
FRONTEND_PORT=8000
BACKEND_PORT=8080

# 开发环境端口
DEV_FRONTEND_PORT=8000
DEV_BACKEND_PORT=8080
```

## 📊 脚本监控

### 构建监控
- 构建时间统计
- 构建成功率跟踪
- 镜像大小监控
- 构建日志分析

### 开发环境监控
- 服务启动状态
- 端口占用检查
- 依赖安装状态
- 错误日志收集

## 🔒 安全注意事项

### 脚本执行权限
```bash
# 给脚本执行权限
chmod +x scripts/**/*.sh

# 检查脚本权限
ls -la scripts/
```

### 敏感信息保护
- 不在脚本中硬编码密码
- 使用环境变量传递敏感配置
- 定期检查脚本中的敏感信息

## 📋 维护清单

### 定期维护
1. **脚本更新**: 随项目需求更新脚本功能
2. **权限检查**: 确保脚本有正确的执行权限
3. **兼容性测试**: 测试脚本在不同平台的兼容性
4. **文档同步**: 保持脚本文档与实际功能同步

### 故障排除
1. **权限问题**: 检查文件执行权限
2. **路径问题**: 确认脚本在正确目录执行
3. **依赖问题**: 检查必要的工具是否安装
4. **环境问题**: 验证环境变量配置

## 🗑️ 清理历史

### 已删除的过时文件
在项目维护过程中，以下过时文件已被清理：

#### 临时修复文档（已解决的问题）
- `final-permission-solution.md` - 权限问题解决方案
- `frontend-build-fix-summary.md` - 前端构建修复总结
- `npm-solution-summary.md` - NPM解决方案总结
- `vite-permission-fix-summary.md` - Vite权限修复总结

#### 临时测试脚本（已完成任务）
- `test-dockerignore-fix.sh` - .dockerignore修复测试
- `test-vite-permission-fix.sh` - Vite权限修复测试

### 清理原则
- 删除已解决问题的临时文档
- 删除重复功能的脚本
- 保留核心功能和生产环境必需脚本
- 保持文件夹结构清晰简洁

## 🔗 相关文档

- [启动指南](../docs/user-guide/启动指南.md)
- [Docker构建指南](../docs/deployment/docker-build-guide.md)
- [GitHub Actions部署指南](../docs/development/GitHub_Actions_部署指南.md)
- [项目结构说明](../docs/user-guide/项目结构说明-新版.md)
