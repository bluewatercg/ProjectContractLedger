/**
 * 通用令牌管理更新脚本
 * 用于在页面中添加统一的令牌管理功能
 */

// 通用的页面初始化代码模板
const PAGE_INIT_TEMPLATE = `
// 检查登录状态
const token = tokenManager.getToken();
if (!token) {
  window.location.href = 'login.html';
  return;
}

// 初始化令牌管理器
tokenManager.init();

// 验证令牌有效性
try {
  const isValid = await authService.validateToken();
  if (!isValid) {
    console.log('令牌无效，尝试刷新...');
    await authService.refreshToken();
  }
} catch (error) {
  console.error('令牌验证失败:', error);
  authService.logout();
  return;
}
`;

// 通用的退出登录处理代码
const LOGOUT_HANDLER_TEMPLATE = `
// 退出登录
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (confirm('确定要退出登录吗？')) {
      authService.logout();
    }
  });
}
`;

// 需要添加的导入语句
const REQUIRED_IMPORTS = `
import tokenManager from '../assets/js/utils/tokenManager.js';
import authService from '../assets/js/services/auth.js';
`;

// 页面配置
const PAGE_CONFIGS = [
  {
    file: 'contract-create.html',
    hasModuleScript: false,
    needsFullUpdate: true
  },
  {
    file: 'customer-create.html', 
    hasModuleScript: false,
    needsFullUpdate: true
  },
  {
    file: 'invoice-create.html',
    hasModuleScript: false,
    needsFullUpdate: true
  },
  {
    file: 'payment-create.html',
    hasModuleScript: false,
    needsFullUpdate: true
  },
  {
    file: 'contract-detail.html',
    hasModuleScript: false,
    needsFullUpdate: true
  },
  {
    file: 'customer-detail.html',
    hasModuleScript: false,
    needsFullUpdate: true
  },
  {
    file: 'invoice-detail.html',
    hasModuleScript: false,
    needsFullUpdate: true
  },
  {
    file: 'settings.html',
    hasModuleScript: false,
    needsFullUpdate: true
  },
  {
    file: 'notifications.html',
    hasModuleScript: false,
    needsFullUpdate: true
  }
];

/**
 * 生成完整的页面脚本模板
 * @param {string} serviceName - 服务名称（如 'customer', 'contract' 等）
 * @param {string} additionalCode - 额外的页面特定代码
 * @returns {string} 完整的脚本代码
 */
function generatePageScript(serviceName = '', additionalCode = '') {
  const serviceImport = serviceName ? `import ${serviceName}Service from '../assets/js/services/${serviceName}.js';` : '';
  
  return `
<script type="module">
  // 导入服务
  ${serviceImport}
  import authService from '../assets/js/services/auth.js';
  import tokenManager from '../assets/js/utils/tokenManager.js';

  document.addEventListener('DOMContentLoaded', async function() {
    ${PAGE_INIT_TEMPLATE}

    ${LOGOUT_HANDLER_TEMPLATE}

    ${additionalCode}
  });
</script>
`;
}

/**
 * 生成简单的认证检查脚本（用于静态页面）
 * @returns {string} 简单的认证检查脚本
 */
function generateSimpleAuthScript() {
  return `
<script type="module">
  import authService from '../assets/js/services/auth.js';
  import tokenManager from '../assets/js/utils/tokenManager.js';

  document.addEventListener('DOMContentLoaded', async function() {
    ${PAGE_INIT_TEMPLATE}

    ${LOGOUT_HANDLER_TEMPLATE}

    // 页面特定的初始化代码可以在这里添加
    console.log('页面已加载，令牌管理已初始化');
  });
</script>
`;
}

// 导出模板和配置
export {
  PAGE_INIT_TEMPLATE,
  LOGOUT_HANDLER_TEMPLATE,
  REQUIRED_IMPORTS,
  PAGE_CONFIGS,
  generatePageScript,
  generateSimpleAuthScript
};
