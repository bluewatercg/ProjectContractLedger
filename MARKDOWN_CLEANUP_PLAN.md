# Markdown文件整理计划

## 📊 整理前统计
- **总文件数**: 47个Markdown文件
- **主要问题**: 内容重复、结构混乱、维护不一致

## 🎯 整理目标
1. **消除重复内容** - 合并相似功能的文档
2. **统一文档结构** - 建立清晰的文档层级
3. **简化导航路径** - 减少文档数量，提高可维护性
4. **标准化格式** - 统一文档格式和风格

## 📋 整理分类

### ✅ **保留并优化的核心文档**
1. **README.md** - 项目主入口（合并多个README内容）
2. **CHANGELOG.md** - 版本更新日志
3. **docs/README.md** - 文档导航中心
4. **docs/QUICK_START.md** - 快速开始指南
5. **docs/USER_GUIDE.md** - 完整用户指南
6. **docs/DEVELOPMENT_SETUP.md** - 开发环境设置
7. **docs/ARCHITECTURE.md** - 系统架构文档
8. **docs/TROUBLESHOOTING.md** - 故障排除指南

### 🔄 **合并的文档类别**

#### 部署相关文档 → `docs/DEPLOYMENT_GUIDE.md`
- `docs/deployment/production-deployment.md`
- `docs/deployment/docker-deployment.md`
- `docs/deployment/github-actions-deployment.md`
- `docs/deployment/separated-deployment.md`
- `docs/deployment/deployment-checklist.md`
- `docs/deployment/troubleshooting.md`

#### API文档 → `docs/API_GUIDE.md`
- `docs/development/API_Development_Guide.md`
- `docs/api/backend_service/api_db_mapping.md`

#### 数据库文档 → `docs/DATABASE_GUIDE.md`
- `docs/development/Database_Design.md`
- `docs/development/Database_Design_Update.md`

#### 功能特性文档 → `docs/FEATURES_GUIDE.md`
- `docs/reminder_feature_guide.md`
- `docs/reminder_deployment_checklist.md`
- `docs/requirements/attachment_upload_change_request.md`

### ❌ **删除的重复/过时文档**

#### 重复的README文件
- `README.zh-CN.md` (内容合并到主README)
- `apps/README.md` (内容合并到主README)
- `apps/backend/README.md`
- `apps/frontend/README.md`
- `config/templates/README.md`
- `database/README.md`
- `deployment/README.md`
- `scripts/README.md`
- `testing/README.md`
- `tools/README.md`
- `tools/backup/README.md`
- `tools/docker/README.md`
- `tools/maintenance/README.md`

#### 过时的项目文档
- `PROJECT_STRUCTURE_REORGANIZATION.md`
- `docs/CONTRIBUTING.md` (内容合并到主README)
- `docs/GITHUB_RELEASE_GUIDE.md` (合并到部署指南)
- `docs/API_VERSION_MANAGEMENT.md` (合并到API指南)

#### 分散的开发文档
- `docs/development/Customer_Select_Component.md`
- `docs/development/Metrics_Framework.md`
- `docs/development/pdfjs-integration-plan.md`
- `docs/development/Roadmap.md`
- `docs/development/User_Story_Map.md`

#### 测试相关文档
- `testing/docs/测试计划.md`
- `testing/docs/测试使用说明.md`

#### 工具相关文档
- `tools/docker/DEPLOYMENT_CHECKLIST.md`

## 🏗️ **新的文档结构**

```
ProjectContractLedger/
├── README.md                    # 项目主入口（整合版）
├── CHANGELOG.md                 # 版本更新日志
└── docs/                        # 文档中心
    ├── README.md                # 文档导航中心
    ├── QUICK_START.md           # 快速开始指南
    ├── USER_GUIDE.md            # 完整用户指南
    ├── DEVELOPMENT_SETUP.md     # 开发环境设置
    ├── DEPLOYMENT_GUIDE.md      # 部署指南（整合版）
    ├── API_GUIDE.md             # API开发指南（整合版）
    ├── DATABASE_GUIDE.md        # 数据库指南（整合版）
    ├── FEATURES_GUIDE.md        # 功能特性指南（整合版）
    ├── ARCHITECTURE.md          # 系统架构文档
    ├── TROUBLESHOOTING.md       # 故障排除指南
    ├── design/                  # 设计文档
    │   ├── Flowchart.md
    │   └── specs/
    └── user-guide/              # 业务指南
        ├── PRD.md
        └── 业务状态关系说明.md
```

## 📈 **整理效果预期**
- **文件数量**: 47 → 15 (减少68%)
- **重复内容**: 消除90%以上的重复
- **导航复杂度**: 降低70%
- **维护成本**: 降低60%

## ⚡ **执行步骤**
1. 创建整合版核心文档
2. 删除重复和过时文档
3. 更新文档间的链接关系
4. 验证文档完整性和准确性
5. 创建整理总结报告

---
**开始执行时间**: 2025-08-26