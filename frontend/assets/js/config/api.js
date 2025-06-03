/**
 * API配置文件
 * 统一管理API相关的配置信息
 */

// 环境配置
const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TESTING: 'testing'
};

// 当前环境（可以通过环境变量或其他方式动态设置）
const CURRENT_ENV = ENV.DEVELOPMENT;

// 不同环境的API配置
const API_CONFIG = {
  [ENV.DEVELOPMENT]: {
    baseUrl: 'http://127.0.0.1:8080/api/v1',
    timeout: 30000, // 30秒超时
    retryAttempts: 3,
    retryDelay: 1000 // 1秒重试延迟
  },
  [ENV.PRODUCTION]: {
    baseUrl: 'https://your-production-domain.com/api/v1',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  [ENV.TESTING]: {
    baseUrl: 'http://localhost:3000/api/v1',
    timeout: 10000,
    retryAttempts: 1,
    retryDelay: 500
  }
};

// 获取当前环境的API配置
export const getApiConfig = () => {
  return API_CONFIG[CURRENT_ENV];
};

// 获取基础URL
export const getBaseUrl = () => {
  return getApiConfig().baseUrl;
};

// 获取完整的API端点URL
export const getApiUrl = (endpoint) => {
  const baseUrl = getBaseUrl();
  // 确保endpoint以/开头
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
};

// API端点常量
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile'
  },
  
  // 客户相关
  CUSTOMERS: {
    LIST: '/customers',
    DETAIL: (id) => `/customers/${id}`,
    CREATE: '/customers',
    UPDATE: (id) => `/customers/${id}`,
    DELETE: (id) => `/customers/${id}`,
    // 开票信息相关
    INVOICE_INFOS: (id) => `/customers/${id}/invoice-infos`,
    INVOICE_INFO_CREATE: (id) => `/customers/${id}/invoice-infos`,
    INVOICE_INFO_UPDATE: (customerId, infoId) => `/customers/${customerId}/invoice-infos/${infoId}`,
    INVOICE_INFO_DELETE: (customerId, infoId) => `/customers/${customerId}/invoice-infos/${infoId}`
  },
  
  // 合同相关
  CONTRACTS: {
    LIST: '/contracts',
    DETAIL: (id) => `/contracts/${id}`,
    CREATE: '/contracts',
    UPDATE: (id) => `/contracts/${id}`,
    DELETE: (id) => `/contracts/${id}`,
    EXPIRING: '/contracts/expiring',
    BY_CUSTOMER: (customerId) => `/contracts?customerId=${customerId}`
  },
  
  // 发票相关
  INVOICES: {
    LIST: '/invoices',
    DETAIL: (id) => `/invoices/${id}`,
    CREATE: '/invoices',
    UPDATE: (id) => `/invoices/${id}`,
    DELETE: (id) => `/invoices/${id}`,
    BY_CONTRACT: (contractId) => `/invoices?contractId=${contractId}`
  },
  
  // 付款相关
  PAYMENTS: {
    LIST: '/payments',
    DETAIL: (id) => `/payments/${id}`,
    CREATE: '/payments',
    UPDATE: (id) => `/payments/${id}`,
    DELETE: (id) => `/payments/${id}`,
    BY_INVOICE: (invoiceId) => `/payments?invoiceId=${invoiceId}`
  },
  
  // 统计相关
  STATISTICS: {
    DASHBOARD: '/statistics/dashboard',
    MONTHLY_REVENUE: '/statistics/revenue/monthly',
    REVENUE_BY_CUSTOMER: '/statistics/revenue/customer',
    SYSTEM_OVERVIEW: '/statistics/overview'
  }
};

// HTTP状态码常量
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403, 
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// 默认请求头
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// 导出配置对象
export default {
  ENV,
  CURRENT_ENV,
  getApiConfig,
  getBaseUrl,
  getApiUrl,
  API_ENDPOINTS,
  HTTP_STATUS,
  DEFAULT_HEADERS
};
