import apiClient from './config'
import type {
  ApiResponse,
  PaginationQuery,
  PaginationResult,
  Contract,
  CreateContractDto,
  UpdateContractDto
} from './types'

export const contractApi = {
  /**
   * 获取合同列表
   */
  getContracts(params: PaginationQuery & { customerId?: number; status?: string; billingStatus?: string; search?: string; viewAll?: boolean }): Promise<ApiResponse<PaginationResult<Contract>>> {
    return apiClient.get('/contracts', { params }).then(res => res.data)
  },

  /**
   * 根据ID获取合同详情
   */
  getContractById(
    id: number,
    params?: { viewAll?: boolean }
  ): Promise<ApiResponse<Contract>> {
    return apiClient.get(`/contracts/${id}`, { params }).then(res => res.data)
  },

  /**
   * 创建合同
   */
  createContract(data: CreateContractDto): Promise<ApiResponse<Contract>> {
    return apiClient.post('/contracts', data).then(res => res.data)
  },

  /**
   * 更新合同信息
   */
  updateContract(
    id: number,
    data: UpdateContractDto,
    params?: { viewAll?: boolean }
  ): Promise<ApiResponse<Contract>> {
    return apiClient.put(`/contracts/${id}`, data, { params }).then(res => res.data)
  },

  /**
   * 删除合同
   */
  deleteContract(
    id: number,
    params?: { viewAll?: boolean }
  ): Promise<ApiResponse<void>> {
    return apiClient.delete(`/contracts/${id}`, { params }).then(res => res.data)
  },

  /**
   * 获取合同统计信息
   */
  getContractStats(): Promise<ApiResponse<any>> {
    return apiClient.get('/contracts/stats/overview').then(res => res.data)
  }
}
