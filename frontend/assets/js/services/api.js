/**
 * API服务基类
 * 提供基础的HTTP请求方法和认证逻辑
 */
import { getBaseUrl, getApiConfig, DEFAULT_HEADERS } from '../config/api.js';

class ApiService {
  constructor(baseUrl = null) {
    // 使用配置文件中的baseUrl，如果没有传入自定义baseUrl
    this.baseUrl = baseUrl || getBaseUrl();
    this.config = getApiConfig();
    this.headers = { ...DEFAULT_HEADERS };

    // 从本地存储中获取认证令牌
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.setAuthToken(token);
    }
  }

  // 设置认证令牌
  setAuthToken(token) {
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.headers['Authorization'];
    }
  }

  // 发送请求的通用方法
  async request(endpoint, method = 'GET', data = null, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`API请求: ${method} ${url}`);
    
    const requestOptions = {
      method,
      headers: { ...this.headers, ...options.headers },
      // 添加跨域模式
      mode: 'cors',
      ...options
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(data);
      console.log('请求数据:', data);
    }

    console.log('完整请求选项:', { ...requestOptions, headers: { ...requestOptions.headers } });

    // 实现重试逻辑
    let lastError;
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        console.log(`尝试 ${attempt + 1}/${this.config.retryAttempts}`);
        // 创建带超时的fetch请求
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log(`收到响应: HTTP ${response.status} ${response.statusText}`);

        // 处理未认证错误
        if (response.status === 401) {
          console.warn('认证失败 (401)');
          // 清除本地存储的令牌
          localStorage.removeItem('auth_token');
          // 重定向到登录页
          window.location.href = '/pages/login.html';
          return null;
        }

        // 克隆响应以便输出日志
        const clonedResponse = response.clone();
        try {
          const responseText = await clonedResponse.text();
          console.log('响应内容:', responseText);
        } catch (e) {
          console.warn('无法读取响应内容:', e);
        }

        // 解析响应
        const result = await response.json();
        console.log('解析后的响应数据:', result);

        if (!response.ok) {
          console.error(`请求失败: ${response.status} ${response.statusText}`);
          throw new Error(result.message || `请求失败 (${response.status})`);
        }

        return result;
      } catch (error) {
        lastError = error;
        console.warn(`API请求失败 (尝试 ${attempt + 1}/${this.config.retryAttempts}):`, error.message);
        console.error('错误详情:', error);

        // 如果是最后一次尝试，或者是认证错误，不再重试
        if (attempt === this.config.retryAttempts - 1 || error.name === 'AbortError') {
          break;
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }

    console.error('API请求最终失败:', lastError);
    throw lastError;
  }

  // HTTP方法封装
  get(endpoint) {
    return this.request(endpoint, 'GET');
  }

  post(endpoint, data) {
    return this.request(endpoint, 'POST', data);
  }

  put(endpoint, data) {
    return this.request(endpoint, 'PUT', data);
  }

  delete(endpoint) {
    return this.request(endpoint, 'DELETE');
  }
}

export default ApiService; 