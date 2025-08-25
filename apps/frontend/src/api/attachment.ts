import apiClient from './config'
import type { ApiResponse } from './types'

// 附件相关类型
export interface Attachment {
  attachment_id: number
  file_name: string
  file_path: string
  file_type?: string
  file_size?: number
  uploaded_at: string
}

export const attachmentApi = {
  /**
   * 获取合同附件列表
   */
  getContractAttachments(contractId: number): Promise<ApiResponse<Attachment[]>> {
    return apiClient.get(`/contracts/${contractId}/attachments`).then(res => res.data)
  },

  /**
   * 上传合同附件
   */
  uploadContractAttachment(contractId: number, file: File): Promise<ApiResponse<Attachment>> {
    const formData = new FormData()
    formData.append('file', file)
    
    return apiClient.post(`/contracts/${contractId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(res => res.data)
  },

  /**
   * 删除合同附件
   */
  deleteContractAttachment(contractId: number, attachmentId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/contracts/${contractId}/attachments/${attachmentId}`).then(res => res.data)
  },

  /**
   * 获取发票附件列表
   */
  getInvoiceAttachments(invoiceId: number): Promise<ApiResponse<Attachment[]>> {
    return apiClient.get(`/invoices/${invoiceId}/attachments`).then(res => res.data)
  },

  /**
   * 上传发票附件
   */
  uploadInvoiceAttachment(invoiceId: number, file: File): Promise<ApiResponse<Attachment>> {
    const formData = new FormData()
    formData.append('file', file)
    
    return apiClient.post(`/invoices/${invoiceId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(res => res.data)
  },

  /**
   * 删除发票附件
   */
  deleteInvoiceAttachment(invoiceId: number, attachmentId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/invoices/${invoiceId}/attachments/${attachmentId}`).then(res => res.data)
  },

  /**
   * 下载附件
   */
  downloadAttachment(attachmentId: number, type?: 'contract' | 'invoice'): Promise<Blob> {
    const params = type ? `?type=${type}` : '';
    return apiClient.get(`/attachments/${attachmentId}/download${params}`, {
      responseType: 'blob'
    }).then(res => res.data)
  },

  /**
   * 获取附件的安全临时预览URL（旧方法，保留兼容性）
   */
  async getAttachmentPreviewUrl(attachmentId: number): Promise<ApiResponse<{ preview_url: string }>> {
    return apiClient.get(`/attachments/${attachmentId}/preview`).then(res => res.data);
  },

  /**
   * 获取PDF附件的Base64编码数据（新预览方案）
   */
  async getAttachmentBase64(attachmentId: number, type?: 'contract' | 'invoice'): Promise<ApiResponse<{ 
    base64: string; 
    contentType: string; 
    size: number; 
    fileName: string; 
  }>> {
    const params = type ? `?type=${type}` : '';
    return apiClient.get(`/attachments/${attachmentId}/base64${params}`).then(res => res.data);
  }
}
