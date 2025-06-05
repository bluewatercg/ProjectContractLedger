/**
 * 卡片组件
 * 用于显示数据卡片
 */
import Component from './component.js';

class Card extends Component {
  /**
   * 构造函数
   * @param {string|HTMLElement} el - 卡片容器元素或选择器
   * @param {Object} options - 配置选项
   */
  constructor(el, options = {}) {
    super(el);
    this.title = options.title || '';
    this.icon = options.icon || '';
    this.value = options.value || '';
    this.subtitle = options.subtitle || '';
    this.trend = options.trend || null;
    this.trendValue = options.trendValue || '';
    this.loading = options.loading || false;
    this.onClick = options.onClick || null;
  }

  initialize() {
    this.template = `
      <div class="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center">
          {{icon}}
          <div class="ml-4">
            <p class="text-gray-500 text-sm">{{title}}</p>
            <p class="text-2xl font-semibold text-gray-800">{{value}}</p>
          </div>
        </div>
        {{trend}}
      </div>
    `;

    this.render();
    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    if (this.onClick) {
      this.el.classList.add('cursor-pointer');
      this.el.addEventListener('click', this.onClick);
    }
  }

  /**
   * 渲染卡片
   */
  render() {
    let iconHtml = '';
    if (this.icon) {
      iconHtml = `
        <div class="p-3 rounded-full bg-blue-100 text-blue-500">
          ${this.icon}
        </div>
      `;
    }

    let trendHtml = '';
    if (this.trend !== null && this.trendValue) {
      const trendClass = this.trend > 0 ? 'text-green-500' : 'text-red-500';
      const trendIcon = this.trend > 0 ? '↑' : '↓';
      trendHtml = `
        <div class="mt-4">
          <span class="${trendClass} text-sm font-semibold">${trendIcon} ${this.trendValue}</span>
          <span class="text-gray-500 text-sm">${this.subtitle}</span>
        </div>
      `;
    } else if (this.subtitle) {
      trendHtml = `
        <div class="mt-4">
          <span class="text-gray-500 text-sm">${this.subtitle}</span>
        </div>
      `;
    }

    const data = {
      title: this.title,
      icon: iconHtml,
      value: this.loading ? '<div class="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>' : this.value,
      trend: trendHtml
    };

    super.render(this.template, data);
  }

  /**
   * 设置加载状态
   * @param {boolean} isLoading - 是否加载中
   */
  setLoading(isLoading) {
    this.loading = isLoading;
    this.render();
  }

  /**
   * 更新卡片数据
   * @param {Object} data - 卡片数据
   */
  update(data) {
    if (data.title !== undefined) this.title = data.title;
    if (data.icon !== undefined) this.icon = data.icon;
    if (data.value !== undefined) this.value = data.value;
    if (data.subtitle !== undefined) this.subtitle = data.subtitle;
    if (data.trend !== undefined) this.trend = data.trend;
    if (data.trendValue !== undefined) this.trendValue = data.trendValue;
    
    this.render();
  }
}

export default Card; 