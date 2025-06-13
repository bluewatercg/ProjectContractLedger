# 客户合同管理系统 - 后端服务

基于 Midway v3 框架开发的后端 API 服务。

## 快速入门

### 本地开发

```bash
$ yarn install
$ yarn dev
$ open http://localhost:8080/
```

### 生产部署

```bash
$ yarn build
$ yarn start
```

### 可用脚本

- `yarn dev` - 启动开发服务器 (端口: 8080)
- `yarn build` - 构建生产版本
- `yarn start` - 启动生产服务器
- `yarn test` - 运行单元测试
- `yarn lint` - 代码风格检查
- `yarn lint:fix` - 自动修复代码风格问题

### API 文档

启动服务后访问: http://localhost:8080/api-docs

### 技术栈

- **框架**: Midway v3 + Koa
- **数据库**: MySQL + TypeORM
- **认证**: JWT
- **验证**: @midwayjs/validate
- **文档**: Swagger

更多信息请参见 [Midway 文档][midway]。

[midway]: https://midwayjs.org
