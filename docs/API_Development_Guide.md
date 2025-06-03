# Node.js API 模块快速开发指南

本指南旨在提供一个清晰的流程，帮助开发者在 `node_api_service` 文件夹下快速生成和搭建新的 API 模块。

## 核心任务

你的核心任务是：

2.  **后端 API 开发**: 根据 `backend_service/api_spec.yaml` API 定义文档和 `database/scripts/mysql_init.sql` 数据库结构文件，使用 Node.js (及选定框架) 开发和实现后端 API 服务。

## 关键输入

*   **API 定义文档 (后端实现依据与前端调用契约)**: `backend_service/api_spec.yaml`。包含所有 API 端点、请求/响应格式、HTTP 方法、状态码等。
*   **数据库结构文件 (后端数据模型)**: `database/scripts/mysql_init.sql`。定义了 MySQL 数据库的表结构。
*   **数据库查询文件**: `database/scripts/queries.sql`。可作为后端复杂查询逻辑的参考。
*   **(推荐) 产品需求文档 (PRD)**: (假设路径 `docs/PRD.md`) 获取整体业务背景、用户故事和非功能性需求。

## 1. 现有 API 模块结构概览

在开始新模块开发之前，了解现有模块的结构和集成方式至关重要。

*   **控制器 (`node_api_service/controllers/`)**: 包含处理具体业务逻辑的异步函数。例如，`customerController.js` 负责客户相关的 CRUD 操作。
*   **路由 (`node_api_service/routes/`)**: 定义 API 路径，并将这些路径映射到对应的控制器函数。例如，`customerRoutes.js` 定义了 `/customers` 相关的路由。
*   **应用入口 (`node_api_service/app.js`)**: 负责加载中间件、注册 API 文档路由，并引入和使用各个模块的路由。
*   **API 规范 (`backend_service/api_spec.yaml`)**: 使用 OpenAPI (Swagger) 规范定义了所有 API 的路径、操作、请求体、响应结构和安全认证等。这是 API 文档的来源。

## 2. 新 API 模块开发流程

以下是开发新 API 模块的详细步骤：

### 步骤 2.1: 定义 OpenAPI 规范

在 [`backend_service/api_spec.yaml`](backend_service/api_spec.yaml) 中添加新模块的定义。这是 API 的“合同”，它定义了 API 的行为和结构。

*   **路径 (Paths)**: 定义新 API 的所有端点，例如 `/api/v1/products`。
*   **操作 (Operations)**: 为每个路径定义支持的 HTTP 方法（GET, POST, PUT, DELETE），并描述其功能。
*   **请求体 (Request Bodies)**: 定义 POST/PUT 请求的输入数据结构。
*   **响应 (Responses)**: 定义不同 HTTP 状态码（如 200, 201, 400, 404, 500）下的响应数据结构。
*   **安全认证 (Security)**: 如果 API 需要认证，请在操作中引用已定义的安全方案（例如 `BearerAuth`）。
*   **组件 (Components)**: 定义可重用的模式（Schemas）用于请求体和响应，以及安全方案。

**示例 (`api_spec.yaml` 片段):**

```yaml
paths:
  /products:
    get:
      summary: 获取所有产品
      tags:
        - Products
      parameters:
        - in: query
          name: name
          schema:
            type: string
          description: 产品名称模糊搜索
      responses:
        200:
          description: 成功获取产品列表
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Product'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
    post:
      summary: 创建新产品
      tags:
        - Products
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductCreate'
      responses:
        201:
          description: 产品创建成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'
components:
  schemas:
    Product:
      type: object
      properties:
        product_id:
          type: integer
          format: int64
        name:
          type: string
        price:
          type: number
          format: float
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
    ProductCreate:
      type: object
      required:
        - name
        - price
      properties:
        name:
          type: string
        price:
          type: number
          format: float
    Pagination:
      type: object
      properties:
        total:
          type: integer
        page:
          type: integer
        pageSize:
          type: integer
```

### 步骤 2.2: 创建控制器文件

在 [`node_api_service/controllers/`](node_api_service/controllers/) 目录下创建 `[新模块名]Controller.js` 文件（例如 `productController.js`）。

