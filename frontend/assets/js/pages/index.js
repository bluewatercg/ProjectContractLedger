/**
 * 首页控制器
 * 展示系统概览和主要导航入口
 */
import Component from '../components/component.js';
import Card from '../components/card.js';
import statisticsService from '../services/statistics.js';

class IndexPage extends Component {
  constructor(el) {
    super(el);
    this.statistics = null;
    this.loading = true;
    this.initialize();
  }

  async initialize() {
    this.render();
    await this.loadStatistics();
    this.renderCards();
    this.bindEvents();
  }

  /**
   * 加载统计数据
   */
  async loadStatistics() {
    try {
      this.loading = true;
      this.statistics = await statisticsService.getSystemOverview();
      this.loading = false;
    } catch (error) {
      console.error('加载统计数据失败:', error);
      window.showAlert('error', '加载统计数据失败，请稍后重试');
      this.loading = false;
    }
  }

  /**
   * 渲染页面基本结构
   */
  render() {
    this.el.innerHTML = `
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">欢迎使用合同管理系统</h1>
        <p class="text-gray-600">查看系统概览和快速导航</p>
      </div>
      
      <div id="loadingIndicator" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p class="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
      
      <div id="dashboardContent" class="hidden">
        <!-- 系统概览卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div id="customersCard" class="bg-white rounded-lg shadow-sm p-6"></div>
          <div id="contractsCard" class="bg-white rounded-lg shadow-sm p-6"></div>
          <div id="invoicesCard" class="bg-white rounded-lg shadow-sm p-6"></div>
          <div id="paymentsCard" class="bg-white rounded-lg shadow-sm p-6"></div>
        </div>
        
        <!-- 快速导航区域 -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">快速导航</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/pages/customers.html" class="flex items-center p-4 border rounded-lg hover:bg-gray-50" data-router-link>
              <i class="fas fa-users text-blue-500 text-2xl mr-3"></i>
              <div>
                <h3 class="font-medium">客户管理</h3>
                <p class="text-sm text-gray-600">管理客户信息</p>
              </div>
            </a>
            <a href="/pages/contracts.html" class="flex items-center p-4 border rounded-lg hover:bg-gray-50" data-router-link>
              <i class="fas fa-file-contract text-green-500 text-2xl mr-3"></i>
              <div>
                <h3 class="font-medium">合同管理</h3>
                <p class="text-sm text-gray-600">管理合同信息</p>
              </div>
            </a>
            <a href="/pages/invoices.html" class="flex items-center p-4 border rounded-lg hover:bg-gray-50" data-router-link>
              <i class="fas fa-file-invoice text-yellow-500 text-2xl mr-3"></i>
              <div>
                <h3 class="font-medium">发票管理</h3>
                <p class="text-sm text-gray-600">管理发票信息</p>
              </div>
            </a>
            <a href="/pages/payments.html" class="flex items-center p-4 border rounded-lg hover:bg-gray-50" data-router-link>
              <i class="fas fa-money-bill-wave text-purple-500 text-2xl mr-3"></i>
              <div>
                <h3 class="font-medium">付款管理</h3>
                <p class="text-sm text-gray-600">管理付款信息</p>
              </div>
            </a>
          </div>
        </div>
        
        <!-- 常用功能区域 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">待办事项</h2>
            <div id="todoList" class="space-y-3">
              <!-- 待办事项列表由JS动态渲染 -->
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">最近活动</h2>
            <div id="recentActivities" class="space-y-3">
              <!-- 最近活动列表由JS动态渲染 -->
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">快速链接</h2>
            <div class="space-y-2">
              <a href="/pages/customer-create.html" class="block p-2 hover:bg-gray-50 rounded" data-router-link>
                <i class="fas fa-plus-circle text-blue-500 mr-2"></i> 新增客户
              </a>
              <a href="/pages/contract-create.html" class="block p-2 hover:bg-gray-50 rounded" data-router-link>
                <i class="fas fa-plus-circle text-green-500 mr-2"></i> 新增合同
              </a>
              <a href="/pages/invoice-create.html" class="block p-2 hover:bg-gray-50 rounded" data-router-link>
                <i class="fas fa-plus-circle text-yellow-500 mr-2"></i> 新增发票
              </a>
              <a href="/pages/payment-create.html" class="block p-2 hover:bg-gray-50 rounded" data-router-link>
                <i class="fas fa-plus-circle text-purple-500 mr-2"></i> 新增付款
              </a>
              <a href="/pages/dashboard.html" class="block p-2 hover:bg-gray-50 rounded" data-router-link>
                <i class="fas fa-chart-line text-gray-500 mr-2"></i> 查看详细仪表盘
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染统计卡片
   */
  renderCards() {
    if (this.loading) {
      return;
    }
    
    document.getElementById('loadingIndicator').classList.add('hidden');
    document.getElementById('dashboardContent').classList.remove('hidden');
    
    if (!this.statistics) {
      return;
    }
    
    // 客户统计卡片
    new Card(document.getElementById('customersCard'), {
      title: '客户',
      value: this.statistics.customersCount,
      icon: 'fas fa-users',
      iconColor: 'text-blue-500',
      link: '/pages/customers.html',
      trend: this.statistics.customersGrowth > 0 ? 'up' : 'down',
      trendValue: `${Math.abs(this.statistics.customersGrowth)}%`,
      trendText: '较上月'
    });
    
    // 合同统计卡片
    new Card(document.getElementById('contractsCard'), {
      title: '合同',
      value: this.statistics.contractsCount,
      icon: 'fas fa-file-contract',
      iconColor: 'text-green-500',
      link: '/pages/contracts.html',
      trend: this.statistics.contractsGrowth > 0 ? 'up' : 'down',
      trendValue: `${Math.abs(this.statistics.contractsGrowth)}%`,
      trendText: '较上月'
    });
    
    // 发票统计卡片
    new Card(document.getElementById('invoicesCard'), {
      title: '发票',
      value: this.statistics.invoicesCount,
      icon: 'fas fa-file-invoice',
      iconColor: 'text-yellow-500',
      link: '/pages/invoices.html',
      trend: this.statistics.invoicesGrowth > 0 ? 'up' : 'down',
      trendValue: `${Math.abs(this.statistics.invoicesGrowth)}%`,
      trendText: '较上月'
    });
    
    // 付款统计卡片
    new Card(document.getElementById('paymentsCard'), {
      title: '付款',
      value: this.statistics.paymentsCount,
      icon: 'fas fa-money-bill-wave',
      iconColor: 'text-purple-500',
      link: '/pages/payments.html',
      trend: this.statistics.paymentsGrowth > 0 ? 'up' : 'down',
      trendValue: `${Math.abs(this.statistics.paymentsGrowth)}%`,
      trendText: '较上月'
    });
    
    // 渲染待办事项
    this.renderTodoList();
    
    // 渲染最近活动
    this.renderRecentActivities();
  }

  /**
   * 渲染待办事项列表
   */
  renderTodoList() {
    const todoListEl = document.getElementById('todoList');
    
    if (!this.statistics.todoItems || this.statistics.todoItems.length === 0) {
      todoListEl.innerHTML = '<p class="text-gray-500">暂无待办事项</p>';
      return;
    }
    
    todoListEl.innerHTML = this.statistics.todoItems.map(item => `
      <div class="flex items-start p-3 border-b last:border-b-0">
        <i class="fas ${this.getTodoIcon(item.type)} mt-1 mr-3 ${this.getTodoColor(item.type)}"></i>
        <div>
          <p class="font-medium">${item.title}</p>
          <p class="text-sm text-gray-600">${item.description}</p>
          <p class="text-xs text-gray-500 mt-1">截止日期: ${item.dueDate}</p>
        </div>
      </div>
    `).join('');
  }

  /**
   * 渲染最近活动列表
   */
  renderRecentActivities() {
    const activitiesEl = document.getElementById('recentActivities');
    
    if (!this.statistics.recentActivities || this.statistics.recentActivities.length === 0) {
      activitiesEl.innerHTML = '<p class="text-gray-500">暂无最近活动</p>';
      return;
    }
    
    activitiesEl.innerHTML = this.statistics.recentActivities.map(activity => `
      <div class="flex items-start p-3 border-b last:border-b-0">
        <i class="fas ${this.getActivityIcon(activity.type)} mt-1 mr-3 ${this.getActivityColor(activity.type)}"></i>
        <div>
          <p class="font-medium">${activity.title}</p>
          <p class="text-sm text-gray-600">${activity.description}</p>
          <p class="text-xs text-gray-500 mt-1">${activity.time}</p>
        </div>
      </div>
    `).join('');
  }

  /**
   * 获取待办事项图标
   * @param {string} type - 待办事项类型
   * @returns {string} - 图标类名
   */
  getTodoIcon(type) {
    const icons = {
      contract: 'fa-file-contract',
      invoice: 'fa-file-invoice',
      payment: 'fa-money-bill-wave',
      customer: 'fa-user',
      default: 'fa-tasks'
    };
    
    return icons[type] || icons.default;
  }

  /**
   * 获取待办事项颜色
   * @param {string} type - 待办事项类型
   * @returns {string} - 颜色类名
   */
  getTodoColor(type) {
    const colors = {
      contract: 'text-green-500',
      invoice: 'text-yellow-500',
      payment: 'text-purple-500',
      customer: 'text-blue-500',
      default: 'text-gray-500'
    };
    
    return colors[type] || colors.default;
  }

  /**
   * 获取活动图标
   * @param {string} type - 活动类型
   * @returns {string} - 图标类名
   */
  getActivityIcon(type) {
    const icons = {
      create: 'fa-plus-circle',
      update: 'fa-edit',
      delete: 'fa-trash-alt',
      view: 'fa-eye',
      default: 'fa-history'
    };
    
    return icons[type] || icons.default;
  }

  /**
   * 获取活动颜色
   * @param {string} type - 活动类型
   * @returns {string} - 颜色类名
   */
  getActivityColor(type) {
    const colors = {
      create: 'text-green-500',
      update: 'text-blue-500',
      delete: 'text-red-500',
      view: 'text-gray-500',
      default: 'text-gray-500'
    };
    
    return colors[type] || colors.default;
  }

  /**
   * 绑定事件处理函数
   */
  bindEvents() {
    // 可以在这里添加事件绑定逻辑
  }
}

export default IndexPage; 