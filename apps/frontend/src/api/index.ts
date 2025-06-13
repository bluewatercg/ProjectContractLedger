// 统一导出所有API
export { authApi } from './auth'
export { customerApi } from './customer'
export { contractApi } from './contract'
export { invoiceApi } from './invoice'
export { paymentApi } from './payment'
export { statisticsApi } from './statistics'

// 导出类型
export * from './types'

// 导出配置
export { default as apiClient, API_CONFIG } from './config'
