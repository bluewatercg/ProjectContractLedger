/**
 * API服务基类
 * 提供基础的HTTP请求方法和认证逻辑
 */
class ApiService {
  constructor(baseUrl = 'http://127.0.0.1:8080/api/v1') {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json'
    };
    
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
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: this.headers,
      credentials: 'include'
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      // 处理未认证错误
      if (response.status === 401) {
        // 清除本地存储的令牌
        localStorage.removeItem('auth_token');
        // 重定向到登录页
        window.location.href = '/pages/login.html';
        return null;
      }
      
      // 解析响应
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '请求失败');
      }
      
      return result;
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
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