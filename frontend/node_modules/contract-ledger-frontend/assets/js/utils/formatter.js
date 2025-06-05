/**
 * 格式化工具函数
 * 处理日期、金额等格式化
 */

/**
 * 格式化日期
 * @param {string|Date} date - 日期字符串或Date对象
 * @param {string} format - 格式化模板，默认为'YYYY-MM-DD'
 * @returns {string} - 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  
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
 * 格式化金额
 * @param {number} amount - 金额
 * @param {string} currency - 货币符号，默认为'¥'
 * @param {number} decimals - 小数位数，默认为2
 * @returns {string} - 格式化后的金额字符串
 */
export function formatMoney(amount, currency = '¥', decimals = 2) {
  if (amount === null || amount === undefined) return '';
  
  const num = parseFloat(amount);
  if (isNaN(num)) return '';
  
  const options = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  };
  
  return currency + num.toLocaleString('zh-CN', options);
}

/**
 * 格式化数字
 * @param {number} number - 数字
 * @param {number} decimals - 小数位数，默认为0
 * @returns {string} - 格式化后的数字字符串
 */
export function formatNumber(number, decimals = 0) {
  if (number === null || number === undefined) return '';
  
  const num = parseFloat(number);
  if (isNaN(num)) return '';
  
  const options = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  };
  
  return num.toLocaleString('zh-CN', options);
}

/**
 * 格式化百分比
 * @param {number} value - 值
 * @param {number} decimals - 小数位数，默认为2
 * @returns {string} - 格式化后的百分比字符串
 */
export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined) return '';
  
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  
  const options = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    style: 'percent'
  };
  
  return num.toLocaleString('zh-CN', options);
}

/**
 * 格式化电话号码
 * @param {string} phone - 电话号码
 * @returns {string} - 格式化后的电话号码
 */
export function formatPhone(phone) {
  if (!phone) return '';
  
  // 移除所有非数字字符
  const cleaned = phone.replace(/\D/g, '');
  
  // 处理手机号
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
  }
  
  // 处理座机号
  if (cleaned.length >= 10) {
    const areaCode = cleaned.slice(0, 4);
    const rest = cleaned.slice(4);
    return `${areaCode}-${rest}`;
  }
  
  return phone;
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数，默认为2
 * @returns {string} - 格式化后的文件大小
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * 格式化身份证号
 * @param {string} idCard - 身份证号
 * @returns {string} - 格式化后的身份证号
 */
export function formatIdCard(idCard) {
  if (!idCard) return '';
  
  // 18位身份证
  if (idCard.length === 18) {
    return idCard.replace(/(\d{6})(\d{8})(\d{4})/, '$1 $2 $3');
  }
  
  // 15位身份证
  if (idCard.length === 15) {
    return idCard.replace(/(\d{6})(\d{6})(\d{3})/, '$1 $2 $3');
  }
  
  return idCard;
}

/**
 * 格式化银行卡号
 * @param {string} cardNumber - 银行卡号
 * @returns {string} - 格式化后的银行卡号
 */
export function formatBankCard(cardNumber) {
  if (!cardNumber) return '';
  
  // 移除所有非数字字符
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // 每4位添加一个空格
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * 相对时间格式化
 * @param {string|Date} date - 日期字符串或Date对象
 * @returns {string} - 相对时间字符串
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    return Math.floor(diff / (60 * 1000)) + '分钟前';
  }
  
  // 小于1天
  if (diff < 24 * 60 * 60 * 1000) {
    return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
  }
  
  // 小于30天
  if (diff < 30 * 24 * 60 * 60 * 1000) {
    return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前';
  }
  
  // 小于12个月
  if (diff < 12 * 30 * 24 * 60 * 60 * 1000) {
    return Math.floor(diff / (30 * 24 * 60 * 60 * 1000)) + '个月前';
  }
  
  // 大于等于12个月
  return Math.floor(diff / (12 * 30 * 24 * 60 * 60 * 1000)) + '年前';
} 