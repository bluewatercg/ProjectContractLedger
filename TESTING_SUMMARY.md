# 🎉 本地测试环境已配置完成

## ✅ 已完成的工作

### 1. 代码改进
- ✅ 实现套账自动继承机制
- ✅ 合同自动继承客户套账
- ✅ 发票自动继承合同套账
- ✅ 支付自动继承发票套账
- ✅ 客户列表支持查看全部套账
- ✅ 新增 KitSelect 通用组件

### 2. 文档完善
- ✅ `docs/MULTI_KIT_OPTIMIZATION.md` - 多套账优化说明
- ✅ `docs/KIT_AUTO_INHERITANCE.md` - 套账自动继承机制
- ✅ `docs/LOCAL_TESTING_GUIDE.md` - 详细测试指南
- ✅ `README_TEST.md` - 快速测试指南

### 3. 自动化脚本
- ✅ `start-local-test.bat` - 一键启动脚本

## 🚀 如何启动测试

### 方法 1: 双击启动（最简单）
```
双击项目根目录下的 start-local-test.bat 文件
```

### 方法 2: 命令行启动
```bash
# 在项目根目录执行
npm run dev

# 或直接运行
start-local-test.bat
```

### 方法 3: 手动启动
```bash
# 终端 1 - 启动后端
cd apps/backend
yarn dev

# 终端 2 - 启动前端
cd apps/frontend
yarn dev
```

## 📍 访问地址

启动成功后，访问以下地址：

- **前端界面**: http://localhost:8000
- **后端API**: http://localhost:8010
- **健康检查**: http://localhost:8010/health

## 🔑 登录信息

```
用户名: admin
密码: admin123
```

## 🧪 测试步骤

### 测试 1: 套账自动继承

1. **创建客户**
   - 客户管理 → 新建客户
   - 选择"所属套账"（例如：A线）
   - 保存

2. **创建合同**
   - 合同管理 → 新建合同
   - 选择刚创建的客户
   - ✅ 观察：套账自动继承为 A线
   - 保存

3. **创建发票**
   - 发票管理 → 新建发票
   - 选择刚创建的合同
   - ✅ 观察：套账自动继承为 A线
   - 保存

4. **记录支付**
   - 支付管理 → 新建支付
   - 选择刚创建的发票
   - ✅ 观察：套账自动继承为 A线
   - 保存

**预期结果：** 客户、合同、发票、支付的套账完全一致

### 测试 2: 查看全部套账

1. **打开查看全部**
   - 进入客户列表
   - 打开"查看全部套账"开关
   - ✅ 观察：显示所有套账的客户
   - ✅ 观察：表格显示"所属套账"列

2. **关闭查看全部**
   - 关闭"查看全部套账"开关
   - ✅ 观察：只显示当前套账的客户
   - ✅ 观察："所属套账"列消失

**预期结果：** 可以灵活切换查看模式

## 🔍 验证数据一致性

### 方法 1: 通过界面验证
1. 在客户列表打开"查看全部套账"
2. 查看客户的套账归属
3. 点击查看该客户的合同
4. 验证合同的套账与客户一致
5. 查看合同的发票和支付
6. 验证所有数据的套账一致

### 方法 2: 通过数据库验证
```sql
-- 连接数据库
主机: mysql.sqlpub.com
端口: 3306
用户: millerchen
密码: c3TyBrus2OmLeeIu
数据库: procontractledger

-- 查询验证
SELECT
    c.id as customer_id,
    c.name as customer_name,
    c.kit_id as customer_kit,
    ct.id as contract_id,
    ct.contract_number,
    ct.kit_id as contract_kit,
    i.id as invoice_id,
    i.invoice_number,
    i.kit_id as invoice_kit,
    p.id as payment_id,
    p.kit_id as payment_kit
FROM customers c
LEFT JOIN contracts ct ON c.id = ct.customer_id
LEFT JOIN invoices i ON ct.id = i.contract_id
LEFT JOIN payments p ON i.id = p.invoice_id
WHERE c.id = 1;

-- 验证：所有 kit_id 应该相同
```

