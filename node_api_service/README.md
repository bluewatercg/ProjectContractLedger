# 客户合同管理系统 - 后端API服务

## 概述

这是客户合同管理系统的后端API服务，基于Node.js和Express.js开发，使用MySQL作为数据库。API设计遵循RESTful风格，实现了客户、合同、发票和付款的管理功能。

## 目录结构

```
├── config/           # 配置文件
│   ├── database.js   # 数据库配置
│   └── config.js     # 应用配置
├── controllers/      # 控制器
│   ├── authController.js
│   ├── customerController.js
│   ├── contractController.js
│   ├── invoiceController.js
│   ├── paymentController.js
│   └── statisticsController.js
├── models/           # 数据模型
│   ├── userModel.js
│   ├── customerModel.js
│   ├── contractModel.js
│   ├── invoiceModel.js
│   └── paymentModel.js
├── routes/           # 路由定义
│   ├── authRoutes.js
│   ├── customerRoutes.js
│   ├── contractRoutes.js
│   ├── invoiceRoutes.js
│   ├── paymentRoutes.js
│   └── statisticsRoutes.js
├── utils/            # 工具函数
│   ├── errorHandler.js
│   ├── jwtHelper.js
│   └── validators.js
├── app.js            # 应用入口
├── server.js         # 服务器启动文件
├── package.json      # 依赖配置
└── README.md         # 说明文档
```

## 技术栈

- Node.js v16+
- Express.js v4.18+
- MySQL v8.0+
- mysql2 (MySQL客户端)
- jsonwebtoken (JWT认证)
- dotenv (环境变量管理)
- cors (跨域资源共享)

## 开发指南

### 环境要求

- Node.js v16或更高版本
- MySQL v8.0或更高版本

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建`.env`文件并设置以下变量：

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=procontractledger
PORT=8080
JWT_SECRET=your_jwt_secret_key
```

### 初始化数据库

使用MySQL客户端执行以下SQL脚本：

1. `database/scripts/mysql_init.sql` - 创建数据库和表结构
2. `database/scripts/seed_data.sql` - 插入初始测试数据

### 启动服务器

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

服务器将在http://localhost:8080/api/v1运行

## 最新更新与修复

- **SQL 查询参数问题修复**: 修复了 `controllers/customerController.js` (getAllCustomers), `controllers/contractController.js` (getAllContracts), `controllers/invoiceController.js` (getAllInvoices), 和 `controllers/paymentController.js` (getAllPayments) 函数中，由于 `LIMIT` 和 `OFFSET` 参数传递不当导致的 `Incorrect arguments to mysqld_stmt_execute` 错误。现在这些参数直接拼接到 SQL 字符串中。
- **统计数据类型错误修复**: 修复了 `controllers/statisticsController.js` 中 `getContractAmountStatistics` 和 `getContractPaymentCollectionStatistics` 函数，由于数据库返回的金额字段为字符串类型，导致 `TypeError: .toFixed is not a function` 的问题。现在已在调用 `toFixed` 前将相关字段转换为浮点数。
- **数据库连接方法统一**: 修复了 `controllers/statisticsController.js` 中 `db.query` 方法不存在的问题，统一使用 `pool.execute` 进行数据库操作。
- **开发环境热部署**: 确认项目已配置 `nodemon` 作为开发依赖，支持代码更改后服务自动重启。开发者可以通过 `npm run dev` 命令启动服务以利用此功能。

## API文档

API设计遵循`backend_service/api_spec.yaml`中定义的OpenAPI规范。

主要API端点包括：

- `/api/v1/auth` - 认证相关
- `/api/v1/customers` - 客户管理
- `/api/v1/contracts` - 合同管理
- `/api/v1/invoices` - 发票管理
- `/api/v1/payments` - 付款管理
- `/api/v1/statistics` - 数据统计

详细的API文档可通过以下方式查看：

1. 启动服务器后访问 http://localhost:8080/api-docs
2. 查看 `backend_service/api_spec.yaml` 文件

## 部署说明

1. 确保Node.js环境已安装
2. 设置生产环境变量
3. 安装PM2或类似工具进行进程管理：
   ```
   npm install -g pm2
   pm2 start server.js --name "contract-api"
   ```
