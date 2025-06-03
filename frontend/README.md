# 合同管理系统 - 前端

## 项目概述

合同管理系统是一个基于原生JavaScript开发的单页面应用(SPA)，用于管理客户、合同、发票和付款信息。系统采用模块化设计，无需任何前端框架，通过原生JavaScript实现了路由、组件化开发和数据管理功能。

## 技术栈

- **HTML5/CSS3**：页面结构和样式
- **JavaScript (ES6+)**：核心编程语言
- **Tailwind CSS**：CSS框架，用于快速构建响应式界面
- **Font Awesome**：图标库
- **原生模块系统**：使用ES模块进行代码组织
- **自定义路由系统**：实现前端路由和页面切换
- **自定义组件系统**：实现UI组件化

## 项目结构

```
frontend/
│
├── index.html              # 主入口文件（重定向到pages/index.html）
│
├── pages/                  # HTML页面文件
│   ├── index.html          # 首页
│   ├── login.html          # 登录页
│   ├── dashboard.html      # 仪表盘页面
│   ├── customers.html      # 客户管理页面
│   ├── customer-detail.html # 客户详情页面
│   ├── customer-create.html # 创建客户页面
│   ├── contracts.html      # 合同管理页面
│   ├── contract-detail.html # 合同详情页面
│   ├── contract-create.html # 创建合同页面
│   ├── invoices.html       # 发票管理页面
│   ├── invoice-detail.html # 发票详情页面
│   ├── invoice-create.html # 创建发票页面
│   ├── payments.html       # 付款管理页面
│   ├── payment-create.html # 创建付款页面
│   ├── notifications.html  # 通知页面
│   └── settings.html       # 设置页面
│
└── assets/                 # 静态资源
    ├── css/                # CSS样式文件
    │   └── style.css       # 自定义样式
    │
    └── js/                 # JavaScript文件
        ├── app.js          # 应用入口
        ├── router.js       # 路由系统
        │
        ├── components/     # UI组件
        │   ├── component.js # 基础组件类
        │   ├── alert.js    # 提示组件
        │   ├── card.js     # 卡片组件
        │   ├── form.js     # 表单组件
        │   ├── modal.js    # 模态框组件
        │   ├── navbar.js   # 导航栏组件
        │   ├── sidebar.js  # 侧边栏组件
        │   └── table.js    # 表格组件
        │
        ├── pages/          # 页面控制器
        │   ├── login.js    # 登录页控制器
        │   ├── dashboard.js # 仪表盘页控制器
        │   ├── customers.js # 客户管理页控制器
        │   └── ...         # 其他页面控制器
        │
        ├── services/       # 服务层
        │   ├── api.js      # API基础服务
        │   ├── auth.js     # 认证服务
        │   ├── customer.js # 客户服务
        │   ├── contract.js # 合同服务
        │   ├── invoice.js  # 发票服务
        │   ├── payment.js  # 付款服务
        │   └── statistics.js # 统计服务
        │
        └── utils/          # 工具函数
            ├── formatter.js # 格式化工具
            ├── storage.js  # 存储工具
            └── validator.js # 验证工具
```

## 安装和启动

本项目是纯前端项目，可以通过以下方式启动：

### 方法1：使用npm启动（推荐）

1. 安装Node.js（如果尚未安装）
2. 在前端项目目录运行：
   ```
   npm install
   npm start
   ```
3. 打开浏览器访问：`http://localhost:3001`

### 方法2：使用HTTP服务器

1. 安装Node.js（如果尚未安装）
2. 安装http-server：`npm install -g http-server`
3. 在项目根目录运行：`http-server frontend -p 3001`
4. 打开浏览器访问：`http://localhost:3001`

### 方法3：使用Python内置HTTP服务器

1. 安装Python（如果尚未安装）
2. 在项目根目录运行：
   - Python 2: `python -m SimpleHTTPServer 3001`
   - Python 3: `python -m http.server 3001`
3. 打开浏览器访问：`http://localhost:3001/frontend`

### 方法4：使用VSCode Live Server插件

1. 在VSCode中安装"Live Server"插件
2. 右键点击`frontend/index.html`文件
3. 选择"Open with Live Server"
4. 在插件设置中将端口配置为3001
5. 浏览器将自动打开项目

## 主要功能模块

### 1. 认证系统
- 用户登录/登出
- 会话管理
- 权限控制

### 2. 客户管理
- 客户列表查看
- 客户详情查看
- 添加/编辑/删除客户

### 3. 合同管理
- 合同列表查看
- 合同详情查看
- 添加/编辑/删除合同
- 合同状态跟踪

### 4. 发票管理
- 发票列表查看
- 发票详情查看
- 添加/编辑/删除发票
- 发票状态跟踪

### 5. 付款管理
- 付款记录查看
- 添加/编辑/删除付款记录
- 付款状态跟踪

### 6. 仪表盘
- 数据统计和可视化
- 待办事项提醒
- 系统概览

### 7. 通知系统
- 系统通知
- 提醒事项

### 8. 系统设置
- 用户偏好设置
- 系统配置

## 开发指南

### 添加新页面

1. 在`frontend/pages`目录下创建新的HTML文件
2. 在`frontend/assets/js/pages`目录下创建对应的JavaScript控制器
3. 在`frontend/assets/js/app.js`中注册新的路由

```javascript
// 在app.js中添加路由
this.router.add('/pages/your-new-page.html', async (container) => {
  const { default: YourNewPage } = await import('./pages/your-new-page.js');
  new YourNewPage(container);
});
```

### 创建新组件

1. 在`frontend/assets/js/components`目录下创建新的组件文件
2. 继承基础组件类`Component`
3. 实现必要的方法（如`render`、`initialize`等）

```javascript
// 示例：创建新组件
import Component from './component.js';

class YourComponent extends Component {
  constructor(el, options = {}) {
    super(el);
    this.options = options;
    this.initialize();
  }
  
  initialize() {
    this.render();
    this.bindEvents();
  }
  
  render() {
    this.el.innerHTML = `
      <!-- 组件HTML结构 -->
    `;
  }
  
  bindEvents() {
    // 绑定事件处理函数
  }
}

export default YourComponent;
```

### 添加新服务

1. 在`frontend/assets/js/services`目录下创建新的服务文件
2. 实现必要的API调用和数据处理方法

```javascript
// 示例：创建新服务
import api from './api.js';

class YourService {
  async getData() {
    return await api.get('/your-endpoint');
  }
  
  async saveData(data) {
    return await api.post('/your-endpoint', data);
  }
}

export default new YourService();
```

## 项目特点

1. **无框架依赖**：不依赖Vue、React等前端框架，使用原生JavaScript实现全部功能
2. **模块化设计**：使用ES模块系统组织代码，提高可维护性
3. **组件化开发**：自定义组件系统，实现UI复用
4. **响应式设计**：使用Tailwind CSS实现全响应式界面，适配各种设备
5. **路由系统**：自定义前端路由系统，实现单页面应用体验
6. **服务层抽象**：将API调用封装在服务层，便于管理和维护
7. **工具函数集**：提供格式化、验证、存储等常用工具函数 