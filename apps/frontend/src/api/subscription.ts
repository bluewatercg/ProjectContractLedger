import apiClient from './config'
import type {
  ApiResponse,
  PaginationResult,
  SubscriptionRecord,
  SubscriptionType,
  SubscriptionRenewalLog,
  SubscriptionRenewalAttachment,
  SubscriptionQuery,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  CreateSubscriptionTypeDto,
  UpdateSubscriptionTypeDto,
  RenewSubscriptionDto
} from './types'

export const subscriptionApi = {
  getTypes(status?: 'active' | 'disabled'): Promise<ApiResponse<SubscriptionType[]>> {
    return apiClient.get('/subscriptions/types', { params: { status } }).then(res => res.data)
  },

  createType(data: CreateSubscriptionTypeDto): Promise<ApiResponse<SubscriptionType>> {
    return apiClient.post('/subscriptions/types', data).then(res => res.data)
  },

  updateType(id: number, data: UpdateSubscriptionTypeDto): Promise<ApiResponse<SubscriptionType>> {
    return apiClient.put(`/subscriptions/types/${id}`, data).then(res => res.data)
  },

  getSubscriptions(params: SubscriptionQuery): Promise<ApiResponse<PaginationResult<SubscriptionRecord>>> {
    return apiClient.get('/subscriptions', { params }).then(res => res.data)
  },

  getSubscriptionById(id: number): Promise<ApiResponse<SubscriptionRecord>> {
    return apiClient.get(`/subscriptions/${id}`).then(res => res.data)
  },

  createSubscription(data: CreateSubscriptionDto): Promise<ApiResponse<SubscriptionRecord>> {
    return apiClient.post('/subscriptions', data).then(res => res.data)
  },

  updateSubscription(id: number, data: UpdateSubscriptionDto): Promise<ApiResponse<SubscriptionRecord>> {
    return apiClient.put(`/subscriptions/${id}`, data).then(res => res.data)
  },

  disableSubscription(id: number): Promise<ApiResponse<SubscriptionRecord>> {
    return apiClient.patch(`/subscriptions/${id}/disable`).then(res => res.data)
  },

  enableSubscription(id: number): Promise<ApiResponse<SubscriptionRecord>> {
    return apiClient.patch(`/subscriptions/${id}/enable`).then(res => res.data)
  },

  renewSubscription(id: number, data: RenewSubscriptionDto): Promise<ApiResponse<SubscriptionRecord>> {
    return apiClient.post(`/subscriptions/${id}/renew`, data).then(res => res.data)
  },

  getRenewalLogs(id: number): Promise<ApiResponse<SubscriptionRenewalLog[]>> {
    return apiClient.get(`/subscriptions/${id}/renewal-logs`).then(res => res.data)
  },

  deleteRenewalLog(id: number, renewalLogId: number): Promise<ApiResponse> {
    return apiClient.delete(`/subscriptions/${id}/renewal-logs/${renewalLogId}`).then(res => res.data)
  },

  getRenewalAttachments(renewalLogId: number): Promise<ApiResponse<SubscriptionRenewalAttachment[]>> {
    return apiClient.get(`/subscriptions/renewal-logs/${renewalLogId}/attachments`).then(res => res.data)
  },

  uploadRenewalAttachment(
    renewalLogId: number,
    attachmentType: 'contract' | 'invoice',
    file: File
  ): Promise<ApiResponse<SubscriptionRenewalAttachment>> {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(`/subscriptions/renewal-logs/${renewalLogId}/attachments/${attachmentType}`, formData).then(res => res.data)
  },

  downloadRenewalAttachment(attachmentId: number): Promise<Blob> {
    return apiClient.get(`/subscriptions/attachments/${attachmentId}/download`, {
      responseType: 'blob'
    }).then(res => res.data)
  },

  getRenewalAttachmentPreviewUrl(attachmentId: number): Promise<ApiResponse<{ preview_url: string }>> {
    return apiClient.get(`/subscriptions/attachments/${attachmentId}/preview`).then(res => res.data)
  },

  getRenewalAttachmentBase64(attachmentId: number): Promise<ApiResponse<{ base64: string; contentType: string; size: number; fileName: string }>> {
    return apiClient.get(`/subscriptions/attachments/${attachmentId}/base64`).then(res => res.data)
  },

  deleteRenewalAttachment(attachmentId: number): Promise<ApiResponse> {
    return apiClient.delete(`/subscriptions/attachments/${attachmentId}`).then(res => res.data)
  }
}