*   **引入依赖**: 引入数据库连接池 (`pool`) 和其他必要的模块。
*   **编写异步函数**: 为每个 API 接口编写一个异步函数。这些函数将接收 `req` (请求) 和 `res` (响应) 对象。
*   **请求参数解析**: 从 `req.params` (路径参数), `req.query` (查询参数) 和 `req.body` (请求体) 中解析所需的数据。
*   **输入验证 (可选)**: 如果需要，可以使用 `express-validator` 对输入数据进行验证。
*   **业务逻辑和数据库操作**: 执行核心业务逻辑，并通过 `pool.execute()` 与 MySQL 数据库进行交互。
*   **错误处理**: 使用 `try-catch` 块捕获并处理可能发生的错误，向客户端返回适当的错误响应。
*   **发送响应**: 使用 `res.json()` 或 `res.status().json()` 发送 JSON 格式的响应数据。
*   **导出函数**: 将所有控制器函数导出，以便在路由文件中使用。

**示例 (`productController.js`):**

```javascript
const { pool } = require('../config/database');

async function getAllProducts(req, res) {
  try {
    const { name } = req.query;
    let query = 'SELECT product_id, name, price, created_at, updated_at FROM products';
    let queryParams = [];

    if (name) {
      query += ' WHERE name LIKE ?';
      queryParams.push(`%${name}%`);
    }

    const [products] = await pool.execute(query, queryParams);
    res.json(products);
  } catch (error) {
    console.error('获取产品列表错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

async function createProduct(req, res) {
  try {
    const { name, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: '产品名称和价格为必填项' });
    }

    const [result] = await pool.execute(
      'INSERT INTO products (name, price) VALUES (?, ?)',
      [name, price]
    );

    const [products] = await pool.execute(
      'SELECT product_id, name, price, created_at, updated_at FROM products WHERE product_id = ?',
      [result.insertId]
    );

    res.status(201).json(products[0]);
  } catch (error) {
    console.error('创建产品错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
}

module.exports = {
  getAllProducts,
  createProduct,
  // ... 其他产品相关的控制器函数
};
```

### 步骤 2.3: 创建路由文件

在 [`node_api_service/routes/`](node_api_service/routes/) 目录下创建 `[新模块名]Routes.js` 文件（例如 `productRoutes.js`）。

*   **引入依赖**: 引入 `express` 和您刚刚创建的控制器文件。
*   **创建路由实例**: 使用 `express.Router()` 创建一个路由实例。
*   **定义路由**: 根据 OpenAPI 规范中定义的路径和 HTTP 方法，使用 `router.get()`、`router.post()`、`router.put()`、`router.delete()` 等方法将 API 路径映射到对应的控制器函数。
*   **中间件 (可选)**: 如果 API 需要认证或特定的中间件处理，可以在路由中添加。例如，`authMiddleware.verifyToken` 用于验证用户身份。
*   **导出路由**: 导出路由实例。

**示例 (`productRoutes.js`):**

```javascript
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware'); // 如果需要认证

// 获取所有产品 (可能需要认证)
router.get('/', authMiddleware.verifyToken, productController.getAllProducts);

// 创建新产品 (需要认证)
router.post('/', authMiddleware.verifyToken, productController.createProduct);

module.exports = router;
```

### 步骤 2.4: 在 `app.js` 中注册新路由

打开 [`node_api_service/app.js`](node_api_service/app.js) 文件，在现有路由注册的部分添加新模块的路由。

```javascript
// ... 其他路由
app.use(`${apiBasePath}/users`, require('./routes/userRoutes'));
app.use(`${apiBasePath}/products`, require('./routes/productRoutes')); // 添加新模块路由
```

### 步骤 2.5: 测试新 API

完成代码编写后，进行测试以确保新 API 按预期工作。

*   **启动服务**: 如果服务尚未运行，请在 `node_api_service` 目录下运行 `npm run dev` 命令。
*   **检查 Swagger UI**: 访问 `http://127.0.0.1:8080/api-docs`，确认新 API 已正确显示在文档中，并且其描述、参数和响应都符合预期。
*   **使用 API 测试工具**: 使用 Postman、Insomnia 或 `curl` 等工具发送请求，测试新 API 的各个端点，验证其功能和响应。

