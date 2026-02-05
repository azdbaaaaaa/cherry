import axios from 'axios'
import type { UploadFileResponse } from '@/types/novel'
import { useUserStore } from '@/stores/user'
import request from './client'

export interface UploadProgressEvent {
  loaded: number
  total: number
  percent: number
}

export const resourceApi = {
  /**
   * 上传文件（multipart/form-data）
   * @param file 文件对象
   * @param onProgress 上传进度回调
   * @returns Promise<UploadFileResponse>
   */
  async uploadFile(
    file: File,
    onProgress?: (event: UploadProgressEvent) => void
  ): Promise<UploadFileResponse> {
    const userStore = useUserStore()
    
    // 构建 FormData
    const formData = new FormData()
    formData.append('file', file)
    
    // 添加 user_id（从 userStore 获取）
    if (userStore.user?.id) {
      formData.append('user_id', userStore.user.id)
    } else {
      // 如果没有用户ID，尝试从其他方式获取
      // 这里可以根据实际情况调整
      throw new Error('用户未登录，无法上传文件')
    }

    // 创建独立的 axios 实例用于文件上传，不设置 Content-Type，让浏览器自动设置
    const uploadRequest = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7080',
      timeout: 300000, // 文件上传超时时间设置为 5 分钟
      headers: {
        // 不设置 Content-Type，让浏览器自动设置 multipart/form-data; boundary=...
      }
    })

    // 添加请求拦截器，设置 Authorization header
    uploadRequest.interceptors.request.use(
      async (config) => {
        if (userStore.accessToken) {
          config.headers.Authorization = `Bearer ${userStore.accessToken}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 添加响应拦截器，处理统一响应格式
    uploadRequest.interceptors.response.use(
      (response) => {
        const { code, message, data } = response.data
        
        if (code === 0) {
          // 返回包含 data 的对象，这样 post 方法返回的 response.data 就是 UploadFileResponse
          return { ...response, data }
        }
        
        return Promise.reject(new Error(message || '请求失败'))
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 配置上传进度监控
    const config: any = {
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percent
          })
        }
      }
    }

    const response = await uploadRequest.post<UploadFileResponse>('/api/v1/resources/upload', formData, config)
    // 响应拦截器已经处理了统一响应格式，返回的是 { ...response, data }
    // 所以 response.data 就是 UploadFileResponse
    return response.data
  },

  /**
   * 获取资源下载URL（用于预览音频/图片/视频/字幕）
   */
  getDownloadURL(resourceId: string, expiresIn?: number) {
    return request.get<{
      resource_id: string
      download_url: string
      expires_at: string
      file_name: string
      file_size: number
      content_type: string
    }>(`/api/v1/resources/${resourceId}/download-url`, {
      params: expiresIn ? { expires_in: expiresIn } : {}
    })
  }
}

