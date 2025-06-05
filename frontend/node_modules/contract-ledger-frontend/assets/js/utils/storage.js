/**
 * 本地存储工具
 * 提供本地存储功能
 */

/**
 * 存储前缀，防止命名冲突
 */
const PREFIX = 'contract_ledger_';

/**
 * 存储数据到localStorage
 * @param {string} key - 键名
 * @param {*} value - 值
 * @param {number} expiry - 过期时间（秒），可选
 */
export function setItem(key, value, expiry = null) {
  const prefixedKey = PREFIX + key;
  
  const data = {
    value,
    timestamp: Date.now()
  };
  
  if (expiry) {
    data.expiry = expiry * 1000; // 转换为毫秒
  }
  
  try {
    localStorage.setItem(prefixedKey, JSON.stringify(data));
  } catch (error) {
    console.error('存储数据失败:', error);
  }
}

/**
 * 从localStorage获取数据
 * @param {string} key - 键名
 * @param {*} defaultValue - 默认值，可选
 * @returns {*} - 存储的值或默认值
 */
export function getItem(key, defaultValue = null) {
  const prefixedKey = PREFIX + key;
  
  try {
    const dataStr = localStorage.getItem(prefixedKey);
    if (!dataStr) return defaultValue;
    
    const data = JSON.parse(dataStr);
    
    // 检查是否过期
    if (data.expiry && Date.now() - data.timestamp > data.expiry) {
      localStorage.removeItem(prefixedKey);
      return defaultValue;
    }
    
    return data.value;
  } catch (error) {
    console.error('获取数据失败:', error);
    return defaultValue;
  }
}

/**
 * 从localStorage移除数据
 * @param {string} key - 键名
 */
export function removeItem(key) {
  const prefixedKey = PREFIX + key;
  
  try {
    localStorage.removeItem(prefixedKey);
  } catch (error) {
    console.error('移除数据失败:', error);
  }
}

/**
 * 清除所有本应用的localStorage数据
 */
export function clear() {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('清除数据失败:', error);
  }
}

/**
 * 检查键是否存在
 * @param {string} key - 键名
 * @returns {boolean} - 是否存在
 */
export function hasKey(key) {
  const prefixedKey = PREFIX + key;
  
  try {
    const dataStr = localStorage.getItem(prefixedKey);
    if (!dataStr) return false;
    
    const data = JSON.parse(dataStr);
    
    // 检查是否过期
    if (data.expiry && Date.now() - data.timestamp > data.expiry) {
      localStorage.removeItem(prefixedKey);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('检查键失败:', error);
    return false;
  }
}

/**
 * 获取所有键
 * @returns {Array<string>} - 键名数组
 */
export function getAllKeys() {
  try {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(PREFIX))
      .map(key => key.slice(PREFIX.length));
  } catch (error) {
    console.error('获取所有键失败:', error);
    return [];
  }
}

/**
 * 获取存储大小（字节）
 * @returns {number} - 存储大小
 */
export function getSize() {
  try {
    let size = 0;
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(PREFIX)) {
        size += localStorage.getItem(key).length * 2; // UTF-16编码，每个字符2字节
      }
    });
    
    return size;
  } catch (error) {
    console.error('获取存储大小失败:', error);
    return 0;
  }
}

/**
 * 检查是否支持localStorage
 * @returns {boolean} - 是否支持
 */
export function isSupported() {
  try {
    const testKey = PREFIX + 'test';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 存储会话数据到sessionStorage
 * @param {string} key - 键名
 * @param {*} value - 值
 */
export function setSessionItem(key, value) {
  const prefixedKey = PREFIX + key;
  
  try {
    sessionStorage.setItem(prefixedKey, JSON.stringify(value));
  } catch (error) {
    console.error('存储会话数据失败:', error);
  }
}

/**
 * 从sessionStorage获取会话数据
 * @param {string} key - 键名
 * @param {*} defaultValue - 默认值，可选
 * @returns {*} - 存储的值或默认值
 */
export function getSessionItem(key, defaultValue = null) {
  const prefixedKey = PREFIX + key;
  
  try {
    const value = sessionStorage.getItem(prefixedKey);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error('获取会话数据失败:', error);
    return defaultValue;
  }
}

/**
 * 从sessionStorage移除会话数据
 * @param {string} key - 键名
 */
export function removeSessionItem(key) {
  const prefixedKey = PREFIX + key;
  
  try {
    sessionStorage.removeItem(prefixedKey);
  } catch (error) {
    console.error('移除会话数据失败:', error);
  }
}

/**
 * 清除所有本应用的sessionStorage数据
 */
export function clearSession() {
  try {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('清除会话数据失败:', error);
  }
} 