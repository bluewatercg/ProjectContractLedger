# GitHub Actions 路径更新说明

## 概述

由于项目结构重组，GitHub Actions工作流文件中的路径引用已全部更新，以确保CI/CD流程正常运行。

## 更新的文件

### 1. `.github/workflows/docker-build-push.yml`

**主要变更：**
- 依赖缓存路径更新
- 构建步骤中的目录路径更新
- Docker文件路径更新
- 部署说明中的路径更新

**具体变更：**
```yaml
# 原路径
cache-dependency-path: |
  midway-backend/yarn.lock
  midway-frontend/yarn.lock

# 新路径
cache-dependency-path: |
  apps/backend/yarn.lock
  apps/frontend/yarn.lock
```

```yaml
# 原路径
cd midway-backend
cd midway-frontend

# 新路径
cd apps/backend
cd apps/frontend
```

```yaml
# 原路径
file: ./Dockerfile

# 新路径
file: ./tools/docker/Dockerfile
```

### 2. `.github/workflows/test-build.yml`

**主要变更：**
- Docker文件路径更新

**具体变更：**
```yaml
# 原路径
file: ./Dockerfile.simple
file: ./Dockerfile

# 新路径
file: ./tools/docker/Dockerfile
file: ./tools/docker/Dockerfile
```

### 3. `.github/workflows/simple-test.yml`

**状态：** 无需更新（仅包含基本的检出和测试步骤）

## 项目结构变更对照表

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `midway-backend/` | `apps/backend/` | 后端应用目录 |
| `midway-frontend/` | `apps/frontend/` | 前端应用目录 |
| `Dockerfile` | `tools/docker/Dockerfile` | Docker构建文件 |
| `docker-compose.yml` | `tools/docker/docker-compose.yml` | Docker编排文件 |
| `docker-compose.external-simple.yml` | `tools/docker/docker-compose.external-simple.yml` | 外部服务Docker配置 |

## 验证更新

### 1. 本地验证

```bash
# 检查GitHub Actions配置
scripts/utils/check-github-actions.bat

# 验证Docker构建
yarn docker:build

# 验证依赖安装
yarn install-all
```

### 2. CI/CD验证

推送代码后，检查以下工作流是否正常运行：

1. **Simple Test** - 基本测试工作流
2. **Test Build** - 构建测试工作流
3. **Build and Push Docker Images** - Docker构建和推送工作流

### 3. 检查要点

- [ ] 依赖安装步骤是否成功
- [ ] 代码格式化和检查是否通过
- [ ] 前后端构建是否成功
- [ ] Docker镜像构建是否成功
- [ ] 镜像推送是否成功

## 部署说明更新

部署文档中的下载命令已更新：

```bash
# 原命令
wget https://raw.githubusercontent.com/${{ github.repository }}/main/docker-compose.external-simple.yml

# 新命令
wget https://raw.githubusercontent.com/${{ github.repository }}/main/tools/docker/docker-compose.external-simple.yml
```

```bash
# 原命令
docker-compose -f docker-compose.external-simple.yml --env-file .env.external-simple up -d

# 新命令
docker-compose -f tools/docker/docker-compose.external-simple.yml --env-file .env.external-simple up -d
```

## 故障排除

### 1. 构建失败

如果GitHub Actions构建失败，检查：

1. **路径错误**：确认所有路径引用已更新
2. **文件缺失**：确认Docker文件已移动到正确位置
3. **依赖问题**：确认package.json路径正确

### 2. Docker构建失败

如果Docker构建失败：

1. 检查Dockerfile中的COPY路径
2. 确认构建上下文正确
3. 验证依赖文件存在

### 3. 部署失败

如果部署失败：

1. 检查docker-compose文件路径
2. 确认环境变量文件路径
3. 验证镜像标签正确

## 相关文档

- [项目结构说明-新版](../user-guide/项目结构说明-新版.md)
- [Docker部署指南](./Docker_Deployment.md)
- [GitHub Actions部署指南](./GitHub_Actions_部署指南.md)

## 注意事项

1. **向后兼容性**：旧的路径引用已全部更新，不再支持旧路径
2. **文档同步**：所有相关文档已同步更新
3. **脚本更新**：所有启动脚本和工具脚本已更新路径引用

---

**更新日期**：2024年1月
**更新内容**：项目结构重组后的GitHub Actions路径更新
