/**
 * 顶部导航栏组件
 * 实现用户信息显示和移动端菜单切换功能
 */
import Component from './component.js';
import authService from '../services/auth.js';

class Navbar extends Component {
  constructor(el, options = {}) {
    super(el);
    this.sidebarEl = options.sidebarEl;
    this.notificationCount = options.notificationCount || 0;
    this.user = null;
  }

  async initialize() {
    this.template = `
      <div class="flex items-center justify-between p-4">
        <div class="flex items-center md:hidden">
          <button id="toggleSidebar" class="text-gray-500 focus:outline-none">
            <i class="fas fa-bars"></i>
          </button>
        </div>
        <div class="flex items-center">
          <div class="relative">
            <button id="notificationBtn" class="flex items-center text-gray-500 focus:outline-none">
              <i class="fas fa-bell mr-1"></i>
              {{notificationBadge}}
            </button>
          </div>
          <div class="ml-4 relative">
            <div class="flex items-center">
              <img class="h-8 w-8 rounded-full" src="{{userAvatar}}" alt="用户头像">
              <span class="ml-2 text-gray-700">{{userName}}</span>
            </div>
            <div id="userDropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <a href="settings.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <i class="fas fa-cog mr-2"></i>设置
              </a>
              <button id="logoutBtn" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <i class="fas fa-sign-out-alt mr-2"></i>退出登录
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.loadUserInfo();
    this.render();
    this.bindEvents();
  }

  /**
   * 加载用户信息
   */
  async loadUserInfo() {
    try {
      this.user = await authService.getCurrentUser();
    } catch (error) {
      console.error('获取用户信息失败:', error);
      this.user = { username: '未知用户' };
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 侧边栏切换
    const toggleSidebarBtn = this.el.querySelector('#toggleSidebar');
    if (toggleSidebarBtn && this.sidebarEl) {
      toggleSidebarBtn.addEventListener('click', () => {
        this.sidebarEl.classList.toggle('hidden');
      });
    }

    // 用户下拉菜单
    const userDropdownBtn = this.el.querySelector('.flex.items-center');
    const userDropdown = this.el.querySelector('#userDropdown');
    if (userDropdownBtn && userDropdown) {
      userDropdownBtn.addEventListener('click', () => {
        userDropdown.classList.toggle('hidden');
      });

      // 点击其他地方关闭下拉菜单
      document.addEventListener('click', (event) => {
        if (!userDropdownBtn.contains(event.target) && !userDropdown.contains(event.target)) {
          userDropdown.classList.add('hidden');
        }
      });
    }

    // 退出登录
    const logoutBtn = this.el.querySelector('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        authService.logout();
      });
    }
  }

  /**
   * 渲染导航栏
   */
  render() {
    const data = {
      userName: this.user ? this.user.username : '未知用户',
      userAvatar: this.user && this.user.avatar 
        ? this.user.avatar 
        : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      notificationBadge: this.notificationCount > 0 
        ? `<span class="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>` 
        : ''
    };

    super.render(this.template, data);
  }

  /**
   * 更新通知数量
   * @param {number} count - 通知数量
   */
  updateNotificationCount(count) {
    this.notificationCount = count;
    this.render();
  }
}

export default Navbar; 