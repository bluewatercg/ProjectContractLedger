# 数据监控和提醒功能部署检查清单

## 📋 部署前检查

### 1. 数据库准备
- [ ] 执行数据库迁移文件
  ```sql
  source database/migrations/add_contract_type_and_reminder_fields.sql
  ```
- [ ] 验证新字段已添加到合同表
  ```sql
  DESCRIBE contracts;
  ```
- [ ] 检查索引是否创建成功
  ```sql
  SHOW INDEX FROM contracts WHERE Key_name LIKE 'idx_contracts_%';
  ```

### 2. 后端文件检查
- [ ] 确认以下文件已正确创建：
  - [ ] `apps/backend/src/entity/contract.entity.ts` (已更新)
  - [ ] `apps/backend/src/interface.ts` (已更新)
  - [ ] `apps/backend/src/service/reminder.service.ts` (新创建)
  - [ ] `apps/backend/src/controller/reminder.controller.ts` (新创建)

### 3. 前端文件检查
- [ ] 确认以下文件已正确创建/更新：
  - [ ] `apps/frontend/src/api/reminder.ts` (新创建)
  - [ ] `apps/frontend/src/api/index.ts` (已更新)
  - [ ] `apps/frontend/src/views/Dashboard.vue` (已更新)

### 4. 编译检查
- [ ] 后端编译无错误
  ```bash
  cd apps/backend
  npm run build
  ```
- [ ] 前端编译无错误
  ```bash
  cd apps/frontend
  npm run build
  ```

## 🚀 部署步骤

### 步骤1: 停止服务
```bash
# 如果使用 PM2
pm2 stop all

# 或者如果使用 Docker
docker-compose down
```

### 步骤2: 更新代码
```bash
git pull origin main
```

### 步骤3: 安装依赖（如果有新增）
```bash
cd apps/backend && npm install
cd ../frontend && npm install
```

### 步骤4: 执行数据库迁移
```bash
mysql -u username -p database_name < database/migrations/add_contract_type_and_reminder_fields.sql
```

### 步骤5: 构建应用
```bash
# 构建后端
cd apps/backend
npm run build

# 构建前端
cd ../frontend
npm run build
```

### 步骤6: 启动服务
```bash
# 如果使用 PM2
pm2 start all

# 或者如果使用 Docker
docker-compose up -d
```

## 🧪 功能测试

### 1. API接口测试
```bash
# 运行测试脚本
node test-reminder-api.js
```

### 2. 前端功能测试
- [ ] 登录系统，访问Dashboard页面
- [ ] 确认提醒区域正常显示
- [ ] 测试刷新功能
- [ ] 测试提醒项的点击和处理功能

### 3. 业务流程测试

#### 测试合同续签功能
- [ ] 创建/编辑合同时可以勾选"是否续签"
- [ ] 勾选续签后可以设置提醒天数（5天、30天、60天）
- [ ] 合同列表显示续签状态

#### 测试提醒功能
- [ ] 创建测试数据：
  - [ ] 创建即将到期的续签合同
  - [ ] 创建已生效但未开票的合同
  - [ ] 创建已开票但未收款的发票
- [ ] 验证Dashboard显示相应提醒
- [ ] 测试提醒的处理和忽略功能

## 🔍 故障排除

### 常见问题及解决方案

#### 问题1: 数据库字段未添加
**症状**: 后端启动时报错，提示字段不存在
**解决**: 确认数据库迁移文件已正确执行

#### 问题2: 前端提醒区域不显示
**症状**: Dashboard页面提醒区域为空或显示错误
**检查**:
- [ ] 浏览器控制台是否有JavaScript错误
- [ ] 网络请求是否成功返回数据
- [ ] 后端API是否正常响应

#### 问题3: 图标不显示
**症状**: 提醒区域的图标无法显示
**解决**: 确认Element Plus图标已正确导入

#### 问题4: API请求失败
**症状**: 网络请求返回404或500错误
**检查**:
- [ ] 后端服务是否正常运行
- [ ] API路由是否正确配置
- [ ] 数据库连接是否正常

## 📊 性能监控

### 关键指标
- [ ] Dashboard页面加载时间 < 2秒
- [ ] 提醒API响应时间 < 500ms
- [ ] 数据库查询性能正常

### 监控建议
- 定期检查数据库查询性能
- 监控API响应时间
- 关注前端页面加载速度

## 🔒 安全检查

- [ ] 确认API接口有适当的认证和权限控制
- [ ] 验证输入参数的有效性检查
- [ ] 确认没有敏感信息泄露

## 📚 文档更新

- [ ] 更新API文档（如使用Swagger）
- [ ] 更新用户使用手册
- [ ] 更新系统架构文档

## ✅ 部署完成确认

- [ ] 所有测试通过
- [ ] 功能正常工作
- [ ] 性能指标符合要求
- [ ] 用户反馈收集

---

## 📞 联系信息

如部署过程中遇到问题，请：
1. 检查系统日志
2. 运行测试脚本诊断
3. 参考故障排除指南

**部署完成后请在此签名确认**: 

日期: ____________  
部署人员: ____________  
验证人员: ____________