# Testing 测试目录

本目录包含项目的完整测试体系，涵盖单元测试、集成测试、性能测试和端到端测试，确保代码质量和系统稳定性。

## 📁 目录结构

```
testing/
├── README.md                    # 本说明文件
├── backend/                    # 后端测试
│   ├── controller/             # 控制器测试
│   │   ├── api.test.ts        # API控制器测试
│   │   └── home.test.ts       # 首页控制器测试
│   └── jest.config.js         # Jest测试配置
├── frontend/                   # 前端测试（预留）
├── integration/                # 集成测试（预留）
├── performance/                # 性能测试
│   └── performance-test.js     # 性能测试脚本
├── scripts/                    # 测试脚本
│   ├── test-docker-build.sh   # Linux Docker构建测试
│   ├── test-docker-build.ps1  # Windows PowerShell构建测试
│   ├── test-docker-build.bat  # Windows批处理构建测试
│   └── test-login.js          # 登录功能测试脚本
└── docs/                      # 测试文档
    ├── 测试使用说明.md         # 测试使用说明
    └── 测试计划.md             # 测试计划文档
```

## 🔧 Backend 测试 (`testing/backend/`)

### 测试配置
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `jest.config.js` | Jest测试框架配置 | ✅ 活跃维护 |

### 测试文件
| 目录路径 | 作用 | 维护状态 |
|---------|------|----------|
| `controller/` | 控制器层测试 | ✅ 活跃维护 |

**测试覆盖**：
- API接口测试
- 业务逻辑测试
- 数据库操作测试
- 中间件测试
- 工具函数测试

**测试框架**：
- **Jest**: 主要测试框架
- **Supertest**: HTTP接口测试
- **TypeScript**: 类型安全的测试代码

## 📚 Docs 测试文档 (`testing/docs/`)

### 测试文档
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `测试使用说明.md` | 测试使用指南 | ✅ 活跃维护 |
| `测试计划.md` | 测试计划文档 | ✅ 活跃维护 |

**内容包含**：
- 测试策略和方法
- 测试环境配置
- 测试用例设计
- 测试执行流程
- 质量保证标准

## 🎨 Frontend 测试 (`testing/frontend/`)

### 前端测试
| 目录状态 | 作用 | 维护状态 |
|---------|------|----------|
| `空目录` | 前端测试文件预留 | 🔄 待开发 |

**计划测试内容**：
- 组件单元测试
- 页面集成测试
- 用户交互测试
- 路由测试
- 状态管理测试

**推荐测试框架**：
- **Vitest**: Vue3推荐的测试框架
- **Vue Test Utils**: Vue组件测试工具
- **Cypress**: 端到端测试

## 🔗 Integration 测试 (`testing/integration/`)

### 集成测试
| 目录状态 | 作用 | 维护状态 |
|---------|------|----------|
| `空目录` | 集成测试文件预留 | 🔄 待开发 |

**计划测试内容**：
- 前后端接口集成测试
- 数据库集成测试
- 第三方服务集成测试
- 完整业务流程测试

## ⚡ Performance 测试 (`testing/performance/`)

### 性能测试
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `performance-test.js` | 性能测试脚本 | ✅ 开发工具 |

**测试内容**：
- API响应时间测试
- 数据库查询性能测试
- 并发负载测试
- 内存使用监控
- 系统资源监控

**测试工具**：
- **Node.js**: 性能测试脚本
- **Artillery**: 负载测试工具
- **Clinic.js**: 性能分析工具

## 📜 Scripts 测试脚本 (`testing/scripts/`)

### 测试工具脚本
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `test-login.js` | 登录功能测试脚本 | ✅ 开发工具 |

### Docker测试脚本
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `test-docker-build.bat` | Windows Docker构建测试 | ✅ 开发工具 |
| `test-docker-build.ps1` | PowerShell Docker构建测试 | ✅ 开发工具 |
| `test-docker-build.sh` | Linux/Mac Docker构建测试 | ✅ 开发工具 |

**功能特性**：
- 自动化Docker镜像构建测试
- 容器启动和健康检查
- 多平台支持（Windows/Linux/Mac）
- 详细的测试报告

## 🚀 测试执行指南

### 1. 后端单元测试
```bash
# 进入后端目录
cd apps/backend

# 运行所有测试
yarn test

# 运行特定测试文件
yarn test controller/user.test.ts

# 生成测试覆盖率报告
yarn test:coverage
```

### 2. 性能测试
```bash
# 进入性能测试目录
cd testing/performance

# 运行性能测试
node performance-test.js

# 使用Artillery进行负载测试
artillery run load-test.yml
```

### 3. Docker构建测试
```bash
# Linux/Mac环境
chmod +x testing/scripts/test-docker-build.sh
./testing/scripts/test-docker-build.sh

# Windows环境
testing/scripts/test-docker-build.bat

# PowerShell环境
testing/scripts/test-docker-build.ps1
```

### 4. 登录功能测试
```bash
# 测试登录接口
cd testing/scripts
node test-login.js
```

## 📊 测试策略

### 测试金字塔
1. **单元测试 (70%)**
   - 函数级别测试
   - 组件级别测试
   - 快速反馈

2. **集成测试 (20%)**
   - 模块间集成测试
   - API集成测试
   - 数据库集成测试

3. **端到端测试 (10%)**
   - 完整业务流程测试
   - 用户场景测试
   - 跨浏览器测试

### 测试环境
- **开发环境**: 本地开发时的快速测试
- **测试环境**: CI/CD流水线中的自动化测试
- **预生产环境**: 生产前的完整测试
- **生产环境**: 监控和健康检查

## 🔧 测试配置

### Jest配置 (后端)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ]
};
```

### 测试数据库
- 使用独立的测试数据库
- 每次测试前重置数据
- 使用事务回滚保证数据隔离

## 📋 质量标准

### 代码覆盖率目标
- **单元测试覆盖率**: ≥ 80%
- **集成测试覆盖率**: ≥ 60%
- **关键业务逻辑**: 100%

### 性能基准
- **API响应时间**: < 200ms (95th percentile)
- **数据库查询**: < 100ms (平均)
- **页面加载时间**: < 2s (首屏)

### 测试维护
- 测试代码与业务代码同步更新
- 定期清理过时的测试用例
- 持续优化测试执行效率

## 🔗 相关文档

- [测试使用说明](docs/测试使用说明.md)
- [测试计划](docs/测试计划.md)
- [API开发指南](../docs/development/API_Development_Guide.md)
- [性能监控框架](../docs/development/Metrics_Framework.md)
