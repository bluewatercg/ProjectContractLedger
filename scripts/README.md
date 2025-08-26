# 📜 Scripts 自动化脚本目录

> **最新更新**: 2025-08-26  
> **维护状态**: ✅ 活跃维护  
> **兼容版本**: v2.2.0+

本目录包含项目的各种自动化脚本，用于简化开发、构建、测试和部署流程，提高开发效率和部署可靠性。

## 📁 目录结构

```
scripts/
├── README.md                    # 本说明文件
├── build/                      # 构建相关脚本
│   └── build-image.sh          # Docker镜像构建脚本
├── dev/                        # 开发环境脚本
│   ├── start-dev.sh           # Linux/macOS开发环境启动
│   ├── start-dev.ps1          # Windows PowerShell开发环境启动
│   ├── start-dev.bat          # Windows CMD开发环境启动
│   ├── start-simple.bat       # Windows简化启动脚本
│   └── start.sh               # 通用启动脚本
├── utils/                      # 工具脚本
│   ├── check-github-actions.sh    # GitHub Actions状态检查
│   ├── check-github-actions.bat   # Windows版GitHub Actions检查
│   ├── check-project-status.bat   # 项目状态检查
│   ├── clean-project.sh          # 项目清理脚本
│   ├── clean-project.bat         # Windows版项目清理
│   └── inject-env-vars.sh        # 环境变量注入脚本
├── deploy-production.sh        # 生产环境部署脚本
├── deploy-production.ps1       # Windows生产环境部署脚本
├── github-release.sh           # GitHub发布脚本
├── github-release.ps1          # Windows GitHub发布脚本
├── test-separated-build.sh     # 分离构建测试脚本
└── test-separated-build.ps1    # Windows分离构建测试脚本
```

## 🔧 构建脚本 (`build/`)

### build-image.sh
Docker镜像构建脚本，支持前后端分离的镜像构建。

**功能特性：**
- 🐳 自动构建前后端Docker镜像
- 🏗️ 支持多平台构建（AMD64/ARM64）
- 🏷️ 自动标签管理和版本控制
- ⚡ 构建缓存优化，提升构建速度
- 📊 构建过程监控和日志记录

**使用方法：**
```bash
cd scripts/build
./build-image.sh

# 构建特定版本
./build-image.sh --version v1.2.0

# 构建并推送到仓库
./build-image.sh --push
```

## 🚀 开发环境脚本 (`dev/`)

### 启动脚本矩阵
| 脚本文件 | 平台支持 | 功能描述 | 推荐使用 |
|---------|---------|---------|---------|
| `start-dev.sh` | Linux/macOS | 完整开发环境启动 | ⭐⭐⭐ |
| `start-dev.ps1` | Windows PowerShell | 完整开发环境启动 | ⭐⭐⭐ |
| `start-dev.bat` | Windows CMD | 完整开发环境启动 | ⭐⭐ |
| `start-simple.bat` | Windows CMD | 简化快速启动 | ⭐ |
| `start.sh` | Linux/macOS | 通用启动脚本 | ⭐⭐ |

**核心功能：**
- ✅ 自动检查系统依赖（Node.js, Yarn, Docker等）
- 🔄 并行启动前后端服务，提高启动速度
- 📝 实时日志输出和颜色标识
- 🛠️ 智能错误处理和自动恢复
- 🔧 环境变量自动配置和验证

**使用示例：**
```bash
# Linux/macOS - 推荐方式
cd scripts/dev
./start-dev.sh

# Windows PowerShell - 推荐方式
cd scripts/dev
.\start-dev.ps1

# Windows CMD - 兼容方式
cd scripts\dev
start-dev.bat

# 快速启动（Windows）
start-simple.bat
```

## 🛠️ 工具脚本 (`utils/`)

### 项目管理工具集

#### check-github-actions (.sh/.bat)
GitHub Actions工作流监控工具

**功能：**
- 📊 检查GitHub Actions工作流状态
- ✅ 验证CI/CD配置完整性
- 🔍 监控构建和部署状态
- 📈 生成状态报告

#### check-project-status.bat
项目整体状态检查工具

**功能：**
- 🔍 检查项目整体健康状态
- 📦 验证依赖安装完整性
- ⚙️ 检查配置文件有效性
- 🚀 环境就绪状态评估

#### clean-project (.sh/.bat)
项目清理和重置工具

**功能：**
- 🧹 清理构建产物和临时文件
- 🗑️ 删除node_modules和缓存
- 🔄 重置开发环境到初始状态
- 💾 保护重要配置文件

#### inject-env-vars.sh
环境变量管理工具

**功能：**
- 🔧 动态注入环境变量
- 🌍 支持多环境配置切换
- ✅ 配置验证和格式检查
- 🔒 敏感信息安全处理

