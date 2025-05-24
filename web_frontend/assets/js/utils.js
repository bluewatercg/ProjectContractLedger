/**
 * 客户合同管理系统 - 工具函数
 */

/**
 * 日期格式化
 * @param {Date|string} date 日期对象或日期字符串
 * @param {string} format 格式化模式，默认为'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 货币格式化
 * @param {number} amount 金额
 * @param {string} currency 货币代码，默认为'CNY'
 * @returns {string} 格式化后的金额字符串
 */
function formatCurrency(amount, currency = 'CNY') {
  if (amount === null || amount === undefined) return '';
  
  const formatter = new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  });
  
  return formatter.format(amount);
}

/**
 * 获取状态对应的颜色类
 * @param {string} status 状态值
 * @returns {string} Tailwind CSS颜色类名
 */
function getStatusColorClass(status) {
  const statusMap = {
    '草稿': 'bg-gray-100 text-gray-800',
    '履行中': 'bg-blue-100 text-blue-800',
    '已完成': 'bg-green-100 text-green-800',
    '已逾期': 'bg-red-100 text-red-800',
    '待处理': 'bg-yellow-100 text-yellow-800',
    '待开票': 'bg-purple-100 text-purple-800',
    '已开票': 'bg-blue-100 text-blue-800',
    '已收款': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800'
  };
  
  return statusMap[status] || 'bg-gray-100 text-gray-800';
}

/**
 * 表单验证
 * @param {HTMLFormElement} form 表单元素
 * @returns {boolean} 表单是否有效
 */
function validateForm(form) {
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;
  
  // 清除所有错误提示
  form.querySelectorAll('.error-message').forEach(el => el.remove());
  
  // 验证必填字段
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      showFieldError(field, '此字段为必填项');
    }
  });
  
  // 验证邮箱字段
  const emailFields = form.querySelectorAll('input[type="email"]');
  emailFields.forEach(field => {
    if (field.value && !validateEmail(field.value)) {
      isValid = false;
      showFieldError(field, '请输入有效的电子邮箱地址');
    }
  });
  
  // 验证数字字段
  const numberFields = form.querySelectorAll('input[type="number"]');
  numberFields.forEach(field => {
    if (field.value && isNaN(parseFloat(field.value))) {
      isValid = false;
      showFieldError(field, '请输入有效的数字');
    }
  });
  
  return isValid;
}

/**
 * 显示字段错误提示
 * @param {HTMLElement} field 表单字段元素
 * @param {string} message 错误信息
 */
function showFieldError(field, message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message text-red-500 text-sm mt-1';
  errorDiv.textContent = message;
  
  field.classList.add('border-red-500');
  field.parentNode.appendChild(errorDiv);
}

/**
 * 验证邮箱格式
 * @param {string} email 邮箱地址
 * @returns {boolean} 是否为有效邮箱
 */
function validateEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

/**
 * 显示通知提示
 * @param {string} message 提示信息
 * @param {string} type 提示类型：'success', 'error', 'info', 'warning'
 * @param {number} duration 显示时长（毫秒），默认3000ms
 */
function showNotification(message, type = 'info', duration = 3000) {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-opacity duration-300 flex items-center`;
  
  // 设置不同类型的样式
  switch (type) {
    case 'success':
      notification.classList.add('bg-green-100', 'text-green-800', 'border-l-4', 'border-green-500');
      break;
    case 'error':
      notification.classList.add('bg-red-100', 'text-red-800', 'border-l-4', 'border-red-500');
      break;
    case 'warning':
      notification.classList.add('bg-yellow-100', 'text-yellow-800', 'border-l-4', 'border-yellow-500');
      break;
    default: // info
      notification.classList.add('bg-blue-100', 'text-blue-800', 'border-l-4', 'border-blue-500');
  }
  
  // 设置图标
  let icon = '';
  switch (type) {
    case 'success':
      icon = '<i class="fas fa-check-circle mr-2"></i>';
      break;
    case 'error':
      icon = '<i class="fas fa-exclamation-circle mr-2"></i>';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle mr-2"></i>';
      break;
    default: // info
      icon = '<i class="fas fa-info-circle mr-2"></i>';
  }
  
  // 设置内容
  notification.innerHTML = `
    ${icon}
    <span>${message}</span>
    <button class="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 添加关闭按钮事件
  const closeButton = notification.querySelector('button');
  closeButton.addEventListener('click', () => {
    notification.classList.add('opacity-0');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  });
  
  // 自动关闭
  setTimeout(() => {
    notification.classList.add('opacity-0');
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, duration);
}

/**
 * 确认对话框
 * @param {string} message 确认信息
 * @param {string} confirmText 确认按钮文本
 * @param {string} cancelText 取消按钮文本
 * @returns {Promise} 返回Promise，确认为resolve，取消为reject
 */
function showConfirm(message, confirmText = '确认', cancelText = '取消') {
  return new Promise((resolve, reject) => {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    
    // 创建确认框
    const confirmBox = document.createElement('div');
    confirmBox.className = 'bg-white rounded-lg p-6 max-w-sm mx-auto';
    confirmBox.innerHTML = `
      <div class="text-lg font-medium mb-4">${message}</div>
      <div class="flex justify-end space-x-2">
        <button id="cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none">${cancelText}</button>
        <button id="confirm-btn" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none">${confirmText}</button>
      </div>
    `;
    
    // 添加到页面
    overlay.appendChild(confirmBox);
    document.body.appendChild(overlay);
    
    // 添加按钮事件
    const cancelBtn = document.getElementById('cancel-btn');
    const confirmBtn = document.getElementById('confirm-btn');
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      reject();
    });
    
    confirmBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve();
    });
  });
}

/**
 * 防抖函数
 * @param {Function} func 要执行的函数
 * @param {number} wait 等待时间（毫秒）
 * @returns {Function} 防抖处理后的函数
 */
function debounce(func, wait = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * 节流函数
 * @param {Function} func 要执行的函数
 * @param {number} limit 限制时间（毫秒）
 * @returns {Function} 节流处理后的函数
 */
function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 获取URL查询参数
 * @param {string} name 参数名
 * @returns {string|null} 参数值
 */
function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * 加载页面组件
 * @param {string} url 组件URL
 * @param {string} targetSelector 目标元素选择器
 * @returns {Promise} 加载完成的Promise
 */
function loadComponent(url, targetSelector) {
  return fetch(url)
    .then(response => response.text())
    .then(html => {
      document.querySelector(targetSelector).innerHTML = html;
      return html;
    });
}