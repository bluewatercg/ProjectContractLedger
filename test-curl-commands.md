# 客户管理API测试命令集合

基于您提供的token和Swagger API文档，以下是完整的客户管理API测试命令：

## 环境配置
```bash
# API基础URL
API_BASE_URL="http://127.0.0.1:8080/api/v1"

# 您的访问令牌
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHFpamkuY29tIiwiaWF0IjoxNzQ4OTM2MDg5LCJleHAiOjE3NDkwMjI0ODl9.W7dKfYNo5YL2Nwn622-yQB8_dGWCKkf9awdI8Hfm8mY"
```

## 1. 获取所有客户列表

### 基本查询
```bash
curl -X 'GET' \
  'http://127.0.0.1:8080/api/v1/customers' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHFpamkuY29tIiwiaWF0IjoxNzQ4OTM2MDg5LCJleHAiOjE3NDkwMjI0ODl9.W7dKfYNo5YL2Nwn622-yQB8_dGWCKkf9awdI8Hfm8mY'
```

### 带分页参数的查询
```bash
curl -X 'GET' \
  'http://127.0.0.1:8080/api/v1/customers?page=1&pageSize=5' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHFpamkuY29tIiwiaWF0IjoxNzQ4OTM2MDg5LCJleHAiOjE3NDkwMjI0ODl9.W7dKfYNo5YL2Nwn622-yQB8_dGWCKkf9awdI8Hfm8mY'
```

### 带搜索条件的查询
```bash
curl -X 'GET' \
  'http://127.0.0.1:8080/api/v1/customers?name=公司&page=1&pageSize=10' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHFpamkuY29tIiwiaWF0IjoxNzQ4OTM2MDg5LCJleHAiOjE3NDkwMjI0ODl9.W7dKfYNo5YL2Nwn622-yQB8_dGWCKkf9awdI8Hfm8mY'
```

## 2. 创建新客户

```bash
curl -X 'POST' \
  'http://127.0.0.1:8080/api/v1/customers' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHFpamkuY29tIiwiaWF0IjoxNzQ4OTM2MDg5LCJleHAiOjE3NDkwMjI0ODl9.W7dKfYNo5YL2Nwn622-yQB8_dGWCKkf9awdI8Hfm8mY' \
  -d '{
    "name": "测试客户公司",
    "contact_person": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "address": "北京市朝阳区测试大厦1001室",
    "notes": "这是一个测试客户"
  }'
```

## 3. 获取单个客户详情

```bash
# 替换 {customerId} 为实际的客户ID
curl -X 'GET' \
  'http://127.0.0.1:8080/api/v1/customers/1' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHFpamkuY29tIiwiaWF0IjoxNzQ4OTM2MDg5LCJleHAiOjE3NDkwMjI0ODl9.W7dKfYNo5YL2Nwn622-yQB8_dGWCKkf9awdI8Hfm8mY'
```

## 4. 更新客户信息

```bash
# 替换 {customerId} 为实际的客户ID
curl -X 'PUT' \
  'http://127.0.0.1:8080/api/v1/customers/1' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHFpamkuY29tIiwiaWF0IjoxNzQ4OTM2MDg5LCJleHAiOjE3NDkwMjI0ODl9.W7dKfYNo5YL2Nwn622-yQB8_dGWCKkf9awdI8Hfm8mY' \
  -d '{
    "name": "测试客户公司（已更新）",
    "contact_person": "李四",
    "phone": "13900139000",
    "email": "lisi@example.com",
    "address": "上海市浦东新区测试园区2002室",
    "notes": "已完成年度续约，VIP客户"
  }'
```

## 5. 获取客户的开票信息列表

```bash
# 替换 {customerId} 为实际的客户ID
curl -X 'GET' \
  'http://127.0.0.1:8080/api/v1/customers/1/invoice-infos' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHFpamkuY29tIiwiaWF0IjoxNzQ4OTM2MDg5LCJleHAiOjE3NDkwMjI0ODl9.W7dKfYNo5YL2Nwn622-yQB8_dGWCKkf9awdI8Hfm8mY'
```

## 6. 创建客户开票信息

```bash
# 替换 {customerId} 为实际的客户ID
curl -X 'POST' \
  'http://127.0.0.1:8080/api/v1/customers/1/invoice-infos' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHFpamkuY29tIiwiaWF0IjoxNzQ4OTM2MDg5LCJleHAiOjE3NDkwMjI0ODl9.W7dKfYNo5YL2Nwn622-yQB8_dGWCKkf9awdI8Hfm8mY' \
  -d '{
    "company_name": "测试开票公司",
    "tax_number": "91110000123456789X",
    "bank_name": "中国银行",
    "bank_account": "6222000012345678",
    "address": "北京市朝阳区开票地址123号",
    "phone": "010-12345678",
    "is_default": true
  }'
```

## 7. 更新客户开票信息

```bash
# 替换 {customerId} 和 {infoId} 为实际的ID
curl -X 'PUT' \
  'http://127.0.0.1:8080/api/v1/customers/1/invoice-infos/1' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHFpamkuY29tIiwiaWF0IjoxNzQ4OTM2MDg5LCJleHAiOjE3NDkwMjI0ODl9.W7dKfYNo5YL2Nwn622-yQB8_dGWCKkf9awdI8Hfm8mY' \
  -d '{
    "company_name": "测试开票公司（已更新）",
    "tax_number": "91110000987654321Y",
    "bank_name": "建设银行",
    "bank_account": "6222000087654321",
    "address": "上海市浦东新区开票地址456号",
    "phone": "021-87654321",
    "is_default": false
  }'
```

## 8. 删除客户开票信息

```bash
# 替换 {customerId} 和 {infoId} 为实际的ID
curl -X 'DELETE' \
  'http://127.0.0.1:8080/api/v1/customers/1/invoice-infos/1' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHFpamkuY29tIiwiaWF0IjoxNzQ4OTM2MDg5LCJleHAiOjE3NDkwMjI0ODl9.W7dKfYNo5YL2Nwn622-yQB8_dGWCKkf9awdI8Hfm8mY'
```

## 9. 删除客户

```bash
# 替换 {customerId} 为实际的客户ID
curl -X 'DELETE' \
  'http://127.0.0.1:8080/api/v1/customers/1' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHFpamkuY29tIiwiaWF0IjoxNzQ4OTM2MDg5LCJleHAiOjE3NDkwMjI0ODl9.W7dKfYNo5YL2Nwn622-yQB8_dGWCKkf9awdI8Hfm8mY'
```

## 使用说明

1. **认证**: 所有API请求都需要在请求头中包含 `Authorization: Bearer {token}`
2. **Content-Type**: POST和PUT请求需要设置 `Content-Type: application/json`
3. **参数替换**: 将命令中的 `{customerId}` 和 `{infoId}` 替换为实际的ID值
4. **响应格式**: 所有响应都是JSON格式

## 错误处理

- **401 Unauthorized**: Token无效或已过期，需要重新登录获取新token
- **400 Bad Request**: 请求参数错误或缺少必填字段
- **404 Not Found**: 请求的资源不存在
- **500 Internal Server Error**: 服务器内部错误

## 测试建议

1. 先运行获取客户列表的命令，确认API服务正常
2. 创建测试客户，记录返回的customer_id
3. 使用返回的customer_id测试其他操作
4. 测试完成后可以删除测试数据
