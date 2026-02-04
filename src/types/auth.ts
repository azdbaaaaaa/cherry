export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'editor' | 'reviewer'
  status: 'active' | 'inactive' | 'banned'
  profile?: {
    nickname?: string
    avatar?: string
    phone?: string
  }
  last_login_at?: string
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: User
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  nickname?: string
}
