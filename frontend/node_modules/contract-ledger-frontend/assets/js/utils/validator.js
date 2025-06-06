/**
 * 验证工具函数
 * 提供表单验证功能
 */

/**
 * 必填验证
 * @param {*} value - 字段值
 * @returns {string|null} - 错误信息或null
 */
export function required(value) {
  if (value === null || value === undefined || value === '') {
    return '此字段为必填项';
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return '请至少选择一项';
  }
  
  return null;
}

/**
 * 最小长度验证
 * @param {number} min - 最小长度
 * @returns {Function} - 验证函数
 */
export function minLength(min) {
  return (value) => {
    if (value === null || value === undefined || value === '') {
      return null; // 空值由required验证处理
    }
    
    if (String(value).length < min) {
      return `长度不能少于${min}个字符`;
    }
    
    return null;
  };
}

/**
 * 最大长度验证
 * @param {number} max - 最大长度
 * @returns {Function} - 验证函数
 */
export function maxLength(max) {
  return (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    if (String(value).length > max) {
      return `长度不能超过${max}个字符`;
    }
    
    return null;
  };
}

/**
 * 电子邮箱验证
 * @param {string} value - 电子邮箱
 * @returns {string|null} - 错误信息或null
 */
export function email(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(value)) {
    return '请输入有效的电子邮箱地址';
  }
  
  return null;
}

/**
 * 手机号验证
 * @param {string} value - 手机号
 * @returns {string|null} - 错误信息或null
 */
export function phone(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // 中国大陆手机号格式
  const regex = /^1[3-9]\d{9}$/;
  if (!regex.test(value)) {
    return '请输入有效的手机号码';
  }
  
  return null;
}

/**
 * 数字验证
 * @param {*} value - 字段值
 * @returns {string|null} - 错误信息或null
 */
export function number(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  if (isNaN(Number(value))) {
    return '请输入有效的数字';
  }
  
  return null;
}

/**
 * 整数验证
 * @param {*} value - 字段值
 * @returns {string|null} - 错误信息或null
 */
export function integer(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  if (!Number.isInteger(Number(value))) {
    return '请输入整数';
  }
  
  return null;
}

/**
 * 最小值验证
 * @param {number} min - 最小值
 * @returns {Function} - 验证函数
 */
export function min(min) {
  return (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    const num = Number(value);
    if (isNaN(num)) {
      return '请输入有效的数字';
    }
    
    if (num < min) {
      return `不能小于${min}`;
    }
    
    return null;
  };
}

/**
 * 最大值验证
 * @param {number} max - 最大值
 * @returns {Function} - 验证函数
 */
export function max(max) {
  return (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    const num = Number(value);
    if (isNaN(num)) {
      return '请输入有效的数字';
    }
    
    if (num > max) {
      return `不能大于${max}`;
    }
    
    return null;
  };
}

/**
 * URL验证
 * @param {string} value - URL
 * @returns {string|null} - 错误信息或null
 */
export function url(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  try {
    new URL(value);
    return null;
  } catch (e) {
    return '请输入有效的URL';
  }
}

/**
 * 日期验证
 * @param {string} value - 日期字符串
 * @returns {string|null} - 错误信息或null
 */
export function date(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    return '请输入有效的日期';
  }
  
  return null;
}

/**
 * 身份证号验证
 * @param {string} value - 身份证号
 * @returns {string|null} - 错误信息或null
 */
export function idCard(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // 简单验证，只检查格式
  const regex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  if (!regex.test(value)) {
    return '请输入有效的身份证号码';
  }
  
  return null;
}

/**
 * 正则表达式验证
 * @param {RegExp} pattern - 正则表达式
 * @param {string} message - 错误信息
 * @returns {Function} - 验证函数
 */
export function pattern(pattern, message) {
  return (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    if (!pattern.test(value)) {
      return message || '格式不正确';
    }
    
    return null;
  };
}

/**
 * 确认验证
 * @param {string} field - 需要确认的字段名
 * @param {string} message - 错误信息
 * @returns {Function} - 验证函数
 */
export function confirmed(field, message) {
  return (value, allValues) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    if (value !== allValues[field]) {
      return message || '两次输入不一致';
    }
    
    return null;
  };
}

/**
 * 组合验证器
 * @param {...Function} validators - 验证函数列表
 * @returns {Function} - 组合后的验证函数
 */
export function compose(...validators) {
  return (value, allValues) => {
    for (const validator of validators) {
      const error = validator(value, allValues);
      if (error) {
        return error;
      }
    }
    
    return null;
  };
} 