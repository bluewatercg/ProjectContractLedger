import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'
import type { UserInfo, LoginDto, RegisterDto } from '@/api/types'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<UserInfo | null>(null)
  const isLoading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // 登录
  const login = async (loginData: LoginDto) => {
    try {
      isLoading.value = true
      const response = await authApi.login(loginData)
      
      if (response.success && response.data) {
        token.value = response.data.token
        user.value = response.data.user
        
        // 保存到本地存储
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        return response.data
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 注册
  const register = async (registerData: RegisterDto) => {
    try {
      isLoading.value = true
      const response = await authApi.register(registerData)
      
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.message || '注册失败')
      }
    } catch (error) {
      console.error('Register error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  const logout = () => {
    token.value = ''
    user.value = null
    
    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // 刷新Token
  const refreshToken = async () => {
    try {
      if (!token.value) return false
      
      const response = await authApi.refreshToken(token.value)
      
      if (response.success && response.data) {
        token.value = response.data.token
        user.value = response.data.user
        
        // 更新本地存储
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        return true
      } else {
        logout()
        return false
      }
    } catch (error) {
      console.error('Refresh token error:', error)
      logout()
      return false
    }
  }

  // 初始化用户信息
  const initializeAuth = () => {
    const savedUser = localStorage.getItem('user')
    if (savedUser && token.value) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (error) {
        console.error('Parse saved user error:', error)
        logout()
      }
    }
  }

  // 检查Token有效性
  const checkTokenValidity = async () => {
    if (!token.value) return false
    
    try {
      // 这里可以调用一个验证token的API
      // const response = await authApi.getCurrentUser()
      // return response.success
      return true
    } catch (error) {
      logout()
      return false
    }
  }

  return {
    // 状态
    token,
    user,
    isLoading,
    
    // 计算属性
    isAuthenticated,
    isAdmin,
    
    // 方法
    login,
    register,
    logout,
    refreshToken,
    initializeAuth,
    checkTokenValidity
  }
})
