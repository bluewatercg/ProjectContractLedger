/**
 * 登录页面
 * 实现用户登录功能
 */
import Component from '../components/component.js';
import Form from '../components/form.js';
import authService from '../services/auth.js';
import * as validator from '../utils/validator.js';

class LoginPage extends Component {
  constructor(el) {
    super(el);
    this.loading = false;
  }

  initialize() {
    this.render();
    this.initForm();
  }

  /**
   * 渲染页面
   */
  render() {
    const template = `
      <div class="flex min-h-screen bg-gray-100">
        <div class="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div class="mx-auto w-full max-w-md">
            <div class="text-center">
              <h1 class="text-3xl font-extrabold text-gray-900">合同管理系统</h1>
              <p class="mt-2 text-sm text-gray-600">请登录您的账号</p>
            </div>
            
            <div class="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <form id="loginForm" class="space-y-6">
                <div class="form-group">
                  <label for="username" class="block text-sm font-medium text-gray-700">用户名</label>
                  <div class="mt-1">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autocomplete="username"
                      required
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="password" class="block text-sm font-medium text-gray-700">密码</label>
                  <div class="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autocomplete="current-password"
                      required
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                  </div>
                </div>
                
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <input
                      id="remember_me"
                      name="remember_me"
                      type="checkbox"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    >
                    <label for="remember_me" class="ml-2 block text-sm text-gray-900">记住我</label>
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    id="loginButton"
                    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    登录
                  </button>
                </div>
                
                <div id="errorMessage" class="text-red-500 text-center text-sm hidden"></div>
              </form>
              
              <div class="mt-6">
                <div class="relative">
                  <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-300"></div>
                  </div>
                  <div class="relative flex justify-center text-sm">
                    <span class="px-2 bg-white text-gray-500">演示账号</span>
                  </div>
                </div>
                
                <div class="mt-6 grid grid-cols-1 gap-3">
                  <div>
                    <button
                      type="button"
                      id="demoButton"
                      class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      使用演示账号登录
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="hidden lg:block relative w-0 flex-1">
          <div class="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-800 to-blue-600 flex items-center justify-center">
            <div class="max-w-lg mx-auto px-8">
              <h2 class="text-3xl font-extrabold text-white sm:text-4xl">合同管理系统</h2>
              <p class="mt-4 text-lg text-blue-100">
                高效管理您的合同、发票和付款，轻松掌控业务流程。
              </p>
              <ul class="mt-8 text-blue-100 space-y-3">
                <li class="flex items-center">
                  <i class="fas fa-check-circle text-green-400 mr-2"></i>
                  <span>客户信息管理</span>
                </li>
                <li class="flex items-center">
                  <i class="fas fa-check-circle text-green-400 mr-2"></i>
                  <span>合同全生命周期管理</span>
                </li>
                <li class="flex items-center">
                  <i class="fas fa-check-circle text-green-400 mr-2"></i>
                  <span>发票和付款跟踪</span>
                </li>
                <li class="flex items-center">
                  <i class="fas fa-check-circle text-green-400 mr-2"></i>
                  <span>数据统计和可视化</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    this.el.innerHTML = template;
  }

  /**
   * 初始化表单
   */
  initForm() {
    // 登录表单
    this.loginForm = new Form('#loginForm', {
      fields: [
        { 
          name: 'username', 
          validators: [
            validator.required
          ]
        },
        { 
          name: 'password', 
          validators: [
            validator.required
          ]
        }
      ],
      onSubmit: this.handleLogin.bind(this)
    });
    
    // 绑定演示账号按钮
    const demoButton = this.el.querySelector('#demoButton');
    demoButton.addEventListener('click', this.handleDemoLogin.bind(this));
  }

  /**
   * 处理登录
   * @param {Object} formData - 表单数据
   */
  async handleLogin(formData) {
    if (this.loading) return;
    
    try {
      this.setLoading(true);
      
      const credentials = {
        username: formData.username,
        password: formData.password
      };
      
      const response = await authService.login(credentials);
      
      if (response && response.access_token) {
        // 登录成功，跳转到仪表盘
        window.location.href = '/pages/dashboard.html';
      } else {
        this.showError('登录失败，请检查用户名和密码');
      }
    } catch (error) {
      console.error('登录失败:', error);
      this.showError('登录失败，请检查用户名和密码');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * 处理演示账号登录
   */
  async handleDemoLogin() {
    if (this.loading) return;
    
    try {
      this.setLoading(true);
      
      const credentials = {
        username: 'admin',
        password: '123456'
      };
      
      const response = await authService.login(credentials);
      
      if (response && response.access_token) {
        // 登录成功，跳转到仪表盘
        window.location.href = '/pages/dashboard.html';
      } else {
        this.showError('演示账号登录失败，请稍后重试');
      }
    } catch (error) {
      console.error('演示账号登录失败:', error);
      this.showError('演示账号登录失败，请稍后重试');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * 显示错误信息
   * @param {string} message - 错误信息
   */
  showError(message) {
    const errorMessage = this.el.querySelector('#errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
  }

  /**
   * 设置加载状态
   * @param {boolean} isLoading - 是否加载中
   */
  setLoading(isLoading) {
    this.loading = isLoading;
    
    const loginButton = this.el.querySelector('#loginButton');
    const demoButton = this.el.querySelector('#demoButton');
    
    if (isLoading) {
      loginButton.disabled = true;
      loginButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> 登录中...';
      demoButton.disabled = true;
    } else {
      loginButton.disabled = false;
      loginButton.innerHTML = '登录';
      demoButton.disabled = false;
    }
  }
}

export default LoginPage; 