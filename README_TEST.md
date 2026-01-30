# 🚀 本地测试快速启动

## 一键启动

双击运行项目根目录下的 `start-local-test.bat` 文件即可！

或者在命令行中运行：
```bash
start-local-test.bat
```

## 启动后会发生什么？

1. ✅ 自动检查环境配置
2. ✅ 启动后端服务（端口 8010）
3. ✅ 启动前端服务（端口 8000）
4. ✅ 自动打开浏览器访问系统

## 访问地址

- **前端界面**: http://localhost:8000
- **后端API**: http://localhost:8010
- **健康检查**: http://localhost:8010/health

## 默认登录账号

```
用户名: admin
密码: admin123
```

## 测试新功能

### 1. 测试套账自动继承

#### 步骤 1: 创建客户
1. 登录系统
2. 进入"客户管理"
3. 点击"新建客户"
4. 在"所属套账"中选择套账（如果有多个）
5. 填写客户信息并保存

#### 步骤 2: 创建合同
1. 进入"合同管理"
2. 点击"新建合同"
3. 选择刚创建的客户
4. **注意观察**：系统会自动使用客户的套账
5. 填写合同信息并保存

#### 步骤 3: 创建发票
1. 进入"发票管理"
2. 点击"新建发票"
3. 选择刚创建的合同
4. **注意观察**：系统会自动使用合同的套账
5. 填写发票信息并保存

#### 步骤 4: 记录支付
1. 进入"支付管理"
2. 点击"新建支付"
3. 选择刚创建的发票
4. **注意观察**：系统会自动使用发票的套账
5. 填写支付信息并保存

#### 验证结果
- 客户、合同、发票、支付的套账应该完全一致
- 整条业务链都在同一个套账下

### 2. 测试查看全部套账

#### 步骤 1: 客户列表
1. 进入"客户管理"
2. 在搜索栏右侧找到"查看全部套账"开关
3. 打开开关
4. **观察**：表格会显示"所属套账"列
5. **观察**：可以看到所有套账的客户

#### 步骤 2: 切换回当前套账
1. 关闭"查看全部套账"开关
2. **观察**：只显示当前套账的客户
3. "所属套账"列消失

## 数据库验证

如果想验证数据一致性，可以连接数据库查询：

```sql
-- 连接信息
主机: mysql.sqlpub.com
端口: 3306
用户: millerchen
密码: c3TyBrus2OmLeeIu
数据库: procontractledger

-- 查询客户
SELECT id, name, kit_id FROM customers WHERE id = 1;

-- 查询该客户的合同
SELECT id, contract_number, customer_id, kit_id
FROM contracts WHERE customer_id = 1;

-- 查询合同的发票
SELECT id, invoice_number, contract_id, kit_id
FROM invoices WHERE contract_id = 1;

-- 查询发票的支付
SELECT id, invoice_id, kit_id
FROM payments WHERE invoice_id = 1;

-- 验证：所有记录的 kit_id 应该相同
```

## 停止服务

### 方法 1: 关闭窗口
直接关闭"Contract-Ledger-Backend"和"Contract-Ledger-Frontend"两个命令行窗口

### 方法 2: 使用 Ctrl+C
在每个命令行窗口中按 `Ctrl + C` 停止服务

## 常见问题

### Q: 端口被占用怎么办？

**错误信息：**
```
Error: listen EADDRINUSE: address already in use :::8010
```

**解决方案：**
```bash
# 查找占用端口的进程
netstat -ano | findstr :8010

# 结束进程（替换 <PID> 为实际进程ID）
taskkill /PID <PID> /F
```

### Q: 浏览器没有自动打开？

手动访问：http://localhost:8000

### Q: 登录失败？

1. 检查后端服务是否启动成功
2. 访问 http://localhost:8010/health 检查后端健康状态
3. 确认使用正确的账号密码：admin / admin123

### Q: 看不到套账选择器？

- 如果用户只有一个套账权限，不会显示套账选择器
- 这是正常的，系统会自动使用唯一的套账

## 测试检查清单

- [ ] 成功启动后端服务
- [ ] 成功启动前端服务
- [ ] 成功登录系统
- [ ] 创建客户并选择套账
- [ ] 创建合同（验证自动继承客户套账）
- [ ] 创建发票（验证自动继承合同套账）
- [ ] 记录支付（验证自动继承发票套账）
- [ ] 打开"查看全部套账"开关
- [ ] 验证表格显示套账列
- [ ] 关闭"查看全部套账"开关
- [ ] 验证数据一致性

## 开发者工具

### 浏览器开发者工具
按 `F12` 打开，查看：
- Console：查看前端日志
- Network：查看 API 请求
- Vue Devtools：查看组件状态

### API 测试

```bash
# 测试健康检查
curl http://localhost:8010/health

# 测试登录
curl -X POST http://localhost:8010/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

## 相关文档

- `docs/MULTI_KIT_OPTIMIZATION.md` - 多套账优化说明
- `docs/KIT_AUTO_INHERITANCE.md` - 套账自动继承机制
- `docs/LOCAL_TESTING_GUIDE.md` - 详细测试指南

## 获取帮助

如果遇到问题：
1. 查看命令行窗口的错误信息
2. 查看浏览器控制台的错误信息
3. 查看相关文档
4. 提交 Issue 到 GitHub

祝测试顺利！🎉
