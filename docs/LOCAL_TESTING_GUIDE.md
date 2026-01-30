# 本地测试启动指南

## 快速启动

### Windows 用户

```bash
# 方式1: 使用 npm 脚本（推荐）
npm run dev

# 方式2: 直接运行批处理文件
scripts\dev\start-simple.bat
```

### Linux/Mac 用户

```bash
# 使用 shell 脚本
npm run dev-sh
```

## 详细步骤

### 1. 环境准备

#### 必需软件
- ✅ Node.js (v16+)
- ✅ Yarn 或 npm
- ✅ MySQL 数据库（已配置远程数据库）

#### 检查 Node.js 版本
```bash
node --version
# 应该显示 v16.x.x 或更高
```

#### 检查 Yarn
```bash
yarn --version
# 如果没有安装，运行: npm install -g yarn
```

### 2. 安装依赖

项目会自动检查并安装依赖，但您也可以手动安装：

```bash
# 安装所有依赖
npm run install-all

# 或者分别安装
cd apps/backend
yarn install
cd ../frontend
yarn install
```

### 3. 数据库配置

数据库已配置为远程 MySQL：

```
主机: mysql.sqlpub.com
端口: 3306
用户: millerchen
数据库: procontractledger
```

**无需本地安装 MySQL！**

### 4. 启动服务

#### 自动启动（推荐）

```bash
npm run dev
```

这将自动：
1. 检查并安装依赖
2. 启动后端服务（端口 8010）
3. 启动前端服务（端口 8000）
4. 打开两个命令行窗口

#### 手动启动

**启动后端：**
```bash
cd apps/backend
yarn dev
```

**启动前端（新窗口）：**
```bash
cd apps/frontend
yarn dev
```

### 5. 访问系统

启动成功后，访问：

- **前端界面**: http://localhost:8000
- **后端API**: http://localhost:8010
- **健康检查**: http://localhost:8010/health

### 6. 登录测试

**默认管理员账号：**
- 用户名: `admin`
- 密码: `admin123`

## 测试新功能

### 测试套账自动继承

1. **创建客户**
   - 访问：客户管理 → 新建客户
   - 选择"所属套账"（如果有多个套账）
   - 填写客户信息并保存

2. **创建合同**
   - 访问：合同管理 → 新建合同
   - 选择刚创建的客户
   - 系统会自动使用客户的套账
   - 保存后检查合同的套账归属

3. **创建发票**
   - 访问：发票管理 → 新建发票
   - 选择刚创建的合同
   - 系统会自动使用合同的套账
   - 保存后检查发票的套账归属

4. **记录支付**
   - 访问：支付管理 → 新建支付
   - 选择刚创建的发票
   - 系统会自动使用发票的套账
   - 保存后检查支付的套账归属

### 测试查看全部套账

1. **客户列表**
   - 访问：客户管理
   - 打开"查看全部套账"开关
   - 查看所有套账的客户
   - 表格会显示"所属套账"列

2. **验证数据一致性**
   - 在数据库中查询：
   ```sql
   -- 检查客户
   SELECT id, name, kit_id FROM customers WHERE id = ?;

   -- 检查合同
   SELECT id, contract_number, customer_id, kit_id FROM contracts WHERE customer_id = ?;

   -- 检查发票
   SELECT id, invoice_number, contract_id, kit_id FROM invoices WHERE contract_id = ?;

   -- 检查支付
   SELECT id, invoice_id, kit_id FROM payments WHERE invoice_id = ?;
   ```

## 常见问题

### Q1: 端口被占用

**错误信息：**
```
Error: listen EADDRINUSE: address already in use :::8010
```

**解决方案：**
```bash
# Windows - 查找并结束占用端口的进程
netstat -ano | findstr :8010
taskkill /PID <进程ID> /F

# Linux/Mac
lsof -ti:8010 | xargs kill -9
```

### Q2: 依赖安装失败

**解决方案：**
```bash
# 清理缓存
yarn cache clean

# 删除 node_modules
rm -rf apps/backend/node_modules
rm -rf apps/frontend/node_modules

# 重新安装
npm run install-all
```

### Q3: 数据库连接失败

**检查项：**
1. 网络连接是否正常
2. 数据库服务器是否可访问
3. 用户名密码是否正确

**测试连接：**
```bash
# 使用 MySQL 客户端测试
mysql -h mysql.sqlpub.com -P 3306 -u millerchen -p procontractledger
```

### Q4: 前端无法访问后端

**检查项：**
1. 后端是否启动成功
2. 端口是否正确（8010）
3. 前端配置的 API 地址是否正确

**检查前端配置：**
```bash
# 查看 apps/frontend/.env
cat apps/frontend/.env
```

应该包含：
```
VITE_API_BASE_URL=http://localhost:8010/api/v1
```

## 开发工具推荐

### VS Code 扩展

- **Vue Language Features (Volar)** - Vue 3 支持
- **TypeScript Vue Plugin (Volar)** - TypeScript 支持
- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **REST Client** - API 测试

### 浏览器扩展

- **Vue.js devtools** - Vue 调试工具
- **JSON Viewer** - JSON 格式化

## 调试技巧

### 后端调试

1. **查看日志**
   ```bash
   # 后端日志会显示在启动的命令行窗口中
   ```

2. **使用调试器**
   ```bash
   # 在 VS Code 中按 F5 启动调试
   ```

3. **测试 API**
   ```bash
   # 使用 curl 测试
   curl http://localhost:8010/health

   # 测试登录
   curl -X POST http://localhost:8010/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

### 前端调试

1. **浏览器开发者工具**
   - 按 F12 打开
   - 查看 Console 和 Network 标签

2. **Vue Devtools**
   - 安装浏览器扩展
   - 查看组件状态和 Vuex store

## 性能测试

```bash
# 运行性能测试
npm run performance-test
```

## 数据库管理

### 应用索引

```bash
# 应用数据库索引（提升查询性能）
npm run apply-indexes

# 测试索引
npm run test-db

# 查看数据库信息
npm run db-info
```

## 停止服务

### Windows
- 直接关闭命令行窗口
- 或在窗口中按 `Ctrl + C`

### Linux/Mac
```bash
# 按 Ctrl + C 停止服务
```

## 清理项目

```bash
# 清理构建文件和依赖
npm run clean
```

## 下一步

启动成功后，您可以：

1. ✅ 测试套账自动继承功能
2. ✅ 测试查看全部套账功能
3. ✅ 验证数据一致性
4. ✅ 测试其他业务功能

## 获取帮助

如果遇到问题：

1. 查看本文档的"常见问题"部分
2. 查看项目文档：
   - `docs/MULTI_KIT_OPTIMIZATION.md` - 多套账优化说明
   - `docs/KIT_AUTO_INHERITANCE.md` - 套账自动继承说明
3. 查看日志输出
4. 提交 Issue 到 GitHub

## 快速命令参考

```bash
# 启动开发环境
npm run dev

# 安装依赖
npm run install-all

# 清理项目
npm run clean

# 应用数据库索引
npm run apply-indexes

# 性能测试
npm run performance-test

# API 测试
npm run test-api

# 登录测试
npm run test-login
```

祝测试顺利！🚀
