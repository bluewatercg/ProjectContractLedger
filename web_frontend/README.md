# 客户合同管理系统 - 前端

## 概述

这是客户合同管理系统的前端部分，基于HTML、CSS和JavaScript开发，使用Tailwind CSS进行样式设计。前端直接基于`design/prototypes/`目录中的高保真HTML原型进行开发，实现了与后端API的交互。

## 目录结构

```
├── assets/           # 静态资源
│   ├── css/          # CSS样式文件
│   ├── js/           # JavaScript文件
│   └── images/       # 图片资源
├── pages/           # HTML页面
└── README.md        # 说明文档
```

## 开发指南

### 环境要求

- 现代浏览器（Chrome, Firefox, Safari, Edge等）
- 可选：Node.js环境（用于启动本地开发服务器）

### 本地开发

1. 使用任意HTTP服务器启动前端（例如使用Node.js的http-server）：
   ```
   npx http-server -p 3000
   ```

2. 在浏览器中访问：http://localhost:3000

### API配置

前端默认连接到`http://localhost:8080/api/v1`的后端API。如需修改API地址，请编辑`assets/js/config.js`文件。

## 页面说明

- `index.html` - 登录页面
- `dashboard.html` - 仪表盘/首页
- `customers.html` - 客户列表
- `customer-create.html` - 创建客户
- `customer-detail.html` - 客户详情
- `customer-invoice-info.html` - 客户开票信息
- `contracts.html` - 合同列表
- `contract-create.html` - 创建合同
- `contract-detail.html` - 合同详情
- `invoices.html` - 发票列表
- `invoice-create.html` - 创建发票
- `payments.html` - 付款列表
- `payment-create.html` - 创建付款记录
- `notifications.html` - 提醒中心
- `settings.html` - 系统设置