/**
 * 令牌管理工具
 * 统一管理JWT令牌的存储、验证和刷新
 */

import authService from '../services/auth.js';

class TokenManager {
  constructor() {
    this.TOKEN_KEY = 'auth_token';
    this.REFRESH_THRESHOLD = 5 * 60 * 1000; // 5分钟（毫秒）
    this.checkInterval = null;
  }

  /**
   * 获取存储的令牌
   * @returns {string|null} 令牌
   */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * 设置令牌
   * @param {string} token - JWT令牌
   */
  setToken(token) {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  /**
   * 清除令牌
   */
  clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.stopAutoRefresh();
  }

  /**
   * 解析JWT令牌
   * @param {string} token - JWT令牌
   * @returns {Object|null} 解析后的payload
   */
  parseToken(token) {
    try {
      if (!token) return null;
      
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error('解析令牌失败:', error);
      return null;
    }
  }

  /**
   * 检查令牌是否过期
   * @param {string} token - JWT令牌
   * @returns {boolean} 是否过期
   */
  isTokenExpired(token) {
    const payload = this.parseToken(token);
    if (!payload || !payload.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp <= currentTime;
  }

  /**
   * 检查令牌是否即将过期
   * @param {string} token - JWT令牌
   * @param {number} threshold - 阈值（毫秒）
   * @returns {boolean} 是否即将过期
   */
  isTokenExpiringSoon(token, threshold = this.REFRESH_THRESHOLD) {
    const payload = this.parseToken(token);
    if (!payload || !payload.exp) return true;
    
    const currentTime = Date.now();
    const expiryTime = payload.exp * 1000;
    return (expiryTime - currentTime) <= threshold;
  }

  /**
   * 获取令牌剩余时间（毫秒）
   * @param {string} token - JWT令牌
   * @returns {number} 剩余时间（毫秒），如果已过期返回0
   */
  getTokenRemainingTime(token) {
    const payload = this.parseToken(token);
    if (!payload || !payload.exp) return 0;
    
    const currentTime = Date.now();
    const expiryTime = payload.exp * 1000;
    const remaining = expiryTime - currentTime;
    
    return Math.max(0, remaining);
  }

  /**
   * 启动自动刷新
   */
  startAutoRefresh() {
    // 清除现有的定时器
    this.stopAutoRefresh();
    
    // 每分钟检查一次令牌状态
    this.checkInterval = setInterval(async () => {
      const token = this.getToken();
      if (!token) {
        this.stopAutoRefresh();
        return;
      }

      try {
        // 如果令牌即将过期，尝试刷新
        if (this.isTokenExpiringSoon(token)) {
          console.log('令牌即将过期，自动刷新中...');
          await authService.refreshToken();
          console.log('令牌自动刷新成功');
        }
      } catch (error) {
        console.error('自动刷新令牌失败:', error);
        this.stopAutoRefresh();
      }
    }, 60000); // 每分钟检查一次
  }

  /**
   * 停止自动刷新
   */
  stopAutoRefresh() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * 初始化令牌管理器
   */
  init() {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      this.startAutoRefresh();
    }
  }

  /**
   * 获取令牌信息
   * @returns {Object} 令牌信息
   */
  getTokenInfo() {
    const token = this.getToken();
    if (!token) {
      return {
        hasToken: false,
        isExpired: true,
        isExpiringSoon: true,
        remainingTime: 0,
        payload: null
      };
    }

    const payload = this.parseToken(token);
    const isExpired = this.isTokenExpired(token);
    const isExpiringSoon = this.isTokenExpiringSoon(token);
    const remainingTime = this.getTokenRemainingTime(token);

    return {
      hasToken: true,
      isExpired,
      isExpiringSoon,
      remainingTime,
      payload,
      formattedRemainingTime: this.formatTime(remainingTime)
    };
  }

  /**
   * 格式化时间
   * @param {number} milliseconds - 毫秒
   * @returns {string} 格式化的时间字符串
   */
  formatTime(milliseconds) {
    if (milliseconds <= 0) return '已过期';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天${hours % 24}小时`;
    } else if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟`;
    } else {
      return `${seconds}秒`;
    }
  }
}

export default new TokenManager();
