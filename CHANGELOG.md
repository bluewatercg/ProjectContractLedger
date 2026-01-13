# 📅 Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-01-13

### 👤 用户与套账管理 (User & Ledger Management)

#### Added
- **用户管理**: 完整的用户 CRUD 功能，集成角色访问控制。
- **套账管理 (Kits)**: 支持多套账并行，支持用户层级的套账授权与管理。
- 增加用户与套账配置页面及其侧边栏入口。

### 📊 财务深度分析与标准化 (Financial Analysis & Standards)

#### Added
- **账龄分析**: 实现应收账款账龄分析逻辑，支持财务精准催收。
- **统一枚举值库**: 对合同、发票、支付状态及方式进行了全局统一命名，确保数据分析一致性。
- 仪表盘集成 ECharts，可视化展示收入趋势、发票分布及顶级客户贡献。

### ⚡ 性能与体验优化 (Performance & UX)

#### Added
- **增强预览**: 采用 Base64 -> Blob 方案实现高效、安全的 PDF 与图片在线预览。
- **无限滚动**: 全局列表（客户、合同、发票等）支持海量数据流畅加载。
- **智能提醒**: 消息跳转精准定位，附件 due_date 账期全流程同步。

### 🔧 技术底座增强 (Infrastructure)

#### Added
- 全面支持 OpenAPI 3.0 规范。
- 优化 Docker 部署脚本，解决 Windows 环境下的换行符兼容性问题。
- 后端服务稳定性增强，修复发票选择等业务流程中的数据一致性 Bug。

## [2.2.0] - 2025-08-26

### 🔧 构建系统优化 (Build System Optimization)

#### Added
- 多架构Docker镜像支持 (ARM64 + AMD64)
- Docker构建多重策略和重试机制
- GitHub Actions构建缓存优化
- 网络连接超时配置和重试机制
- Docker buildx多平台构建支持

#### Fixed
- 解决Docker构建中yarn网络超时问题
- 修复ARM64平台下的依赖安装失败
- 优化GitHub Actions中的依赖安装流程
- 改进构建缓存策略，提升构建效率

#### Changed
- 优化Dockerfile，使用Node.js 18-alpine基础镜像
- 改进yarn配置，增加网络超时和并发限制
- 提供NPM作为备用包管理器

### 📚 文档系统重构 (Documentation System Refactoring)

#### Added
- 创建统一的文档导航中心 (`docs/README.md`)
- 完整的文档分类索引和快速导航
- Markdown文件整理总结报告
- 角色导向的文档使用指南

#### Removed
- 删除7个重复和过时的Markdown文件
- 清理临时文档和未完成的计划文档
- 移除重复的README文件

#### Changed
- 重构主README.md，整合中英双语内容
- 建立统一的文档命名规范
- 优化文档目录结构，提升可维护性

### 🐛 代码质量提升 (Code Quality Improvements)

#### Fixed
- 修复TypeScript装饰器导入问题 (`reminder.controller.ts`)
- 修复对象字面量语法错误 (`reminder.service.ts`)
- 解决ESLint配置缺失问题

#### Added
- 完善前端ESLint配置和依赖管理
- 创建`.gitignore`和`.eslintrc.json`配置文件
- 统一前后端代码规范检查

## [2.1.0] - 2025-06-16

### 📎 附件管理功能 (Attachment Management)

#### Added
- 文件上传功能，支持拖拽上传和实时进度显示
- 支持PDF、JPG、JPEG、PNG格式文件
- PDF和图片在线预览功能
- 文件类型白名单和大小限制 (10MB)
- 本地存储和Docker卷持久化
- 基于JWT的文件访问控制

#### Changed
- 优化Docker部署，数据和日志目录映射到宿主机
- 提供开发和生产环境一键启动脚本
- 添加系统监控和备份脚本
- 完善环境变量配置模板

## [2.0.0] - 2024-12-13

### 🎯 智能筛选优化 (Smart Filtering Optimization)

#### Added
- 开票页面支持草稿状态合同的客户筛选
- 支付页面支持草稿状态发票的客户筛选
- 统一筛选逻辑，确保业务流程连贯性

#### Fixed
- 实现自动缓存清除机制，数据变更时自动清除相关缓存
- 修复统计数据实时更新问题
- 解决DataSource注入问题

#### Changed
- 优化发票选择显示，显示开票时间和金额
- 统一开发和生产环境API路由配置
- 完善客户、合同、发票、支付的关联关系

### 🔄 业务逻辑完善 (Business Logic Enhancement)

#### Added
- 创建发票时自动将合同状态从草稿转为执行中
- 增强数据一致性和业务规则验证

#### Changed
- 优化缓存失效机制，提升性能
- 改进用户体验，提供更贴近实际使用的功能

## [1.0.0] - 2024-10-01

### 🚀 初始版本发布 (Initial Release)

#### Added
- 基于Midway.js + Vue3的现代化架构
- 客户管理功能
- 合同管理功能
- 发票管理功能
- 支付管理功能
- 统计分析功能
- JWT身份认证
- MySQL数据库支持
- Element Plus UI组件库
- Swagger API文档
- Docker容器化部署

#### Features
- 完整的前后端分离架构
- RESTful API设计
- 响应式前端界面
- 数据库迁移脚本
- 开发环境快速启动脚本

---

## 📋 版本发布说明

### 版本号规范
- **主版本号 (Major)**: 重大架构变更或不兼容的API修改
- **次版本号 (Minor)**: 新功能添加，向下兼容
- **修订版本号 (Patch)**: Bug修复和小改进

### 发布类型说明
- 🚀 **Added**: 新功能
- 🔧 **Changed**: 功能修改  
- 🐛 **Fixed**: Bug修复
- ❌ **Removed**: 功能移除
- 🔒 **Security**: 安全相关

### 发布流程
1. 更新CHANGELOG.md
2. 更新package.json版本号
3. 创建Git标签
4. 发布GitHub Release
5. 自动构建和部署Docker镜像

---

## 🔗 相关链接

- [项目主页](https://github.com/bluewatercg/projectcontractledger)
- [发布页面](https://github.com/bluewatercg/projectcontractledger/releases)
- [问题反馈](https://github.com/bluewatercg/projectcontractledger/issues)
- [文档中心](./docs/README.md)