# 客户合同管理系统 - 客户管理API对接方案

## 📋 概述

基于您提供的Swagger API文档和访问令牌，我已经为您创建了完整的客户管理API对接方案。该方案包括JavaScript服务类、HTML演示页面、curl测试命令等多种对接方式。

## 🔑 认证配置

### 访问令牌
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHFpamkuY29tIiwiaWF0IjoxNzQ4OTM2MDg5LCJleHAiOjE3NDkwMjI0ODl9.W7dKfYNo5YL2Nwn622-yQB8_dGWCKkf9awdI8Hfm8mY
```

### API基础地址
- 开发环境: `http://127.0.0.1:8080/api/v1`
- API文档: `http://127.0.0.1:8080/api-docs`

## 📁 文件结构

```
├── frontend/
│   ├── assets/js/
│   │   ├── services/
│   │   │   └── customerService.js          # 客户管理服务类
│   │   ├── examples/
│   │   │   └── customerServiceExample.js   # 使用示例
│   │   └── config/
│   │       └── api.js                      # API配置文件
│   └── customer-management-demo.html       # 客户管理演示页面
├── test-customer-api.js                    # Node.js测试脚本
├── test-curl-commands.md                   # curl命令集合
└── 客户管理API对接方案.md                   # 本文档
```

## 🚀 快速开始

### 1. JavaScript服务类方式

```javascript
import CustomerService from './frontend/assets/js/services/customerService.js';

// 创建服务实例
const customerService = new CustomerService();

// 设置访问令牌
customerService.setToken('your_access_token_here');

// 获取客户列表
const customers = await customerService.getAllCustomers({
  page: 1,
  pageSize: 10,
  name: '搜索关键词'
});

// 创建新客户
const newCustomer = await customerService.createCustomer({
  name: '客户名称',
  contact_person: '联系人',
  phone: '13800138000',
  email: 'contact@example.com',
  address: '客户地址',
  notes: '备注信息'
});
```

### 2. HTML演示页面

打开 `frontend/customer-management-demo.html` 文件，在浏览器中直接使用图形界面进行客户管理操作。

### 3. curl命令方式

参考 `test-curl-commands.md` 文件中的命令，直接在命令行中测试API。

## 🔧 API接口详情

### 客户管理接口

| 功能 | 方法 | 端点 | 说明 |
|------|------|------|------|
| 获取客户列表 | GET | `/customers` | 支持分页和搜索 |
| 获取客户详情 | GET | `/customers/{id}` | 根据ID获取单个客户 |
| 创建客户 | POST | `/customers` | 创建新客户 |
| 更新客户 | PUT | `/customers/{id}` | 更新客户信息 |
| 删除客户 | DELETE | `/customers/{id}` | 删除客户 |

### 开票信息管理接口

| 功能 | 方法 | 端点 | 说明 |
|------|------|------|------|
| 获取开票信息 | GET | `/customers/{id}/invoice-infos` | 获取客户的开票信息列表 |
| 创建开票信息 | POST | `/customers/{id}/invoice-infos` | 为客户创建开票信息 |
| 更新开票信息 | PUT | `/customers/{id}/invoice-infos/{infoId}` | 更新开票信息 |
| 删除开票信息 | DELETE | `/customers/{id}/invoice-infos/{infoId}` | 删除开票信息 |

## 📝 数据结构

### 客户数据结构

```javascript
{
  "customer_id": 1,                    // 客户ID（只读）
  "name": "客户名称",                   // 必填
  "contact_person": "联系人",           // 可选
  "phone": "13800138000",              // 可选
  "email": "contact@example.com",      // 可选
  "address": "客户地址",                // 可选
  "notes": "备注信息",                  // 可选
  "created_at": "2023-01-01T00:00:00Z", // 创建时间（只读）
  "updated_at": "2023-01-01T00:00:00Z"  // 更新时间（只读）
}
```

### 开票信息数据结构

```javascript
{
  "id": 1,                             // 开票信息ID（只读）
  "customer_id": 1,                    // 客户ID
  "company_name": "开票公司名称",        // 必填
  "tax_number": "税号",                 // 可选
  "bank_name": "开户银行",              // 可选
  "bank_account": "银行账号",           // 可选
  "address": "开票地址",                // 可选
  "phone": "开票电话",                  // 可选
  "is_default": true,                  // 是否为默认开票信息
  "created_at": "2023-01-01T00:00:00Z" // 创建时间（只读）
}
```

## 🔒 认证说明

### 1. Swagger UI中的认证设置

1. 访问 `http://127.0.0.1:8080/api-docs`
2. 点击右上角的 "Authorize" 按钮
3. 在 BearerAuth 字段中输入您的访问令牌
4. 点击 "Authorize" 确认
5. 现在所有API请求都会自动包含认证头

### 2. 程序中的认证设置

```javascript
// 请求头设置
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${accessToken}`
};
```

## ⚠️ 注意事项

### 1. Token管理
- Token有过期时间，过期后需要重新登录获取新token
- 建议在应用中实现自动token刷新机制
- 收到401错误时，应该清除本地token并引导用户重新登录

### 2. 错误处理
- 400: 请求参数错误，检查必填字段和数据格式
- 401: 认证失败，检查token是否有效
- 404: 资源不存在，检查ID是否正确
- 409: 数据冲突，如客户名称已存在
- 500: 服务器错误，联系技术支持

### 3. 数据验证
- 客户名称为必填字段，不能为空
- 邮箱地址需要符合邮箱格式
- 电话号码建议进行格式验证
- 删除客户前会检查是否有关联的合同

## 🧪 测试方法

### 1. 使用Node.js测试脚本
```bash
node test-customer-api.js
```

### 2. 使用curl命令测试
```bash
# 获取客户列表
curl -X 'GET' \
  'http://127.0.0.1:8080/api/v1/customers' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer your_token_here'
```

### 3. 使用HTML演示页面
在浏览器中打开 `frontend/customer-management-demo.html` 进行可视化测试。

## 📞 技术支持

如果在使用过程中遇到问题，请检查：

1. API服务是否正常运行（访问 `http://127.0.0.1:8080/`）
2. 访问令牌是否有效且未过期
3. 请求参数是否正确
4. 网络连接是否正常

## 🔄 后续扩展

基于当前的客户管理API，您可以进一步扩展：

1. **合同管理**: 为客户创建和管理合同
2. **发票管理**: 基于合同生成发票
3. **付款管理**: 记录和跟踪付款情况
4. **统计报表**: 生成客户相关的统计报表
5. **文件上传**: 支持客户相关文档的上传和管理

所有这些功能的API接口都已经在Swagger文档中定义，可以按照相同的模式进行对接。
