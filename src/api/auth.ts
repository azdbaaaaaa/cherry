import request from './client'
import type { User } from '@/types/auth'

// 请求类型（与后端 model.RegisterRequest 一致）
export interface RegisterRequest {
  username: string
  email: string
  password: string
  nickname?: string
}

// 请求类型（与后端 model.LoginRequest 一致）
export interface LoginRequest {
  username: string
  password: string
}

// 请求类型（与后端 model.RefreshTokenRequest 一致）
export interface RefreshTokenRequest {
  refresh_token: string
}

// 响应类型（与后端 model.LoginResponseData 一致）
export interface LoginResponseData {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: User
}

// 响应类型（与后端 model.RegisterResponseData 一致）
export interface RegisterResponseData {
  user_id: string
  username: string
  status: string
}

// 响应类型（与后端 model.RefreshTokenResponseData 一致）
export interface RefreshTokenResponseData {
  access_token: string
  expires_in: number
  token_type: string
}

export const authApi = {
  // 注册 - POST /api/v1/auth/register
  // 响应格式：{ code: 0, message: string, data: RegisterResponseData }
  register(data: RegisterRequest) {
    return request.post<RegisterResponseData>('/api/v1/auth/register', data)
  },

  // 登录 - POST /api/v1/auth/login
  // 响应格式：{ code: 0, message: string, data: LoginResponseData }
  login(data: LoginRequest) {
    return request.post<LoginResponseData>('/api/v1/auth/login', data)
  },

  // 刷新Token - POST /api/v1/auth/refresh
  // 响应格式：{ code: 0, message: string, data: RefreshTokenResponseData }
  refresh(data: RefreshTokenRequest) {
    return request.post<RefreshTokenResponseData>('/api/v1/auth/refresh', data)
  },

  // 退出登录 - POST /api/v1/auth/logout
  // 响应格式：{ code: 0, message: string }
  logout() {
    return request.post<{ code: number; message: string }>('/api/v1/auth/logout')
  },

  // 获取当前用户信息 - GET /api/v1/auth/me
  // 响应格式：{ code: 0, message: string, data: User }
  getMe() {
    return request.get<User>('/api/v1/auth/me')
  }
}
