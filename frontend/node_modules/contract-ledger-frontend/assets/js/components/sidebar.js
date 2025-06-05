/**
 * 侧边栏组件
 * 实现导航功能
 */
import Component from './component.js';

class Sidebar extends Component {
  constructor(el) {
    super(el);
  }

  initialize() {
    this.template = `
      <div class="mb-8">
        <h1 class="text-xl font-bold">合同管理系统</h1>
        <p class="text-sm text-blue-200">单用户版</p>
      </div>
      
      <nav>
        <ul class="space-y-2">
          <li>
            <a href="dashboard.html" class="flex items-center p-2 rounded {{dashboard}}">
              <i class="fas fa-tachometer-alt mr-3"></i>
              <span>仪表盘</span>
            </a>
          </li>
          <li>
            <a href="customers.html" class="flex items-center p-2 rounded {{customers}}">
              <i class="fas fa-users mr-3"></i>
              <span>客户管理</span>
            </a>
          </li>
          <li>
            <a href="contracts.html" class="flex items-center p-2 rounded {{contracts}}">
              <i class="fas fa-file-contract mr-3"></i>
              <span>合同管理</span>
            </a>
          </li>
          <li>
            <a href="invoices.html" class="flex items-center p-2 rounded {{invoices}}">
              <i class="fas fa-file-invoice mr-3"></i>
              <span>开票管理</span>
            </a>
          </li>
          <li>
            <a href="payments.html" class="flex items-center p-2 rounded {{payments}}">
              <i class="fas fa-money-bill-wave mr-3"></i>
              <span>到款管理</span>
            </a>
          </li>
          <li>
            <a href="notifications.html" class="flex items-center p-2 rounded {{notifications}}">
              <i class="fas fa-bell mr-3"></i>
              <span>提醒中心</span>
            </a>
          </li>
          <li>
            <a href="settings.html" class="flex items-center p-2 rounded {{settings}}">
              <i class="fas fa-cog mr-3"></i>
              <span>系统设置</span>
            </a>
          </li>
        </ul>
      </nav>
    `;

    this.render();
    this.highlightCurrentPage();
  }

  /**
   * 高亮当前页面对应的菜单项
   */
  highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop() || 'dashboard.html';
    
    const links = this.el.querySelectorAll('a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === pageName) {
        link.classList.add('bg-blue-700');
      } else {
        link.classList.add('hover:bg-blue-700');
      }
    });
  }

  /**
   * 渲染侧边栏
   */
  render() {
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop() || 'dashboard.html';
    
    // 准备高亮类
    const data = {
      dashboard: '',
      customers: '',
      contracts: '',
      invoices: '',
      payments: '',
      notifications: '',
      settings: ''
    };
    
    // 设置当前页面的高亮
    const pageKey = pageName.replace('.html', '');
    if (data.hasOwnProperty(pageKey)) {
      data[pageKey] = 'bg-blue-700';
    }
    
    super.render(this.template, data);
  }
}

export default Sidebar; 