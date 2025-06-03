/**
 * 组件基类
 * 提供基础的组件功能，包括渲染、事件绑定等
 */
class Component {
  /**
   * 构造函数
   * @param {string|HTMLElement} el - 组件容器元素或选择器
   */
  constructor(el) {
    this.el = typeof el === 'string' ? document.querySelector(el) : el;
    if (!this.el) {
      throw new Error(`Element ${el} not found`);
    }
    this.initialize();
  }

  /**
   * 初始化方法，子类应覆盖此方法
   */
  initialize() {}

  /**
   * 渲染方法
   * @param {string} template - 模板字符串
   * @param {Object} data - 渲染数据
   */
  render(template, data = {}) {
    if (!template) return;
    
    // 简单的模板替换
    let html = template;
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, data[key]);
    });
    
    this.el.innerHTML = html;
    this.afterRender();
  }

  /**
   * 渲染后的钩子，子类可覆盖此方法
   */
  afterRender() {}

  /**
   * 事件绑定
   * @param {string} eventType - 事件类型
   * @param {string} selector - 选择器
   * @param {Function} callback - 回调函数
   */
  on(eventType, selector, callback) {
    this.el.addEventListener(eventType, (event) => {
      const target = event.target.closest(selector);
      if (target && this.el.contains(target)) {
        callback.call(this, event, target);
      }
    });
  }

  /**
   * 显示组件
   */
  show() {
    this.el.style.display = '';
  }

  /**
   * 隐藏组件
   */
  hide() {
    this.el.style.display = 'none';
  }

  /**
   * 销毁组件
   */
  destroy() {
    // 子类可以覆盖此方法以进行清理
    this.el.innerHTML = '';
  }
}

export default Component; 