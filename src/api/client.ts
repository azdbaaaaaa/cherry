import axios from 'axios'
import { ElMessage } from 'element-plus'
import { nextTick } from 'vue'
import router from '@/router'
import { useUserStore } from '@/stores/user'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  async (config) => {
    const userStore = useUserStore()
    
    // 如果有Access Token，添加到Header
    if (userStore.accessToken) {
      config.headers.Authorization = `Bearer ${userStore.accessToken}`
      // 调试日志（生产环境可移除）
      if (import.meta.env.DEV) {
        console.log('[API Request]', config.method?.toUpperCase(), config.url, 'with token:', userStore.accessToken.substring(0, 20) + '...')
      }
    } else {
      // 调试日志（生产环境可移除）
      if (import.meta.env.DEV) {
        console.warn('[API Request]', config.method?.toUpperCase(), config.url, 'without token')
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
// 根据后端 Swagger 文档，所有接口响应格式统一为：
// 成功: { code: 0, message: string, data?: any }
// 错误: { code: number (非0), message: string, detail?: string }
request.interceptors.response.use(
  (response) => {
    // 后端统一响应格式（参考 lemon/internal/model/response.go）
    const { code, message, data } = response.data
    
    // code === 0 表示成功，返回 data 字段
    if (code === 0) {
      return { ...response, data }
    }
    
    // code !== 0 表示业务错误，显示错误消息并reject
    ElMessage.error(message || '请求失败')
    return Promise.reject(new Error(message))
  },
  async (error) => {
    const originalRequest = error.config
    const userStore = useUserStore()
    
    // 处理 401 未授权错误
    if (error.response?.status === 401) {
      const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh')
      
      // 如果是 refresh 接口返回 401，直接清除认证并跳转登录
      if (isRefreshRequest) {
        userStore.clearAuth()
        ElMessage.error('登录已过期，请重新登录')
        // 使用 nextTick 确保路由状态已更新
        nextTick(() => {
          if (router.currentRoute.value.name !== 'Login') {
            router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
          }
        })
        return Promise.reject(error)
      }
      
      // 如果是其他接口返回 401，尝试刷新 token
      if (originalRequest && !originalRequest._retry) {
        originalRequest._retry = true
        
        // 检查是否有 refresh token
        if (!userStore.refreshToken) {
          const storedRefreshToken = localStorage.getItem('refresh_token')
          if (!storedRefreshToken) {
            // 没有 refresh token，直接跳转登录
            userStore.clearAuth()
            ElMessage.error('请先登录')
            nextTick(() => {
              if (router.currentRoute.value.name !== 'Login') {
                router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
              }
            })
            return Promise.reject(error)
          }
          userStore.refreshToken = storedRefreshToken
        }
        
        try {
          // 刷新Token
          const newToken = await userStore.refreshAccessToken()
          
          // 更新请求Header
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          
          // 重试原请求
          return request(originalRequest)
        } catch (refreshError) {
          // 刷新失败，跳转到登录页
          userStore.clearAuth()
          ElMessage.error('登录已过期，请重新登录')
          nextTick(() => {
            if (router.currentRoute.value.name !== 'Login') {
              router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
            }
          })
          return Promise.reject(refreshError)
        }
      } else {
        // 已经重试过，仍然 401，或者 originalRequest 不存在，说明 token 无效，跳转登录
        userStore.clearAuth()
        ElMessage.error('登录已过期，请重新登录')
        nextTick(() => {
          if (router.currentRoute.value.name !== 'Login') {
            router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
          }
        })
        return Promise.reject(error)
      }
    }
    
    // 其他错误处理
    // 根据后端 Swagger 文档，HTTP错误响应格式为 ErrorResponse:
    // { code: number, message: string, detail?: string }
    // 参考: lemon/internal/model/response.go - ErrorResponse
    if (error.response) {
      const { status, data } = error.response
      
      // 如果响应体包含后端定义的错误格式，使用后端错误消息
      if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
        ElMessage.error(data.message || '请求失败')
      } else {
        // 否则使用HTTP状态码对应的默认消息
        switch (status) {
          case 401:
            // 401错误已经在上面处理，这里不需要再处理
            break
          case 403:
            ElMessage.error('无权限访问')
            break
          case 404:
            ElMessage.error('资源不存在')
            break
          case 500:
            ElMessage.error('服务器错误')
            break
          default:
            ElMessage.error('请求失败')
        }
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

export default request
