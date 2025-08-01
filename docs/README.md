# Docs 文件夹说明

本文件夹包含项目的完整文档体系，涵盖API文档、部署指南、设计文档、开发指南和用户手册。

## 📁 文件夹结构

```
docs/
├── api/              # API接口文档
├── deployment/       # 部署相关文档
├── design/           # 设计文档和原型
├── development/      # 开发指南和技术文档
└── user-guide/       # 用户指南和操作手册
```

## 📚 API 文档 (`docs/api/`)

### 后端服务文档
| 目录路径 | 作用 | 维护状态 |
|---------|------|----------|
| `backend_service/` | 后端API接口文档 | ✅ 活跃维护 |

**内容包含**：
- RESTful API接口规范
- 请求/响应格式说明
- 认证和授权机制
- 错误码定义
- 接口使用示例

## 🚀 部署文档

### 部署指南
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `DEPLOYMENT_GUIDE.md` | 生产环境部署指南 | ✅ 生产就绪 |
| `docker-build-guide.md` | Docker镜像构建指南 | ✅ 生产就绪 |
| `dockerfile-configuration.md` | Dockerfile配置详解 | ✅ 生产就绪 |
| `build-checklist.md` | 构建和部署检查清单 | ✅ 生产就绪 |
| `SEPARATED_DEPLOYMENT_SUMMARY.md` | 分离式部署总结 | ✅ 生产就绪 |
| `分离式前后端部署指南.md` | 分离式部署详细指南 | ✅ 生产就绪 |

### 专项指南
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `API_VERSION_MANAGEMENT.md` | API版本管理指南 | ✅ 活跃维护 |
| `GITHUB_RELEASE_GUIDE.md` | GitHub构建发布指南 | ✅ 活跃维护 |
| `DOCKER_DEPLOYMENT_SUMMARY.md` | Docker部署配置总结 | ✅ 活跃维护 |

**功能特性**：
- 完整的Docker构建流程
- 生产环境部署最佳实践
- 分离式前后端部署方案
- GitHub Actions自动化部署
- API版本管理策略
- 故障排除和问题解决

## 🎨 Design 文档 (`docs/design/`)

### 设计文档
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `Flowchart.md` | 业务流程图文档 | ✅ 活跃维护 |

### 设计资源
| 目录路径 | 作用 | 维护状态 |
|---------|------|----------|
| `prototypes/` | 原型设计文件 | ✅ 设计阶段 |
| `specs/` | 设计规范文档 | ✅ 设计阶段 |

**内容包含**：
- 系统架构设计
- 业务流程图
- 用户界面原型
- 设计规范和标准

## 💻 Development 文档 (`docs/development/`)

### 开发指南
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `API_Development_Guide.md` | API开发指南 | ✅ 活跃维护 |
| `Database_Design.md` | 数据库设计文档 | ✅ 活跃维护 |
| `Database_Design_Update.md` | 数据库设计更新说明 | ✅ 活跃维护 |
| `Docker_Deployment.md` | Docker部署文档 | ✅ 活跃维护 |
| `Metrics_Framework.md` | 指标框架文档 | ✅ 活跃维护 |

### CI/CD 文档
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `GitHub_Actions_路径更新说明.md` | GitHub Actions路径更新 | ✅ 维护文档 |
| `GitHub_Actions_部署指南.md` | GitHub Actions部署指南 | ✅ 活跃维护 |

**技术栈覆盖**：
- Midway框架开发
- TypeScript最佳实践
- 数据库设计和优化
- Docker容器化
- CI/CD自动化部署
- 性能监控和指标

## 📖 User Guide 文档 (`docs/user-guide/`)

### 用户指南
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `启动指南.md` | 项目启动指南 | ✅ 活跃维护 |
| `快速部署指南.md` | 快速部署指南 | ✅ 活跃维护 |
| `Yarn命令指南.md` | Yarn命令使用指南 | ✅ 开发工具 |

### 项目文档
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `项目结构说明.md` | 项目结构说明 | ✅ 活跃维护 |

### 产品文档
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `PRD.md` | 产品需求文档 | ✅ 产品规划 |
| `Roadmap.md` | 产品路线图 | ✅ 产品规划 |
| `User_Story_Map.md` | 用户故事地图 | ✅ 产品规划 |

### 业务文档
| 文件路径 | 作用 | 维护状态 |
|---------|------|----------|
| `业务状态关系说明.md` | 业务状态关系说明 | ✅ 业务文档 |
| `Customer_Select_Component.md` | 客户选择组件说明 | ✅ 功能文档 |

## 📋 文档分类

### 🟢 生产就绪文档
- 部署指南和检查清单
- API开发指南
- 数据库设计文档
- Docker配置文档

### 🟡 开发工具文档
- Yarn命令指南
- GitHub Actions配置
- 开发环境设置

### 🔵 产品规划文档
- 产品需求文档
- 路线图规划
- 用户故事地图

### 🟠 业务文档
- 业务流程说明
- 功能组件文档
- 状态关系说明

## 🚀 快速导航

### 🌟 新手入门
1. [⚡ 快速入门指南](QUICK_START.md) - 5分钟快速体验
2. [📖 完整用户指南](USER_GUIDE.md) - 详细使用说明
3. [🏗️ 系统架构设计](ARCHITECTURE.md) - 技术架构详解
4. [🛠️ 开发环境设置](DEVELOPMENT_SETUP.md) - 完整开发环境配置

### 👨‍💻 开发者
1. [🚀 API开发指南](development/API_Development_Guide.md) - Midway.js最佳实践
2. [🗄️ 数据库设计](development/Database_Design.md) - 数据模型详解
3. [🐳 Docker部署](development/Docker_Deployment.md) - 容器化部署
4. [🤝 贡献指南](CONTRIBUTING.md) - 如何参与项目开发

### 🛠️ 运维人员
1. [📋 部署指南](DEPLOYMENT_GUIDE.md) - 生产环境部署
2. [🔧 故障排除](TROUBLESHOOTING.md) - 常见问题解决
3. [🏗️ Docker构建指南](docker-build-guide.md) - 镜像构建流程

### 📊 产品经理
1. [📋 产品需求文档](user-guide/PRD.md) - 完整产品规划
2. [🗺️ 产品路线图](development/Roadmap.md) - 功能发展规划
3. [📝 用户故事地图](development/User_Story_Map.md) - 用户需求分析

## 📝 文档维护

### 更新频率
- **API文档**: 随代码变更实时更新
- **部署文档**: 每次部署流程变更时更新
- **开发指南**: 技术栈变更时更新
- **用户指南**: 功能变更时更新

### 质量标准
- 内容准确性和时效性
- 步骤清晰可操作
- 示例代码可运行
- 截图和图表清晰

### 贡献指南
1. 文档变更需要与代码变更同步
2. 重要变更需要更新相关的多个文档
3. 新功能需要补充相应的文档
4. 定期检查和更新过时内容

## 🔗 外部链接

- [Midway官方文档](https://midwayjs.org/)
- [Vue3官方文档](https://vuejs.org/)
- [Element Plus文档](https://element-plus.org/)
- [Docker官方文档](https://docs.docker.com/)
