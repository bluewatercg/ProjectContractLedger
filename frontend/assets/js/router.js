/**
 * 简单的前端路由系统
 * 支持页面切换
 */

class Router {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.routes = {};
    this.currentRoute = null;
    this.container = options.container || document.getElementById('app');
    this.notFoundHandler = options.notFoundHandler || this.defaultNotFoundHandler;
    this.beforeEach = options.beforeEach || null;
    this.afterEach = options.afterEach || null;
    
    this.init();
  }

  /**
   * 初始化路由
   */
  init() {
    // 监听浏览器前进后退
    window.addEventListener('popstate', () => {
      this.handleRouteChange();
    });
    
    // 拦截链接点击
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.getAttribute('data-router-link') !== null) {
        e.preventDefault();
        const href = link.getAttribute('href');
        this.push(href);
      }
    });
    
    // 处理当前路由
    this.handleRouteChange();
  }

  /**
   * 添加路由
   * @param {string} path - 路径
   * @param {Function} handler - 处理函数
   */
  add(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  /**
   * 导航到指定路径
   * @param {string} path - 路径
   * @param {Object} state - 状态对象
   */
  push(path, state = {}) {
    window.history.pushState(state, '', path);
    this.handleRouteChange();
  }

  /**
   * 替换当前路径
   * @param {string} path - 路径
   * @param {Object} state - 状态对象
   */
  replace(path, state = {}) {
    window.history.replaceState(state, '', path);
    this.handleRouteChange();
  }

  /**
   * 处理路由变化
   */
  async handleRouteChange() {
    const path = window.location.pathname;
    const query = this.parseQuery(window.location.search);
    const params = {};
    
    let handler = null;
    
    // 查找匹配的路由
    for (const routePath in this.routes) {
      const match = this.matchRoute(routePath, path, params);
      if (match) {
        handler = this.routes[routePath];
        break;
      }
    }
    
    // 如果没有找到匹配的路由，使用404处理器
    if (!handler) {
      this.notFoundHandler(this.container, path);
      return;
    }
    
    const to = { path, query, params };
    const from = this.currentRoute;
    
    // 前置钩子
    if (this.beforeEach) {
      const result = await this.beforeEach(to, from);
      if (result === false) {
        return;
      }
      
      // 支持重定向
      if (typeof result === 'string') {
        this.replace(result);
        return;
      }
    }
    
    // 调用路由处理器
    await handler(this.container, { path, query, params });
    
    // 更新当前路由
    this.currentRoute = to;
    
    // 后置钩子
    if (this.afterEach) {
      this.afterEach(to, from);
    }
  }

  /**
   * 匹配路由
   * @param {string} routePath - 路由路径
   * @param {string} currentPath - 当前路径
   * @param {Object} params - 参数对象
   * @returns {boolean} - 是否匹配
   */
  matchRoute(routePath, currentPath, params) {
    // 精确匹配
    if (routePath === currentPath) {
      return true;
    }
    
    // 参数路由匹配
    const routeParts = routePath.split('/');
    const currentParts = currentPath.split('/');
    
    if (routeParts.length !== currentParts.length) {
      return false;
    }
    
    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const currentPart = currentParts[i];
      
      // 参数部分
      if (routePart.startsWith(':')) {
        const paramName = routePart.slice(1);
        params[paramName] = currentPart;
      } else if (routePart !== currentPart) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 解析查询参数
   * @param {string} queryString - 查询字符串
   * @returns {Object} - 查询参数对象
   */
  parseQuery(queryString) {
    const query = {};
    
    if (!queryString || queryString === '?') {
      return query;
    }
    
    const searchParams = new URLSearchParams(queryString);
    for (const [key, value] of searchParams.entries()) {
      query[key] = value;
    }
    
    return query;
  }

  /**
   * 默认的404处理器
   * @param {HTMLElement} container - 容器元素
   * @param {string} path - 路径
   */
  defaultNotFoundHandler(container, path) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 class="text-6xl font-bold text-gray-800">404</h1>
        <p class="text-xl text-gray-600 mt-4">页面未找到</p>
        <p class="text-gray-500 mt-2">请求的路径 "${path}" 不存在</p>
        <a href="/" class="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" data-router-link>返回首页</a>
      </div>
    `;
  }

  /**
   * 后退
   */
  back() {
    window.history.back();
  }

  /**
   * 前进
   */
  forward() {
    window.history.forward();
  }

  /**
   * 跳转指定步数
   * @param {number} n - 步数
   */
  go(n) {
    window.history.go(n);
  }

  /**
   * 获取当前路由
   * @returns {Object} - 当前路由
   */
  getCurrentRoute() {
    return this.currentRoute;
  }
}

export default Router; 