import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

// 运行时配置接口
interface AppConfig {
  API_BASE_URL?: string
  APP_TITLE?: string
  APP_VERSION?: string
  BACKEND_PORT?: string
  NODE_ENV?: string
}

// 获取运行时配置
const getRuntimeConfig = (): AppConfig => {
  // 尝试获取运行时注入的配置
  if (typeof window !== 'undefined' && (window as any).__APP_CONFIG__) {
    return (window as any).__APP_CONFIG__
  }
  return {}
}

// API基础配置
// 支持多种部署方式的动态配置，特别适用于局域网IP部署（如192.168.1.115）
const getApiBaseUrl = () => {
  const runtimeConfig = getRuntimeConfig()

  // 1. 优先使用运行时配置（容器启动时注入）
  if (runtimeConfig.API_BASE_URL) {
    return runtimeConfig.API_BASE_URL
  }

  // 2. 使用构建时环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  // 3. 生产环境动态配置 - 适用于局域网IP部署
  if (import.meta.env.PROD) {
    const currentHost = window.location.hostname
    const currentPort = window.location.port
    const backendPort = runtimeConfig.BACKEND_PORT || '8080'

    // 场景1: 前后端分离部署（不同端口）
    // 例如：前端 http://192.168.1.115:8000，后端 http://192.168.1.115:8080
    if (currentPort !== backendPort && backendPort !== '80') {
      return `${window.location.protocol}//${currentHost}:${backendPort}/api/v1`
    }

    // 场景2: 前后端在同一容器，通过nginx代理
    // 例如：访问 http://192.168.1.115:8000，nginx代理到内部8080端口
    return '/api'
  }

  // 4. 开发环境默认配置
  return '/api/v1'
}

export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
}

// 创建axios实例
const apiClient: AxiosInstance = axios.create(API_CONFIG)

// 请求拦截器
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 添加认证token
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data)
    return config
  },
  (error) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API Response:', response.config.url, response.data)
    
    // 统一处理响应格式
    const { data } = response
    if (data.success === false) {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    
    return response
  },
  (error) => {
    console.error('Response Error:', error)
    
    // 处理HTTP错误状态码
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          const authStore = useAuthStore()
          authStore.logout()
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || `请求失败 (${status})`)
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error(error.message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
