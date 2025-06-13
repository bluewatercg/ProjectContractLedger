# 客户合同管理系统 - ProjectContractLedger

基于Midway框架的现代化客户合同管理系统，采用前后端分离架构，支持完整的合同生命周期管理。

## 🚀 快速部署 (推荐)

**使用GitHub Actions自动构建的Docker镜像，支持外部MySQL和Redis的一键部署方案。**

### 生产环境快速部署
```bash
# 1. 下载部署脚本
wget https://raw.githubusercontent.com/bluewatercg/projectcontractledger/main/deploy-simple.sh
chmod +x deploy-simple.sh

# 2. 初始化部署环境
./deploy-simple.sh --init

# 3. 配置数据库信息（编辑 .env.external-simple 文件）
# 填写MySQL和Redis连接信息

# 4. 启动服务
./deploy-simple.sh
```

**访问地址**: http://your-server-ip

详细部署指南: [快速部署指南.md](./快速部署指南.md) | [GitHub Actions部署指南](./docs/GitHub_Actions_部署指南.md)

---

## ✨ 核心功能

### 业务功能
- 🏢 **客户管理** - 客户信息维护、状态管理、智能筛选
- 📋 **合同管理** - 合同创建、状态跟踪、生命周期管理
- 🧾 **发票管理** - 发票开具、状态更新、关联合同
- 💰 **支付管理** - 支付记录、状态跟踪、自动对账
- 📊 **统计分析** - 实时仪表板、收入分析、业务洞察

### 技术特性
- ⚡ **智能缓存** - 自动缓存失效机制，数据实时更新
- 🔄 **状态自动化** - 业务状态自动转换，减少手动操作
- 🎯 **精准筛选** - 多维度数据筛选，提升用户体验
- 📱 **响应式设计** - 适配各种设备，随时随地管理
- 🔐 **安全认证** - JWT认证，权限控制，数据安全

## 🛠 技术栈

### 后端 (midway-backend)
- **框架**: Midway v3 + Koa
- **语言**: TypeScript
- **数据库**: MySQL + TypeORM
- **认证**: JWT
- **文档**: Swagger
- **缓存**: 内存缓存 + 自动失效机制

### 前端 (midway-frontend)
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI组件**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP客户端**: Axios

## 📁 项目结构

```
ProjectContractLedger/
├── apps/                    # 应用程序
│   ├── backend/             # 后端服务 (端口: 8080)
│   │   ├── src/
│   │   │   ├── controller/  # API控制器
│   │   │   ├── service/     # 业务逻辑层
│   │   │   ├── entity/      # 数据实体
│   │   │   ├── middleware/  # 中间件
│   │   │   └── config/      # 配置文件
│   └── frontend/            # 前端应用 (端口: 8000)
│       ├── src/
│       │   ├── views/       # 页面组件
│       │   ├── components/  # 通用组件
│       │   ├── api/         # API接口
│       │   └── stores/      # 状态管理
├── database/               # 数据库相关
├── docs/                   # 项目文档
├── scripts/                # 项目脚本
├── tools/                  # 工具和配置
└── deployment/             # 部署配置
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 5.7
- Yarn >= 1.22.0 (推荐)

### 1. 克隆项目
```bash
git clone https://github.com/bluewatercg/projectcontractledger.git
cd projectcontractledger
```

### 2. 安装依赖
```bash
# 自动安装所有依赖
yarn install-all
```

### 3. 配置环境
```bash
# 复制环境配置文件
cp apps/backend/.env.local.template apps/backend/.env.local
# 编辑配置文件，填写数据库信息
```

### 4. 启动服务
```bash
# Windows
scripts/dev/start-simple.bat

# Windows PowerShell (推荐)
yarn start-ps

# Linux/Mac
yarn start-sh
```

### 5. 访问应用
- 前端应用: http://localhost:8000
- 后端API: http://localhost:8080
- API文档: http://localhost:8080/api-docs

### 6. 默认登录
- **用户名**: admin
- **密码**: admin123

## 🎯 业务流程

### 完整业务流程
```
客户创建 → 合同签订 → 发票开具 → 支付记录 → 合同完成
    ↓         ↓         ↓         ↓         ↓
  活跃状态   执行中     已发送     已完成    已完成
```

### 状态自动转换
- **合同状态**: 草稿 → 执行中 → 已完成
- **发票状态**: 草稿 → 已发送 → 已支付
- **支付状态**: 待处理 → 已完成 → 失败

## 🔧 最新功能更新

### v2.0.0 (2024-12-13) - 重大更新

#### 🎯 智能筛选优化
- ✅ **开票页面**: 支持草稿状态合同的客户筛选
- ✅ **支付页面**: 支持草稿状态发票的客户筛选
- ✅ **统一筛选逻辑**: 确保业务流程的连贯性

#### ⚡ 缓存失效机制
- ✅ **自动缓存清除**: 数据变更时自动清除相关缓存
- ✅ **实时数据更新**: 统计数据实时反映最新状态
- ✅ **性能优化**: 减少不必要的数据库查询

#### 🎨 用户体验提升
- ✅ **发票选择优化**: 显示开票时间和金额，更贴近实际使用
- ✅ **API路由统一**: 开发和生产环境配置一致
- ✅ **依赖注入修复**: 解决DataSource注入问题

#### 🔄 业务逻辑完善
- ✅ **状态转换**: 创建发票时自动将合同状态从草稿转为执行中
- ✅ **数据关联**: 完善客户、合同、发票、支付的关联关系
- ✅ **业务验证**: 增强数据一致性和业务规则验证

## 📊 核心API接口

### 认证相关
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh` - 刷新Token

