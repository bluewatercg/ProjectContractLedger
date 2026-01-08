# 🚀 快速入门指南

欢迎使用 ProjectContractLedger！这是一个专为中小企业设计的合同管理系统。

## ⚡ 5分钟快速体验

### 1. 一键启动开发环境

```bash
# 克隆项目
git clone <repository-url>
cd ProjectContractLedger

# 一键启动（推荐）
yarn start-ps
```

### 2. 访问系统

- **前端应用**: http://localhost:8000
- **后端API**: http://localhost:8080
- **API文档**: http://localhost:8080/api-docs

### 3. 默认登录

- **用户名**: admin
- **密码**: admin123

## 🎯 核心功能演示

### 客户管理
1. 点击"客户管理" → "新增客户"
2. 填写客户基本信息
3. 添加客户开票信息（支持多个开票抬头）

### 合同管理
1. 点击"合同管理" → "新建合同"
2. 选择客户，填写合同信息
3. 上传合同附件
4. 跟踪合同状态变化

### 开票管理
1. 从合同详情页点击"创建发票"
2. 选择客户开票信息
3. 填写开票金额和详情
4. 上传发票附件

### 到款管理
1. 从发票详情页点击"记录到款"
2. 填写到款信息
3. 系统自动核销应收款

## 🏗️ 生产部署

### 方式一：一键部署脚本
```bash
# 下载部署脚本
wget https://raw.githubusercontent.com/bluewatercg/projectcontractledger/main/deploy-simple.sh
chmod +x deploy-simple.sh

# 初始化环境
./deploy-simple.sh --init

# 配置数据库（编辑 .env.external-simple）
# 启动服务
./deploy-simple.sh
```

### 方式二：Docker Compose
```bash
# 克隆项目
git clone <repository-url>
cd ProjectContractLedger/deployment

# 配置环境变量
cp .env.template .env
# 编辑 .env 文件

# 启动服务
docker-compose up -d
```

## 📱 系统要求

### 开发环境
- Node.js >= 16.0.0
- Yarn >= 1.22.0
- MySQL >= 5.7
- Redis >= 5.0

### 生产环境
- Docker >= 20.0
- Docker Compose >= 2.0
- MySQL 8.0（外部）
- Redis 6.0（外部）

## 🔧 常见问题

### Q: 启动失败怎么办？
```bash
# 检查端口占用
netstat -ano | findstr :8080
netstat -ano | findstr :8000

# 清理并重新安装
yarn clean
yarn install-all
```

### Q: 数据库连接失败？
```bash
# 使用诊断工具
cd tools/maintenance
./debug-database-connection.sh
```

### Q: 文件上传失败？
```bash
# 使用修复工具
cd tools/maintenance
./fix-contract-upload-issue.sh
```

## 📚 下一步

- 📖 阅读 [完整用户指南](USER_GUIDE.md)
- 🛠️ 查看 [部署指南](DEPLOYMENT_GUIDE.md)
- 🔍 遇到问题？查看 [故障排除](TROUBLESHOOTING.md)
- 💡 了解更多？查看 [产品需求文档](user-guide/PRD.md)

## 🎉 开始使用

现在你已经了解了基本操作，可以开始使用系统管理你的客户合同了！

如果需要帮助，请查看 `docs/` 目录下的详细文档，或使用项目提供的维护工具进行问题诊断。