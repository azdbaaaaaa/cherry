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
          throw new Error('No refresh token')
        }
        this.refreshToken = stored
      }

      try {
        const res = await authApi.refresh({ refresh_token: this.refreshToken })
        this.accessToken = res.data.access_token
        return res.data.access_token
      } catch (error) {
        this.clearAuth()
        throw error
      }
    },

    async fetchUserInfo() {
      try {
        const res = await authApi.getMe()
        this.user = res.data
        this.isAuthenticated = true
        return res.data
      } catch (error) {
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
