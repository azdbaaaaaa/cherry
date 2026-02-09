import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import type { User, LoginRequest } from '@/types/auth'

interface UserState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    isEditor: (state) => state.user?.role === 'editor',
    isReviewer: (state) => state.user?.role === 'reviewer',
    hasRole: (state) => (role: string) => state.user?.role === role,
    hasPermission: (state) => (permission: string) => {
      // 根据角色判断权限
      const role = state.user?.role
      if (role === 'admin') return true
      // 其他权限检查逻辑可以根据需要扩展
      return false
    }
  },

  actions: {
    async login(data: LoginRequest) {
      try {
        const res = await authApi.login(data)
        this.accessToken = res.data.access_token
        this.refreshToken = res.data.refresh_token
        this.user = res.data.user
        this.isAuthenticated = true

        // 保存Refresh Token到localStorage
        localStorage.setItem('refresh_token', res.data.refresh_token)

        return res.data
      } catch (error) {
        throw error
      }
    },

    async logout() {
      try {
        if (this.accessToken) {
          await authApi.logout()
        }
      } catch (error) {
        console.error('退出失败', error)
      } finally {
        this.clearAuth()
      }
    },

    async refreshAccessToken() {
      if (!this.refreshToken) {
        const stored = localStorage.getItem('refresh_token')
        if (!stored) {
          this.clearAuth()
          throw new Error('No refresh token')
        }
        this.refreshToken = stored
      }

      try {
        const res = await authApi.refresh({ refresh_token: this.refreshToken })
        this.accessToken = res.data.access_token
        // 如果响应中包含新的 refresh_token，更新它
        if (res.data.refresh_token) {
          this.refreshToken = res.data.refresh_token
          localStorage.setItem('refresh_token', res.data.refresh_token)
        }
        return res.data.access_token
      } catch (error: any) {
        // 如果是 401 错误，说明 refresh token 已过期或无效
        if (error?.response?.status === 401) {
          this.clearAuth()
          throw new Error('Refresh token expired or invalid')
        }
        // 其他错误也清除认证状态
        this.clearAuth()
        throw error
      }
    },

    async fetchUserInfo() {
      try {
        // 如果 accessToken 不存在，先尝试刷新
        if (!this.accessToken && this.refreshToken) {
          try {
            await this.refreshAccessToken()
          } catch (refreshError) {
            // 刷新失败，清除认证状态
            this.clearAuth()
            throw refreshError
          }
        }

        const res = await authApi.getMe()
        this.user = res.data
        this.isAuthenticated = true
        return res.data
      } catch (error: any) {
        // 如果是 401 错误，说明 token 无效
        if (error?.response?.status === 401) {
          this.clearAuth()
          throw new Error('Authentication failed')
        }
        this.clearAuth()
        throw error
      }
    },

    clearAuth() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.isAuthenticated = false
      localStorage.removeItem('refresh_token')
    },

    initAuth() {
      // 从localStorage恢复Refresh Token
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        this.refreshToken = refreshToken
        // 尝试获取用户信息
        this.fetchUserInfo().catch(() => {
          this.clearAuth()
        })
      }
    }
  }
})
