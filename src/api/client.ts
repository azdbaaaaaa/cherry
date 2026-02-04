import axios from 'axios'
import { ElMessage } from 'element-plus'
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
    
    // 如果是401错误且未重试过
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
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
        router.push('/login')
        return Promise.reject(refreshError)
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
