import apiClient from './config'
import type {
  ApiResponse,
  BusinessCategory,
  CreateBusinessCategoryDto,
  UpdateBusinessCategoryDto,
  MoveNodeDto,
  DeleteCategoryResult
} from './types'

export const businessCategoryApi = {
  /**
   * 获取业务类型树
   */
  getTree(status?: 'active'): Promise<ApiResponse<BusinessCategory[]>> {
    const params = status ? { status } : {}
    return apiClient.get('/business-categories', { params }).then(res => res.data)
  },

  /**
   * 创建业务类型
   */
  create(data: CreateBusinessCategoryDto): Promise<ApiResponse<BusinessCategory>> {
    return apiClient.post('/business-categories', data).then(res => res.data)
  },

  /**
   * 更新业务类型
   */
  update(id: number, data: UpdateBusinessCategoryDto): Promise<ApiResponse<BusinessCategory>> {
    return apiClient.put(`/business-categories/${id}`, data).then(res => res.data)
  },

  /**
   * 删除业务类型
   */
  delete(id: number): Promise<ApiResponse<DeleteCategoryResult>> {
    return apiClient.delete(`/business-categories/${id}`).then(res => res.data)
  },

  /**
   * 移动节点（拖拽排序）
   */
  moveNode(data: MoveNodeDto): Promise<ApiResponse<void>> {
    return apiClient.post('/business-categories/move', data).then(res => res.data)
  },

  /**
   * 切换状态（启用/禁用）
   */
  toggleStatus(id: number): Promise<ApiResponse<BusinessCategory>> {
    return apiClient.patch(`/business-categories/${id}/toggle-status`).then(res => res.data)
  }
}
