import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { buildApiBaseUrl, getVersionInfo } from './version'

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
// 支持多种部署方式的动态配置和版本管理
const getApiBaseUrl = () => {
  // 使用版本管理模块构建API Base URL
  return buildApiBaseUrl()
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

    // 添加API版本信息到请求头
    const versionInfo = getVersionInfo()
    config.headers = config.headers || {}
    config.headers['X-API-Version'] = versionInfo.current
    config.headers['X-Client-Version'] = import.meta.env.VITE_APP_VERSION || '1.0.0'

    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data)
    console.log('API Version:', versionInfo.current, 'Base URL:', versionInfo.baseURL)
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
