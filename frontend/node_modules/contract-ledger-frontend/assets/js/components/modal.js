/**
 * 模态框组件
 * 实现弹窗功能
 */
import Component from './component.js';

class Modal extends Component {
  /**
   * 构造函数
   * @param {string|HTMLElement} el - 模态框元素或选择器
   * @param {Object} options - 配置选项
   */
  constructor(el, options = {}) {
    super(el);
    this.isOpen = false;
    this.closeOnEscape = options.closeOnEscape !== undefined ? options.closeOnEscape : true;
    this.closeOnBackdrop = options.closeOnBackdrop !== undefined ? options.closeOnBackdrop : true;
    this.onOpen = options.onOpen || null;
    this.onClose = options.onClose || null;
    this.backdrop = null;
  }

  initialize() {
    // 创建背景遮罩
    this.createBackdrop();
    
    // 确保模态框有正确的样式
    this.el.classList.add('fixed', 'inset-0', 'z-50', 'flex', 'items-center', 'justify-center', 'hidden');
    
    this.bindEvents();
  }

  /**
   * 创建背景遮罩
   */
  createBackdrop() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 z-40 hidden';
    document.body.appendChild(this.backdrop);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 关闭按钮
    const closeButtons = this.el.querySelectorAll('[data-close]');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => this.close());
    });
    
    // 背景点击关闭
    if (this.closeOnBackdrop) {
      this.backdrop.addEventListener('click', () => this.close());
    }
    
    // ESC键关闭
    if (this.closeOnEscape) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }
    
    // 阻止模态框内点击冒泡到背景
    this.el.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  /**
   * 打开模态框
   */
  open() {
    if (this.isOpen) return;
    
    // 显示背景和模态框
    this.backdrop.classList.remove('hidden');
    this.el.classList.remove('hidden');
    
    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
    
    this.isOpen = true;
    
    // 触发打开回调
    if (this.onOpen) {
      this.onOpen();
    }
  }

  /**
   * 关闭模态框
   */
  close() {
    if (!this.isOpen) return;
    
    // 隐藏背景和模态框
    this.backdrop.classList.add('hidden');
    this.el.classList.add('hidden');
    
    // 恢复背景滚动
    document.body.style.overflow = '';
    
    this.isOpen = false;
    
    // 触发关闭回调
    if (this.onClose) {
      this.onClose();
    }
  }

  /**
   * 切换模态框状态
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * 销毁组件
   */
  destroy() {
    // 移除背景遮罩
    if (this.backdrop && this.backdrop.parentNode) {
      this.backdrop.parentNode.removeChild(this.backdrop);
    }
    
    // 移除事件监听
    document.removeEventListener('keydown', this.handleKeyDown);
    
    super.destroy();
  }
}

export default Modal; 