// 运行时环境配置
window.__APP_CONFIG__ = {
  // API版本配置 - 使用生产环境指定的API Base URL
  API_VERSION: 'v1',
  API_BASE_URL: '/api/v1',

  // 后端配置（用于前端自动构建API URL）
  BACKEND_HOST: 'localhost',
  BACKEND_PORT: '8080',
  BACKEND_HOST_PORT: '8080',

  // 应用配置
  APP_TITLE: '客户合同管理系统',
  APP_VERSION: '1.0.0',
  NODE_ENV: 'development',

  // 调试信息
  BUILD_TIME: new Date().toISOString(),
  CONTAINER_ID: 'local-dev',

  // 调试：显示配置信息
  DEBUG_INFO: {
    FRONTEND_API_BASE_URL: '/api/v1',
    CURRENT_HOST: window.location.hostname,
    CURRENT_PORT: window.location.port,
    EXPECTED_BACKEND_PORT: '8080'
  }
};

console.log('App Config Loaded:', window.__APP_CONFIG__);
console.log('Frontend will auto-detect API URL based on environment');
