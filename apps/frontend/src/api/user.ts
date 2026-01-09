import request from './config'

export interface User {
    id: number
    username: string
    email: string
    full_name?: string
    phone?: string
    role: 'admin' | 'user'
    status: 'active' | 'inactive'
    created_at: string
    updated_at: string
}

export interface UserListParams {
    page?: number
    pageSize?: number
    username?: string
    email?: string
    role?: string
    status?: string
}

export interface UserListResult {
    list: User[]
    total: number
}

export interface CreateUserParams {
    username: string
    email: string
    password?: string
    full_name?: string
    phone?: string
    role?: string
    status?: string
}

export interface UpdateUserParams {
    email?: string
    password?: string
    full_name?: string
    phone?: string
    role?: string
    status?: string
}

export const getUserList = (params: UserListParams) => {
    return request.get('/users', { params }).then(res => res.data.data)
}

export const getUserDetail = (id: number) => {
    return request.get(`/users/${id}`).then(res => res.data.data)
}

export const createUser = (data: CreateUserParams) => {
    return request.post('/users', data).then(res => res.data.data)
}

export const updateUser = (id: number, data: UpdateUserParams) => {
    return request.put(`/users/${id}`, data).then(res => res.data.data)
}

export const deleteUser = (id: number) => {
    return request.delete(`/users/${id}`).then(res => res.data)
}
