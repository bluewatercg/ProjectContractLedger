/**
 * 提示组件
 * 实现消息提示功能
 */
import Component from './component.js';

class Alert extends Component {
  /**
   * 构造函数
   * @param {string|HTMLElement} el - 提示容器元素或选择器
   * @param {Object} options - 配置选项
   */
  constructor(el, options = {}) {
    super(el);
    this.duration = options.duration || 3000;
    this.position = options.position || 'top-right';
    this.maxAlerts = options.maxAlerts || 5;
    this.alerts = [];
  }

  initialize() {
    // 设置容器样式
    this.el.classList.add('fixed', 'z-50');
    
    // 根据位置设置不同的样式
    switch (this.position) {
      case 'top-right':
        this.el.classList.add('top-4', 'right-4');
        break;
      case 'top-left':
        this.el.classList.add('top-4', 'left-4');
        break;
      case 'bottom-right':
        this.el.classList.add('bottom-4', 'right-4');
        break;
      case 'bottom-left':
        this.el.classList.add('bottom-4', 'left-4');
        break;
      case 'top-center':
        this.el.classList.add('top-4', 'left-1/2', 'transform', '-translate-x-1/2');
        break;
      case 'bottom-center':
        this.el.classList.add('bottom-4', 'left-1/2', 'transform', '-translate-x-1/2');
        break;
    }
  }

  /**
   * 显示提示
   * @param {string} type - 提示类型 (success, error, warning, info)
   * @param {string} message - 提示消息
   * @param {number} duration - 显示时长 (毫秒)
   */
  show(type, message, duration = this.duration) {
    // 创建提示元素
    const alert = document.createElement('div');
    alert.className = `alert mb-3 p-4 rounded-lg shadow-lg flex items-center justify-between max-w-md transform transition-all duration-300 ease-in-out opacity-0 translate-x-4`;
    
    // 根据类型设置不同的样式
    switch (type) {
      case 'success':
        alert.classList.add('bg-green-100', 'border-l-4', 'border-green-500', 'text-green-700');
        break;
      case 'error':
        alert.classList.add('bg-red-100', 'border-l-4', 'border-red-500', 'text-red-700');
        break;
      case 'warning':
        alert.classList.add('bg-yellow-100', 'border-l-4', 'border-yellow-500', 'text-yellow-700');
        break;
      case 'info':
      default:
        alert.classList.add('bg-blue-100', 'border-l-4', 'border-blue-500', 'text-blue-700');
        break;
    }
    
    // 设置提示内容
    alert.innerHTML = `
      <div class="flex items-center">
        <div class="flex-shrink-0">
          ${this.getIconByType(type)}
        </div>
        <div class="ml-3">
          <p class="text-sm">${message}</p>
        </div>
      </div>
      <button class="close-alert ml-4 text-gray-500 hover:text-gray-700 focus:outline-none">
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
    `;
    
    // 添加到容器
    this.el.appendChild(alert);
    
    // 添加到提示列表
    const alertInfo = {
      element: alert,
      timeout: null
    };
    this.alerts.push(alertInfo);
    
    // 限制最大提示数量
    if (this.alerts.length > this.maxAlerts) {
      this.removeAlert(this.alerts[0]);
    }
    
    // 绑定关闭事件
    const closeButton = alert.querySelector('.close-alert');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.removeAlert(alertInfo);
      });
    }
    
    // 设置自动消失
    if (duration > 0) {
      alertInfo.timeout = setTimeout(() => {
        this.removeAlert(alertInfo);
      }, duration);
    }
    
    // 显示动画
    setTimeout(() => {
      alert.classList.remove('opacity-0', 'translate-x-4');
    }, 10);
    
    return alertInfo;
  }

  /**
   * 移除提示
   * @param {Object} alertInfo - 提示信息
   */
  removeAlert(alertInfo) {
    if (!alertInfo || !alertInfo.element) return;
    
    // 清除定时器
    if (alertInfo.timeout) {
      clearTimeout(alertInfo.timeout);
    }
    
    // 隐藏动画
    alertInfo.element.classList.add('opacity-0', 'translate-x-4');
    
    // 移除元素
    setTimeout(() => {
      if (alertInfo.element.parentNode) {
        alertInfo.element.parentNode.removeChild(alertInfo.element);
      }
      
      // 从列表中移除
      const index = this.alerts.indexOf(alertInfo);
      if (index !== -1) {
        this.alerts.splice(index, 1);
      }
    }, 300);
  }

  /**
   * 根据类型获取图标
   * @param {string} type - 提示类型
   * @returns {string} - 图标HTML
   */
  getIconByType(type) {
    switch (type) {
      case 'success':
        return `
          <svg class="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
        `;
      case 'error':
        return `
          <svg class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
        `;
      case 'warning':
        return `
          <svg class="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
        `;
      case 'info':
      default:
        return `
          <svg class="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
        `;
    }
  }

  /**
   * 成功提示
   * @param {string} message - 提示消息
   * @param {number} duration - 显示时长 (毫秒)
   */
  success(message, duration) {
    return this.show('success', message, duration);
  }

  /**
   * 错误提示
   * @param {string} message - 提示消息
   * @param {number} duration - 显示时长 (毫秒)
   */
  error(message, duration) {
    return this.show('error', message, duration);
  }

  /**
   * 警告提示
   * @param {string} message - 提示消息
   * @param {number} duration - 显示时长 (毫秒)
   */
  warning(message, duration) {
    return this.show('warning', message, duration);
  }

  /**
   * 信息提示
   * @param {string} message - 提示消息
   * @param {number} duration - 显示时长 (毫秒)
   */
  info(message, duration) {
    return this.show('info', message, duration);
  }

  /**
   * 清除所有提示
   */
  clear() {
    [...this.alerts].forEach(alert => {
      this.removeAlert(alert);
    });
  }
}

export default Alert; 