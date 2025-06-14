# Database 文件夹说明

本文件夹包含数据库相关的脚本、迁移文件和设计文档。

## 📁 文件夹结构

```
database/
├── diagrams/         # 数据库设计图表
├── migrations/       # 数据库迁移文件
└── scripts/          # 数据库脚本
```

## 📊 Diagrams 文件夹 (`database/diagrams/`)

### 设计文档
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `ER_Diagram.md` | 实体关系图文档 | ✅ 活跃维护 |

**说明**：包含数据库的实体关系图和表结构设计说明。

## 🔄 Migrations 文件夹 (`database/migrations/`)

### 迁移文件
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `add_performance_indexes.sql` | 性能优化索引迁移 | ✅ 生产就绪 |

**说明**：
- 包含数据库结构变更的迁移文件
- 按时间顺序执行，确保数据库结构一致性
- 主要用于性能优化和结构调整

## 📜 Scripts 文件夹 (`database/scripts/`)

### 初始化脚本
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `mysql_init.sql` | MySQL数据库初始化脚本 | ✅ 生产就绪 |
| `seed_data.sql` | 初始数据种子文件 | ✅ 生产就绪 |

### 查询脚本
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `queries.sql` | 常用查询语句集合 | ✅ 开发工具 |

### 工具脚本
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `apply-mysql-indexes.js` | MySQL索引应用工具 | ✅ 运维工具 |

## 🗄️ 数据库表结构

### 核心业务表
- **users** - 用户表
- **customers** - 客户表
- **contracts** - 合同表
- **contract_items** - 合同条目表
- **payments** - 付款记录表
- **invoices** - 发票表

### 系统表
- **audit_logs** - 审计日志表
- **system_settings** - 系统设置表

## 🚀 使用指南

### 1. 初始化数据库
```bash
# 执行初始化脚本
mysql -u root -p < database/scripts/mysql_init.sql

# 导入种子数据
mysql -u root -p your_database < database/scripts/seed_data.sql
```

### 2. 应用性能索引
```bash
# 使用Node.js脚本应用索引
cd database/scripts
node apply-mysql-indexes.js

# 或直接执行SQL
mysql -u root -p your_database < database/migrations/add_performance_indexes.sql
```

### 3. 执行常用查询
```bash
# 查看常用查询示例
cat database/scripts/queries.sql
```

## 📋 数据库配置

### 生产环境
- **主机**: 192.168.1.254
- **端口**: 3306
- **数据库**: procontractledger
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci

### 开发环境
- **主机**: mysql.sqlpub.com
- **端口**: 3306
- **数据库**: procontractledger

## 🔧 维护说明

### 索引优化
- 定期检查查询性能
- 根据业务需求添加新索引
- 清理不必要的索引

### 数据备份
- 建议每日备份生产数据
- 保留至少30天的备份历史
- 测试备份恢复流程

### 迁移管理
- 新的结构变更需要创建迁移文件
- 迁移文件需要包含回滚脚本
- 在生产环境执行前先在测试环境验证

## 🔗 相关文档

- [数据库设计文档](../docs/development/Database_Design.md)
- [数据库设计更新说明](../docs/development/Database_Design_Update.md)
- [API开发指南](../docs/development/API_Development_Guide.md)