## 📦 生产部署脚本

### deploy-production (.sh/.ps1)
生产环境自动化部署脚本

**核心特性：**
- 🚀 零停机部署策略
- 📥 自动拉取最新Docker镜像
- 🏥 全面健康检查验证
- 🔄 智能回滚机制
- 📋 详细部署日志记录
- 🔐 安全配置验证

**使用方法：**
```bash
# Linux/macOS - 完整部署
./deploy-production.sh

# Windows PowerShell - 完整部署
.\deploy-production.ps1

# 查看部署状态
./deploy-production.sh status

# 查看实时日志
./deploy-production.sh logs

# 执行健康检查
./deploy-production.sh health

# 创建部署备份
./deploy-production.sh backup
```

## 🚀 发布管理脚本

### github-release (.sh/.ps1)
GitHub发布自动化管理脚本

**功能特性：**
- 📦 自动创建GitHub Release
- 📝 智能生成变更日志
- 📎 上传发布资产文件
- 🏷️ 版本标签自动管理
- 🔔 发布通知和集成

**使用方法：**
```bash
# Linux/macOS - 创建发布
./github-release.sh v1.2.0

# Windows PowerShell - 创建发布
.\github-release.ps1 -Version "v1.2.0"

# 创建预发布版本
./github-release.sh v1.2.0-beta --prerelease

# 生成变更日志
./github-release.sh --changelog-only
```

## 🧪 测试脚本

### test-separated-build (.sh/.ps1)
前后端分离构建测试脚本

**测试覆盖：**
- 🏗️ 前后端分离构建验证
- 🐳 Docker镜像功能测试
- 🔗 集成测试执行
- 📊 测试报告生成和分析
- 🚀 部署前验证检查

**使用方法：**
```bash
# Linux/macOS - 完整测试
./test-separated-build.sh

# Windows PowerShell - 完整测试
.\test-separated-build.ps1

# 仅构建测试
./test-separated-build.sh --build-only

# 生成测试报告
./test-separated-build.sh --report
```

## 🔧 使用指南

### 环境准备

#### 权限设置
```bash
# Linux/macOS - 设置执行权限
find scripts -name "*.sh" -exec chmod +x {} \;

# Windows - 设置PowerShell执行策略
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 系统要求
| 组件 | 最低版本 | 推荐版本 | 用途 |
|------|---------|---------|------|
| Bash | 4.0+ | 5.0+ | Linux/macOS脚本执行 |
| PowerShell | 5.1+ | 7.0+ | Windows脚本执行 |
| Docker | 20.10+ | 24.0+ | 容器化部署 |
| Node.js | 16.0+ | 18.0+ | 应用运行环境 |
| Git | 2.20+ | 2.40+ | 版本控制 |

### 配置文件依赖
```
项目根目录/
├── .env                    # 环境变量配置
├── package.json           # 项目配置
├── docker-compose.yml     # Docker编排配置
└── deployment/.env        # 部署环境配置
```

## 🚨 故障排除

### 常见问题解决

#### 权限相关错误
```bash
# 问题：Permission denied
# 解决：设置执行权限
chmod +x scripts/**/*.sh

# Windows PowerShell执行策略
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 依赖缺失问题
```bash
# 问题：Command not found
# 解决：检查并安装依赖
./scripts/utils/check-project-status.bat

# 安装Node.js依赖
npm install
yarn install
```

#### 环境变量问题
```bash
# 问题：环境变量格式错误
# 解决：修复环境变量格式
./deployment/fix-env-format.sh

# 检查环境变量
./scripts/utils/inject-env-vars.sh --check
```

## 🔗 相关文档

- [🚀 **部署指南**](../deployment/README.md) - 生产环境部署配置
- [🛠️ **开发文档**](../docs/development/) - 开发环境和技术文档
- [📊 **测试文档**](../testing/README.md) - 测试策略和工具
- [🔧 **工具配置**](../tools/README.md) - 开发工具和配置
- [📚 **项目文档中心**](../docs/README.md) - 完整的文档导航

### 🔄 最新更新 (v2.2.0 - 2025-08-26)
- ✅ **Docker构建优化**: 提供多架构支持和网络优化
- ✅ **脚本增强**: 改进错误处理和日志输出
- ✅ **跨平台支持**: 完善Windows/Linux/macOS兼容性
- ✅ **性能优化**: 提升脚本执行效率和可靠性

---

**ProjectContractLedger Scripts** - 让开发和部署更简单、更高效！

> 📝 如需添加新脚本或修改现有脚本，请参考[开发文档](../docs/development/)并遵循项目规范。  
> 🚀 推荐使用PowerShell脚本在Windows环境下获得最佳体验。

**文档版本**: v2.2.0  
**最后更新**: 2025-08-26  
**维护状态**: ✅ 活跃维护
