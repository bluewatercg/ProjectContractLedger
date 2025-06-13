import apiClient from './config'
import type { ApiResponse, LoginDto, RegisterDto, LoginResponse, UserInfo } from './types'

export const authApi = {
  /**
   * 用户登录
   */
  login(data: LoginDto): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post('/auth/login', data).then(res => res.data)
  },

  /**
   * 用户注册
   */
  register(data: RegisterDto): Promise<ApiResponse<UserInfo>> {
    return apiClient.post('/auth/register', data).then(res => res.data)
  },

  /**
   * 刷新Token
   */
  refreshToken(token: string): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post('/auth/refresh', { token }).then(res => res.data)
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser(): Promise<ApiResponse<UserInfo>> {
    return apiClient.get('/auth/me').then(res => res.data)
  }
}
