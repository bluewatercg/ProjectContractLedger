# Apps 文件夹说明

本文件夹包含项目的前后端应用代码。

## 📁 文件夹结构

```
apps/
├── backend/          # 后端应用（Midway框架）
└── frontend/         # 前端应用（Vue3 + Element Plus）
```

## 🔧 Backend 文件夹 (`apps/backend/`)

### 核心文件
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `bootstrap.js` | 应用启动入口文件 | ✅ 活跃维护 |
| `package.json` | 后端依赖配置 | ✅ 活跃维护 |
| `tsconfig.json` | TypeScript配置 | ✅ 活跃维护 |
| `jest.config.js` | Jest测试配置 | ✅ 活跃维护 |

### 工具文件
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `generate_password_hash.js` | 密码哈希生成工具 | ✅ 开发工具 |
| `test-compile.js` | 编译测试脚本 | ✅ 开发工具 |

### 目录结构
| 目录路径 | 作用 | 维护状态 |
|---------|------|----------|
| `src/` | 源代码目录 | ✅ 活跃维护 |
| `src/controller/` | 控制器层 | ✅ 活跃维护 |
| `src/service/` | 服务层 | ✅ 活跃维护 |
| `src/entity/` | 数据实体 | ✅ 活跃维护 |
| `src/middleware/` | 中间件 | ✅ 活跃维护 |
| `src/config/` | 配置文件 | ✅ 活跃维护 |
| `src/utils/` | 工具函数 | ✅ 活跃维护 |
| `dist/` | 编译输出目录 | 🔄 自动生成 |
| `logs/` | 日志目录 | 🔄 运行时生成 |
| `test/` | 测试文件 | ✅ 活跃维护 |

## 🎨 Frontend 文件夹 (`apps/frontend/`)

### 核心文件
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `package.json` | 前端依赖配置 | ✅ 活跃维护 |
| `vite.config.ts` | Vite构建配置 | ✅ 活跃维护 |
| `tsconfig.json` | TypeScript配置 | ✅ 活跃维护 |
| `index.html` | HTML入口文件 | ✅ 活跃维护 |

### 自动生成文件
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `auto-imports.d.ts` | 自动导入类型声明 | 🔄 自动生成 |
| `components.d.ts` | 组件类型声明 | 🔄 自动生成 |

### 目录结构
| 目录路径 | 作用 | 维护状态 |
|---------|------|----------|
| `src/` | 源代码目录 | ✅ 活跃维护 |
| `src/views/` | 页面组件 | ✅ 活跃维护 |
| `src/components/` | 公共组件 | ✅ 活跃维护 |
| `src/layouts/` | 布局组件 | ✅ 活跃维护 |
| `src/router/` | 路由配置 | ✅ 活跃维护 |
| `src/stores/` | 状态管理 | ✅ 活跃维护 |
| `src/api/` | API接口 | ✅ 活跃维护 |
| `src/utils/` | 工具函数 | ✅ 活跃维护 |
| `src/styles/` | 样式文件 | ✅ 活跃维护 |
| `dist/` | 构建输出目录 | 🔄 自动生成 |

## 🚀 快速开始

### 后端开发
```bash
cd apps/backend
yarn install
yarn dev
```

### 前端开发
```bash
cd apps/frontend
yarn install
yarn dev
```

## 📝 注意事项

1. **依赖管理**：使用yarn作为包管理器
2. **代码规范**：遵循ESLint和Prettier配置
3. **类型检查**：使用TypeScript进行类型检查
4. **测试**：后端使用Jest进行单元测试
5. **构建**：前端使用Vite进行快速构建

## 🔗 相关文档

- [后端API开发指南](../docs/development/API_Development_Guide.md)
- [数据库设计文档](../docs/development/Database_Design.md)
- [启动指南](../docs/user-guide/启动指南.md)