## 3. 开发流程可视化

```mermaid
graph TD
    A[开始] --> B{定义API规范};
    B --> C[更新 backend_service/api_spec.yaml];
    C --> D[创建控制器文件];
    D --> E[编写业务逻辑和数据库操作];
    E --> F[创建路由文件];
    F --> G[定义API路径和控制器映射];
    G --> H[在 app.js 中注册新路由];
    H --> I[启动服务];
    I --> J[测试新API (Swagger UI & Postman)];
    J --> K[完成];
```

## 4. 关键输出

2.  **Node.js 后端 API 代码库 (分阶段或并行开发)**:
    *   保存目录: `node_api_service/`
    *   技术栈: Node.js, Express.js (或协调者指定的其他框架), MySQL (建议使用 ORM如 Prisma 或 Sequelize，或原生 `mysql2` 驱动)。
    *   内容:
        *   **API 接口实现**: 严格按照 `api_spec.yaml` 实现所有定义的 API 端点，包括路由、请求参数校验、业务逻辑处理、响应格式。
        *   **数据库交互**: 根据 `mysql_init.sql` 的表结构，实现数据的增删改查 (CRUD) 操作，确保数据一致性和事务性（如果需要）。
        *   **认证与授权**: 实现用户认证 (如 JWT) 和权限控制逻辑。
        *   **错误处理与日志**: 设计健壮的全局错误处理机制，并记录必要的运行日志和错误日志。
        *   **代码质量**: 代码结构清晰（如分层架构：路由层、服务层、数据访问层），模块化，遵循 Node.js 和所选框架的最佳实践，包含必要的注释。

3.  **统一的 README.md 或各子项目独立的 README.md 文件**:
    *   **内容**:
        *   项目简介。
        *   **技术栈说明**: 包括 Node.js 版本、后端框架版本、数据库类型及版本。
        *   **详细的本地开发环境设置步骤**:
            *   **后端**: Node.js 及 npm/yarn 安装，依赖获取 (`npm install` 或 `yarn`), 环境变量配置方法 (如 `.env` 文件，特别是数据库连接字符串、API 密钥等)，数据库初始化命令 (如何使用 `mysql_init.sql`)。
        *   如何 **分别启动后端 API 服务开发服务器**。
        *   如何 **运行单元测试/集成测试** (如果实现了)。
        *   (可选) 简要的部署指南或注意事项。

4.  **(可选) Postman/Insomnia 集合或 .http 文件**:
    *   用于测试后端 API 的请求集合，方便调试和协作。

5.  **(可选) 数据库迁移脚本**:
    *   如果开发过程中对 `mysql_init.sql` 定义的初始结构进行了演进式修改，需要提供相应的迁移脚本。

## 5. 协作说明

你将从协调者那里接收上述“关键输入”中列出的所有设计稿、原型、流程图、规范文档和数据库结构。

**请注意**:

1.  **理解原型和规范的优先级**: `design/prototypes/` 是前端视觉和结构的主要蓝本，`design/specs/Design_Spec.md` 提供细节补充和精确规范，`design/Flowchart.md` 指导业务流程。
2.  **API 驱动与契约先行**: `api_spec.yaml` 是前后端开发的共同契约。后端需严格实现，前端需严格按照定义调用。
3.  **迭代开发与沟通**: UI 实现、API 开发和集成过程可能需要与协调者或设计者进行沟通，以澄清模糊点或处理实现上的挑战。预期会有迭代调整。
4.  **前后端并行**: 在 API 契约明确后，前端可以基于 Mock 数据或 Mock 服务器进行开发，后端并行实现 API 接口，最后进行联调对接。

你的主要产出是 `node_api_service/` 代码库（或一个统一管理的项目）及其相关文档，将交付给协调者，并由测试工程师进行全面的功能、UI、API 和性能测试。

## 6. 总结

遵循以上步骤，您将能够高效地在 `node_api_service` 文件夹下搭建新的 API 模块。请务必在每个阶段进行充分的测试，以确保 API 的质量和稳定性。