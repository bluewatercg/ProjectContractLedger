import apiClient from './config'

export interface Kit {
    id: number
    name: string
    code: string
    description?: string
    status: 'active' | 'inactive'
    is_default?: boolean
    created_at: string
    updated_at: string
}

export interface KitListResult {
    list: Kit[]
    total: number
}

// 获取所有套装列表
export const getAllKits = () => {
    return apiClient.get('/kits').then(res => res.data.data)
}

// 获取当前用户授权的套装列表
export const getUserKits = (userId: number) => {
    return apiClient.get(`/kits/user/${userId}`).then(res => res.data.data)
}

// 根据ID获取套装
export const getKitById = (id: number) => {
    return apiClient.get(`/kits/${id}`).then(res => res.data.data)
}

// 创建套装
export const createKit = (data: { name: string; code: string; description?: string }) => {
    return apiClient.post('/kits', data).then(res => res.data.data)
}

// 更新套装
export const updateKit = (id: number, data: { name?: string; description?: string; status?: string }) => {
    return apiClient.put(`/kits/${id}`, data).then(res => res.data.data)
}

// 删除套装
export const deleteKit = (id: number) => {
    return apiClient.delete(`/kits/${id}`).then(res => res.data)
}

// 授权用户访问套装
export const assignUserToKit = (userId: number, kitId: number, isDefault = false) => {
    return apiClient.post(`/kits/user/${userId}/assign`, { kitId, isDefault }).then(res => res.data.data)
}

// 移除用户的套装访问权限
export const removeUserFromKit = (userId: number, kitId: number) => {
    return apiClient.delete(`/kits/user/${userId}/kit/${kitId}`).then(res => res.data)
}

// 设置用户的默认套装
export const setUserDefaultKit = (userId: number, kitId: number) => {
    return apiClient.put(`/kits/user/${userId}/default/${kitId}`).then(res => res.data)
}