### 业务管理
- `GET /api/v1/customers` - 客户列表（支持智能筛选）
- `GET /api/v1/contracts` - 合同列表
- `GET /api/v1/invoices` - 发票列表
- `GET /api/v1/payments` - 支付记录
- `GET /api/v1/statistics/dashboard` - 仪表板统计

### 缓存管理
- `DELETE /api/v1/statistics/cache/clear` - 清除统计缓存

## 🔍 故障排除

### 常见问题

1. **新建合同后开票页面找不到客户**
   - ✅ 已修复：现在支持草稿状态合同的客户筛选

2. **创建发票后支付页面找不到客户**
   - ✅ 已修复：现在支持草稿状态发票的客户筛选

3. **统计数据不更新**
   - ✅ 已修复：实现自动缓存失效机制

4. **开发环境API调用失败**
   - ✅ 已修复：统一开发和生产环境API路由配置

### 开发调试
```bash
# 检查后端服务状态
curl http://localhost:8080/api/v1/statistics/dashboard

# 清除缓存
curl -X DELETE http://localhost:8080/api/v1/statistics/cache/clear

# 查看日志
tail -f apps/backend/logs/midway-core.log
```

## 📚 文档链接

- [API开发指南](./docs/development/API_Development_Guide.md)
- [数据库设计](./docs/development/Database_Design.md)
- [部署指南](./docs/development/Docker_Deployment.md)
- [业务状态说明](./docs/user-guide/业务状态关系说明.md)
- [启动指南](./docs/user-guide/启动指南.md)
- [项目结构说明](./docs/user-guide/项目结构说明-新版.md)

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🎯 使用场景

### 适用行业
- 🏢 **服务业**: 咨询、设计、培训等服务合同管理
- 🏭 **制造业**: 供应商合同、采购合同管理
- 🏗️ **建筑业**: 工程合同、分包合同管理
- 💼 **贸易业**: 销售合同、代理合同管理

### 典型用户
- **财务人员**: 发票管理、收款跟踪、财务报表
- **销售人员**: 客户管理、合同跟进、业绩统计
- **项目经理**: 合同执行、进度跟踪、成本控制
- **管理层**: 业务概览、决策支持、趋势分析

## 🔧 高级配置

### 环境变量配置
```env
# 应用配置
NODE_ENV=production
PORT=8080

# 数据库配置
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_DATABASE=contract_ledger

# Redis配置（可选）
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT配置
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# 文件存储配置
MINIO_ENDPOINT=https://oss.huijg.cn
MINIO_BUCKET=qiji/ProjectContractLedger
```

### 性能优化
- **缓存策略**: 统计数据缓存5分钟，自动失效
- **分页查询**: 默认每页10条，支持自定义
- **索引优化**: 关键字段建立索引，提升查询性能
- **连接池**: 数据库连接池优化，支持高并发

## 📈 监控与运维

### 日志管理
```bash
# 查看应用日志
tail -f apps/backend/logs/midway-core.log

# 查看错误日志
tail -f apps/backend/logs/common-error.log

# 查看访问日志
tail -f apps/backend/logs/midway-web.log
```

### 健康检查
```bash
# 检查服务状态
curl http://localhost:8080/health

# 检查数据库连接
curl http://localhost:8080/api/v1/statistics/dashboard

# 检查缓存状态
curl http://localhost:8080/api/v1/statistics/cache/status
```

### 备份策略
- **数据库备份**: 建议每日自动备份
- **文件备份**: 合同附件定期备份
- **配置备份**: 环境配置文件版本控制

## 🚀 扩展开发

### 添加新功能模块
1. **后端开发**:
   ```typescript
   // 1. 创建实体
   @Entity()
   export class NewEntity {
     @PrimaryGeneratedColumn()
     id: number;
   }

   // 2. 创建服务
   @Provide()
   export class NewService {
     // 业务逻辑
   }

   // 3. 创建控制器
   @Controller('/api/v1/new')
   export class NewController {
     // API接口
   }
   ```

2. **前端开发**:
   ```vue
   <!-- 1. 创建页面组件 -->
   <template>
     <div class="new-page">
       <!-- 页面内容 -->
     </div>
   </template>

   <script setup lang="ts">
   // 2. 添加业务逻辑
   </script>
   ```

3. **路由配置**:
   ```typescript
   // 添加到 router/index.ts
   {
     path: '/new',
     component: () => import('@/views/NewPage.vue')
   }
   ```

### 自定义组件开发
- **表单组件**: 基于Element Plus封装
- **表格组件**: 支持分页、排序、筛选
- **图表组件**: 基于ECharts的数据可视化
- **上传组件**: 支持MinIO文件存储

## 📞 支持与社区

### 获取帮助
- 📖 [在线文档](https://github.com/bluewatercg/projectcontractledger/wiki)
- 🐛 [问题反馈](https://github.com/bluewatercg/projectcontractledger/issues)
- 💬 [讨论区](https://github.com/bluewatercg/projectcontractledger/discussions)

### 贡献代码
- 🔧 [开发指南](./docs/development/API_Development_Guide.md)
- 📋 [代码规范](./docs/development/Code_Standards.md)
- 🧪 [测试指南](./testing/docs/Testing_Guide.md)

### 版本发布
- 📦 [发布说明](https://github.com/bluewatercg/projectcontractledger/releases)
- 🗺️ [开发路线图](./docs/user-guide/Roadmap.md)
- 📊 [更新日志](./CHANGELOG.md)

---

**ProjectContractLedger** - 让合同管理更简单、更智能！

> 🌟 如果这个项目对您有帮助，请给我们一个Star！
