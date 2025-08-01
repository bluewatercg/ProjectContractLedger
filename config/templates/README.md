# 配置模板

本目录包含各种环境的配置文件模板。

## 📋 模板说明

### 🌍 环境配置模板
- **`.env.production.template`** - 生产环境配置模板
- **`.env.local.template`** - 本地开发环境配置模板
- **`.env.unittest.template`** - 单元测试环境配置模板
- **`.env.external-simple.template`** - 外部服务简化配置模板

### 📝 示例配置
- **`.env.example`** - 基础配置示例
- **`.env.lan.example`** - 局域网部署示例

## 🚀 使用方法

### 1. 选择合适的模板
根据你的部署环境选择对应的模板文件。

### 2. 复制并重命名
```bash
# 生产环境
cp config/templates/.env.production.template deployment/.env

# 本地开发
cp config/templates/.env.local.template .env

# 单元测试
cp config/templates/.env.unittest.template .env.test
```

### 3. 修改配置
编辑复制的.env文件，填入实际的配置值：
- 数据库连接信息
- Redis连接信息
- JWT密钥
- 服务端口配置
- 其他环境特定配置

## 📋 配置项说明

### 数据库配置
```bash
DB_HOST=192.168.1.254          # 数据库主机
DB_PORT=3306                   # 数据库端口
DB_USERNAME=your_username      # 数据库用户名
DB_PASSWORD=your_password      # 数据库密码
DB_DATABASE=your_database      # 数据库名称
```

### Redis配置
```bash
REDIS_HOST=192.168.1.160       # Redis主机
REDIS_PORT=6379                # Redis端口
REDIS_PASSWORD=your_password   # Redis密码
REDIS_DB=13                    # Redis数据库编号
```

### JWT配置
```bash
JWT_SECRET=your_jwt_secret     # JWT密钥
JWT_EXPIRES_IN=7d              # JWT过期时间
```

### 服务端口配置
```bash
FRONTEND_HOST_PORT=8000        # 前端服务端口
BACKEND_HOST_PORT=8080         # 后端服务端口
```

## ⚠️ 安全注意事项

1. **敏感信息**：不要将包含真实密码的.env文件提交到版本控制
2. **权限控制**：确保.env文件权限设置正确（600或644）
3. **密钥生成**：使用强随机密钥，特别是JWT_SECRET
4. **环境隔离**：不同环境使用不同的配置文件

## 🔧 配置验证

使用以下命令验证配置是否正确：
```bash
# 检查配置文件语法
source .env && echo "配置文件语法正确"

# 测试数据库连接
mysql -h$DB_HOST -P$DB_PORT -u$DB_USERNAME -p$DB_PASSWORD -e "SELECT 1;"

# 测试Redis连接
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
```