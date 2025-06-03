/**
 * 认证服务
 * 处理用户登录、注销等认证相关功能
 */
import ApiService from './api.js';
import { API_ENDPOINTS } from '../config/api.js';

class AuthService extends ApiService {
  constructor() {
    super();
    this.isAuthenticated = !!localStorage.getItem('auth_token');
  }

  /**
   * 用户登录
   * @param {Object} credentials - 用户凭证
   * @param {string} credentials.username - 用户名
   * @param {string} credentials.password - 密码
   * @returns {Promise<Object>} - 登录结果
   */
  async login(credentials) {
    try {
      const response = await this.post(API_ENDPOINTS.AUTH.LOGIN, credentials);

      if (response && response.access_token) {
        // 存储令牌
        localStorage.setItem('auth_token', response.access_token);
        this.setAuthToken(response.access_token);
        this.isAuthenticated = true;
      }

      return response;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  /**
   * 用户注销
   */
  logout() {
    localStorage.removeItem('auth_token');
    this.setAuthToken(null);
    this.isAuthenticated = false;
    window.location.href = '/pages/login.html';
  }

  /**
   * 检查用户是否已认证
   * @returns {boolean} - 是否已认证
   */
  checkAuth() {
    const token = localStorage.getItem('auth_token');
    this.isAuthenticated = !!token;
    
    if (token) {
      this.setAuthToken(token);
    }
    
    return this.isAuthenticated;
  }

  /**
   * 获取当前用户信息
   * @returns {Promise<Object>} - 用户信息
   */
  async getCurrentUser() {
    if (!this.isAuthenticated) {
      return null;
    }
    
    try {
      return await this.get('/users/me');
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }
}

export default new AuthService(); 