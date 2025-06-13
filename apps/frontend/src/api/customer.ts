import apiClient from './config'
import type { 
  ApiResponse, 
  PaginationQuery, 
  PaginationResult, 
  Customer, 
  CreateCustomerDto, 
  UpdateCustomerDto 
} from './types'

export const customerApi = {
  /**
   * 获取客户列表
   */
  getCustomers(params: PaginationQuery & { search?: string }): Promise<ApiResponse<PaginationResult<Customer>>> {
    return apiClient.get('/customers', { params }).then(res => res.data)
  },

  /**
   * 根据ID获取客户详情
   */
  getCustomerById(id: number): Promise<ApiResponse<Customer>> {
    return apiClient.get(`/customers/${id}`).then(res => res.data)
  },

  /**
   * 创建客户
   */
  createCustomer(data: CreateCustomerDto): Promise<ApiResponse<Customer>> {
    return apiClient.post('/customers', data).then(res => res.data)
  },

  /**
   * 更新客户信息
   */
  updateCustomer(id: number, data: UpdateCustomerDto): Promise<ApiResponse<Customer>> {
    return apiClient.put(`/customers/${id}`, data).then(res => res.data)
  },

  /**
   * 删除客户
   */
  deleteCustomer(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/customers/${id}`).then(res => res.data)
  },

  /**
   * 根据状态获取客户列表
   */
  getCustomersByStatus(status: string): Promise<ApiResponse<Customer[]>> {
    return apiClient.get(`/customers/status/${status}`).then(res => res.data)
  }
}
