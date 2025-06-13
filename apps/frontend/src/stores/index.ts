import { createPinia } from 'pinia'

// 创建pinia实例
export const pinia = createPinia()

// 导出所有store
export { useAuthStore } from './auth'