## 📊 测试检查清单

### 环境检查
- [ ] Node.js 已安装（v16+）
- [ ] 依赖已安装
- [ ] 数据库可连接

### 服务启动
- [ ] 后端服务启动成功（端口 8010）
- [ ] 前端服务启动成功（端口 8000）
- [ ] 可以访问前端界面
- [ ] 可以成功登录

### 功能测试
- [ ] 创建客户并选择套账
- [ ] 创建合同（验证自动继承）
- [ ] 创建发票（验证自动继承）
- [ ] 记录支付（验证自动继承）
- [ ] 打开"查看全部套账"
- [ ] 验证显示所有套账数据
- [ ] 验证显示套账列
- [ ] 关闭"查看全部套账"
- [ ] 验证只显示当前套账

### 数据验证
- [ ] 客户、合同、发票、支付的 kit_id 一致
- [ ] 切换套账后数据正确过滤
- [ ] 查看全部时数据归属清晰

## ⚠️ 常见问题

### 问题 1: 端口被占用
```bash
# 查找占用进程
netstat -ano | findstr :8010

# 结束进程
taskkill /PID <进程ID> /F
```

### 问题 2: 服务启动失败
1. 检查 Node.js 版本
2. 重新安装依赖：`npm run install-all`
3. 查看错误日志

### 问题 3: 数据库连接失败
1. 检查网络连接
2. 验证数据库配置（apps/backend/.env）
3. 测试数据库连接

### 问题 4: 看不到套账选择器
- 如果用户只有一个套账，不显示选择器（正常）
- 需要在套账管理中为用户授权多个套账

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| `README_TEST.md` | 快速测试指南 |
| `docs/LOCAL_TESTING_GUIDE.md` | 详细测试指南 |
| `docs/MULTI_KIT_OPTIMIZATION.md` | 多套账优化说明 |
| `docs/KIT_AUTO_INHERITANCE.md` | 套账自动继承机制 |
| `deployment/DEPLOYMENT_GUIDE.md` | 部署指南 |
| `deployment/IMPROVEMENTS_SUMMARY.md` | 部署脚本改进 |

## 🎯 测试重点

### 核心功能
1. ✅ **套账自动继承** - 合同/发票/支付自动跟随客户套账
2. ✅ **查看全部套账** - 可以跨套账查看数据
3. ✅ **数据一致性** - 整条业务链套账一致

### 用户体验
1. ✅ **简化操作** - 只需在创建客户时选择套账
2. ✅ **灵活查看** - 支持单套账和全部套账切换
3. ✅ **清晰归属** - 表格显示数据归属

### 数据质量
1. ✅ **避免混乱** - 不会出现跨套账业务
2. ✅ **统计准确** - 按套账统计数据完整
3. ✅ **便于审计** - 业务链清晰可追溯

## 🚀 下一步

测试完成后，您可以：

1. **部署到服务器**
   ```bash
   cd deployment
   ./deploy-separated.sh --update
   ```

2. **查看部署文档**
   - `deployment/DEPLOYMENT_GUIDE.md`

3. **配置定时任务**
   ```bash
   # 每天备份
   0 1 * * * /path/to/deploy-separated.sh --backup

   # 每天日志轮转
   0 2 * * * /path/to/deploy-separated.sh --rotate-logs
   ```

## 💡 提示

- 服务启动需要几秒钟，请耐心等待
- 首次启动可能需要更长时间（安装依赖）
- 如果浏览器没有自动打开，手动访问 http://localhost:8000
- 测试时建议打开浏览器开发者工具（F12）查看日志

## 📞 获取帮助

如果遇到问题：
1. 查看命令行窗口的错误信息
2. 查看浏览器控制台的错误信息
3. 查看相关文档
4. 检查数据库连接
5. 提交 Issue 到 GitHub

---

**祝测试顺利！** 🎉

如有任何问题，随时联系！
