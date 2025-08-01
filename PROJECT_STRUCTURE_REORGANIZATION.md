# 项目结构重组说明

## 📋 重组概述

为了提高项目的可维护性和组织性，对根目录下的文件进行了重新整理和分类。

## 🔄 文件移动记录

### 1. 备份工具 → `tools/backup/`
- ✅ `backup-system.sh` → `tools/backup/backup-system.sh`
- ✅ `restore-system.sh` → `tools/backup/restore-system.sh`
- ✅ `setup-auto-backup.sh` → `tools/backup/setup-auto-backup.sh`
- ✅ `check-backup-status.sh` → `tools/backup/check-backup-status.sh`

### 2. 维护工具 → `tools/maintenance/`
- ✅ `fix-contract-upload-issue.sh` → `tools/maintenance/fix-contract-upload-issue.sh`
- ✅ `fix-upload-issue.sh` → `tools/maintenance/fix-upload-issue.sh`
- ✅ `debug-database-connection.sh` → `tools/maintenance/debug-database-connection.sh`
- ✅ `debug-container-upload.sh` → `tools/maintenance/debug-container-upload.sh`
- ✅ `debug-upload-issue.js` → `tools/maintenance/debug-upload-issue.js`
- ✅ `check-docker-env.sh` → `tools/maintenance/check-docker-env.sh`
- ✅ `check-env-path.sh` → `tools/maintenance/check-env-path.sh`

### 3. 过时修复文档 → 已删除 ✅
- ✅ `API_PATH_FIX_SUMMARY.md` → 已删除（问题已在最新代码中修复）
- ✅ `LOGIN_API_FIX_SUMMARY.md` → 已删除（问题已在最新代码中修复）
- ✅ `UPLOAD_FIX_SUMMARY.md` → 已删除（问题已在最新代码中修复）
- ✅ `UPLOAD_PREVIEW_ISSUE_ANALYSIS.md` → 已删除（问题已在最新代码中修复）
- ✅ `DEPLOYMENT_UPLOAD_FIX.md` → 已删除（问题已在最新代码中修复）

### 4. 部署文档 → `docs/`（避免与deployment/目录混淆）
- ✅ `DEPLOYMENT_GUIDE.md` → `docs/DEPLOYMENT_GUIDE.md`
- ✅ `DOCKER_DEPLOYMENT_SUMMARY.md` → `docs/DOCKER_DEPLOYMENT_SUMMARY.md`
- ✅ `SEPARATED_DEPLOYMENT_SUMMARY.md` → `docs/SEPARATED_DEPLOYMENT_SUMMARY.md`
- ✅ `build-checklist.md` → `docs/build-checklist.md`
- ✅ `docker-build-guide.md` → `docs/docker-build-guide.md`
- ✅ `dockerfile-configuration.md` → `docs/dockerfile-configuration.md`
- ✅ `分离式前后端部署指南.md` → `docs/分离式前后端部署指南.md`

### 5. 配置模板 → `config/templates/`
- ✅ `.env.production.template` → `config/templates/.env.production.template`
- ✅ `.env.local.template` → `config/templates/.env.local.template`
- ✅ `.env.unittest.template` → `config/templates/.env.unittest.template`
- ✅ `.env.external-simple.template` → `config/templates/.env.external-simple.template`
- ✅ `.env.example` → `config/templates/.env.example`
- ✅ `.env.lan.example` → `config/templates/.env.lan.example`

### 6. 发布文档 → `docs/`
- ✅ `GITHUB_RELEASE_GUIDE.md` → `docs/GITHUB_RELEASE_GUIDE.md`

## 📁 新的目录结构

```
ProjectContractLedger/
├── 📁 apps/                    # 应用程序
├── 📁 config/                  # 配置文件
│   └── 📁 templates/           # 环境配置模板
├── 📁 database/               # 数据库相关
├── 📁 deployment/             # 部署配置和脚本
├── 📁 docs/                   # 项目文档
│   ├── � DEPeLOYMENT_GUIDE.md # 部署指南
│   ├── 📄 DOCKER_DEPLOYMENT_SUMMARY.md
│   ├── 📄 GITHUB_RELEASE_GUIDE.md
│   └── 📄 TROUBLESHOOTING.md  # 故障排除指南
├── 📁 scripts/                # 构建和部署脚本
├── 📁 tools/                  # 工具脚本
│   ├── 📁 backup/            # 备份和恢复工具
│   └── 📁 maintenance/       # 维护和调试工具
├── 📄 README.md               # 项目说明
├── 📄 README.zh-CN.md         # 中文说明
└── 📄 package.json            # 项目配置
```

## 🎯 重组优势

### 1. **更清晰的分类**
- 备份工具集中在 `tools/backup/`
- 维护工具集中在 `tools/maintenance/`
- 配置模板集中在 `config/templates/`
- 文档按类型分类在 `docs/` 子目录

### 2. **更好的可维护性**
- 相关功能的脚本放在一起
- 每个目录都有对应的README说明
- 减少根目录的文件数量

### 3. **更规范的结构**
- 符合现代项目的目录组织规范
- 便于新开发者理解项目结构
- 便于CI/CD和自动化工具处理

## 🔧 使用方法更新

### 备份操作
```bash
# 旧方式
./backup-system.sh

# 新方式
cd tools/backup
./backup-system.sh
```

### 维护操作
```bash
# 旧方式
./fix-contract-upload-issue.sh

# 新方式
cd tools/maintenance
./fix-contract-upload-issue.sh
```

### 配置文件
```bash
# 旧方式
cp .env.production.template .env

# 新方式
cp config/templates/.env.production.template deployment/.env
```

## ⚠️ 注意事项

1. **脚本路径更新**：如果有自动化脚本引用了这些文件，需要更新路径
2. **文档链接**：检查文档中的内部链接是否需要更新
3. **CI/CD配置**：如果CI/CD流程中引用了这些文件，需要相应调整
4. **用户习惯**：团队成员需要适应新的目录结构

## ✅ 完成状态

- ✅ 文件移动完成
- ✅ 目录README创建完成
- ✅ 主README更新完成
- ✅ 项目结构文档更新完成

## 📝 第二轮整理（用户指南优化）

### 🗑️ **删除的重复文档**
- ✅ `docs/user-guide/启动指南.md` → 已删除（内容合并到USER_GUIDE.md）
- ✅ `docs/user-guide/快速部署指南.md` → 已删除（内容合并到USER_GUIDE.md）
- ✅ `docs/user-guide/Yarn命令指南.md` → 已删除（内容合并到USER_GUIDE.md）
- ✅ `docs/user-guide/项目结构说明.md` → 已删除（与README重复）

### 🔄 **移动的开发文档**
- ✅ `docs/user-guide/Roadmap.md` → `docs/development/Roadmap.md`
- ✅ `docs/user-guide/User_Story_Map.md` → `docs/development/User_Story_Map.md`
- ✅ `docs/user-guide/Customer_Select_Component.md` → `docs/development/Customer_Select_Component.md`

### 📋 **保留的核心文档**
- ✅ `docs/user-guide/PRD.md` - 产品需求文档（高价值）
- ✅ `docs/user-guide/业务状态关系说明.md` - 业务逻辑说明（高价值）

### 🆕 **新增的整合文档**
- ✅ `docs/USER_GUIDE.md` - 完整用户指南（整合了启动、部署、命令等内容）

## 📝 后续建议

1. **更新CI/CD配置**：检查GitHub Actions等自动化流程
2. **更新文档链接**：检查所有文档中的内部链接
3. **团队通知**：通知团队成员新的目录结构
4. **清理检查**：定期检查是否有遗漏的文件需要整理