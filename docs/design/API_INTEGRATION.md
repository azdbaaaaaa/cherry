# API 集成文档

本文档说明如何在前端项目中集成后端API。

## 1. API客户端配置

### 1.1 Axios实例配置

```typescript
// src/api/client.ts
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data
    
    // 业务成功
    if (code === 0) {
      return { ...response, data }
    }
    
    // 业务错误
    ElMessage.error(message || '请求失败')
    return Promise.reject(new Error(message))
  },
  (error) => {
    // HTTP错误处理
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          ElMessage.error('未授权，请重新登录')
          localStorage.removeItem('token')
          router.push('/login')
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
          ElMessage.error(data?.message || '请求失败')
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
```

### 1.2 环境变量配置

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_BASE_URL=ws://localhost:8080

# .env.production
VITE_API_BASE_URL=https://api.example.com
VITE_WS_BASE_URL=wss://api.example.com
```

## 2. API接口封装

### 2.1 工作流API

```typescript
// src/api/workflow.ts
import request from './client'
import type { 
  Workflow, 
  CreateWorkflowRequest,
  WorkflowListResponse,
  WorkflowProgress
} from '@/types/workflow'

export const workflowApi = {
  // 创建工作流
  create(data: CreateWorkflowRequest) {
    return request.post<{ workflow_id: string; status: string; created_at: string }>(
      '/api/v1/workflow',
      data
    )
  },
  
  // 查询工作流
  get(id: string) {
    return request.get<Workflow>(`/api/v1/workflow/${id}`)
  },
  
  // 查询工作流列表
  list(params?: { page?: number; page_size?: number; status?: string }) {
    return request.get<WorkflowListResponse>('/api/v1/workflow', { params })
  },
  
  // 暂停工作流
  pause(id: string) {
    return request.post(`/api/v1/workflow/${id}/pause`)
  },
  
  // 恢复工作流
  resume(id: string) {
    return request.post(`/api/v1/workflow/${id}/resume`)
  },
  
  // 取消工作流
  cancel(id: string) {
    return request.post(`/api/v1/workflow/${id}/cancel`)
  },
  
  // 查询进度
  getProgress(id: string) {
    return request.get<WorkflowProgress>(`/api/v1/workflow/${id}/progress`)
  }
}
```

### 2.2 剧本API

```typescript
// src/api/script.ts
import request from './client'
import type { Script, ScriptTask } from '@/types/script'

export const scriptApi = {
  // 创建剧本生成任务
  create(data: {
    workflow_id: string
    input_type: string
    input_content?: string
    input_file_url?: string
    options?: Record<string, any>
  }) {
    return request.post<ScriptTask>('/api/v1/workflow/script', data)
  },
  
  // 查询剧本结果
  get(id: string) {
    return request.get<Script>(`/api/v1/workflow/script/${id}`)
  },
  
  // 上传输入文件
  upload(file: File, workflowId: string, onProgress?: (progress: number) => void) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('workflow_id', workflowId)
    
    return request.post<{ file_url: string; file_size: number; content_type: string }>(
      '/api/v1/workflow/script/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress(progress)
          }
        }
      }
    )
  }
}
```

### 2.3 资产API

```typescript
// src/api/asset.ts
import request from './client'
import type { Asset, AssetListResponse } from '@/types/asset'

export const assetApi = {
  // 创建资产设计任务
  create(data: {
    workflow_id: string
    script_id: string
    options?: Record<string, any>
  }) {
    return request.post('/api/v1/workflow/assets', data)
  },
  
  // 查询资产列表
  list(workflowId: string, type?: string) {
    return request.get<AssetListResponse>('/api/v1/workflow/assets', {
      params: { workflow_id: workflowId, type }
    })
  },
  
  // 上传参考图
  uploadReference(assetId: string, file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('asset_id', assetId)
    
    return request.post(
      `/api/v1/workflow/assets/${assetId}/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress(progress)
          }
        }
      }
    )
  },
  
  // 重新生成设计图
  regenerate(assetId: string, data?: { prompt?: string; options?: Record<string, any> }) {
    return request.post(`/api/v1/workflow/assets/${assetId}/regenerate`, data)
  }
}
```

### 2.4 分镜API

```typescript
// src/api/storyboard.ts
import request from './client'
import type { Storyboard, Shot } from '@/types/storyboard'

export const storyboardApi = {
  // 创建分镜生成任务
  create(data: {
    workflow_id: string
    script_id: string
    options?: {
      grid_layout?: string
      ai_provider?: string
      auto_crop?: boolean
    }
  }) {
    return request.post('/api/v1/workflow/storyboard', data)
  },
  
  // 查询分镜详情
  get(id: string) {
    return request.get<Storyboard>(`/api/v1/workflow/storyboard/${id}`)
  },
  
  // 编辑分镜提示词
  updateShot(storyboardId: string, shotId: string, data: {
    prompt?: string
    replacements?: Record<string, string>
  }) {
    return request.put(
      `/api/v1/workflow/storyboard/${storyboardId}/shots/${shotId}`,
      data
    )
  },
  
  // 重新生成分镜
  regenerate(id: string, data?: {
    shot_ids?: string[]
    options?: Record<string, any>
  }) {
    return request.post(`/api/v1/workflow/storyboard/${id}/regenerate`, data)
  }
}
```

### 2.5 动态分镜API

```typescript
// src/api/animatic.ts
import request from './client'
import type { Animatic } from '@/types/animatic'

export const animaticApi = {
  // 创建动态分镜任务
  create(data: {
    workflow_id: string
    storyboard_id: string
    options?: Record<string, any>
  }) {
    return request.post('/api/v1/workflow/animatic', data)
  },
  
  // 查询动态分镜详情
  get(id: string) {
    return request.get<Animatic>(`/api/v1/workflow/animatic/${id}`)
  },
  
  // 生成/上传音频
  audio(id: string, data: {
    text?: string
    shot_id: string
    file?: File
    options?: Record<string, any>
  }, onProgress?: (progress: number) => void) {
    const formData = new FormData()
    if (data.file) {
      formData.append('file', data.file)
    }
    if (data.text) {
      formData.append('text', data.text)
    }
    formData.append('shot_id', data.shot_id)
    
    return request.post(
      `/api/v1/workflow/animatic/${id}/audio`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress(progress)
          }
        }
      }
    )
  }
}
```

### 2.6 视频API

```typescript
// src/api/video.ts
import request from './client'
import type { Video, VideoProgress } from '@/types/video'

export const videoApi = {
  // 创建视频生成任务
  create(data: {
    workflow_id: string
    animatic_id: string
    options?: Record<string, any>
  }) {
    return request.post('/api/v1/workflow/video', data)
  },
  
  // 查询视频生成进度
  getProgress(id: string) {
    return request.get<VideoProgress>(`/api/v1/workflow/video/${id}/progress`)
  },
  
  // 查询视频详情
  get(id: string) {
    return request.get<Video>(`/api/v1/workflow/video/${id}`)
  }
}
```

### 2.7 剪辑API

```typescript
// src/api/edit.ts
import request from './client'
import type { Edit } from '@/types/edit'

export const editApi = {
  // 创建剪辑任务
  create(data: {
    workflow_id: string
    video_id: string
    options?: Record<string, any>
  }) {
    return request.post('/api/v1/workflow/edit', data)
  },
  
  // 添加背景音乐
  addMusic(id: string, data: {
    music_url: string
    volume?: number
    fade_in?: number
    fade_out?: number
  }) {
    return request.post(`/api/v1/workflow/edit/${id}/music`, data)
  },
  
  // 查询剪辑结果
  get(id: string) {
    return request.get<Edit>(`/api/v1/workflow/edit/${id}`)
  }
}
```

## 3. TypeScript类型定义

### 3.1 工作流类型

```typescript
// src/types/workflow.ts
export interface Workflow {
  id: string
  name: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  current_stage: 'script' | 'asset' | 'storyboard' | 'animatic' | 'video' | 'edit'
  progress: number
  script?: Script
  assets?: Asset[]
  storyboard?: Storyboard
  animatic?: Animatic
  video?: Video
  edit?: Edit
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface CreateWorkflowRequest {
  name: string
  input_type: 'novel' | 'document' | 'image' | 'text'
  input_content?: string
  options?: {
    ai_provider?: string
    preferences?: Record<string, any>
  }
}

export interface WorkflowListResponse {
  workflows: Workflow[]
  total: number
  page: number
  page_size: number
}

export interface WorkflowProgress {
  workflow_id: string
  overall_progress: number
  current_stage: string
  stage_progress: number
  stages: Array<{
    stage: string
    status: string
    progress: number
  }>
}
```

### 3.2 其他类型定义

在`src/types/`目录下创建对应的类型文件：
- `script.ts`: 剧本相关类型
- `asset.ts`: 资产相关类型
- `storyboard.ts`: 分镜相关类型
- `animatic.ts`: 动态分镜相关类型
- `video.ts`: 视频相关类型
- `edit.ts`: 剪辑相关类型

## 4. WebSocket集成

### 4.1 WebSocket工具类

```typescript
// src/utils/websocket.ts
export class WorkflowWebSocket {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  
  constructor(workflowId: string) {
    const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080'
    this.url = `${wsBaseUrl}/api/v1/workflow/${workflowId}/ws`
  }
  
  connect(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    this.ws = new WebSocket(this.url)
    
    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message', error)
      }
    }
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error', error)
      onError?.(error)
    }
    
    this.ws.onclose = () => {
      console.log('WebSocket closed')
      this.reconnect()
    }
  }
  
  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        // 需要重新传入回调函数
      }, 1000 * this.reconnectAttempts)
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
  
  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }
}
```

### 4.2 在组件中使用

```typescript
// src/components/workflow/WorkflowProgress.vue
import { onMounted, onUnmounted } from 'vue'
import { WorkflowWebSocket } from '@/utils/websocket'

const props = defineProps<{ workflowId: string }>()
let ws: WorkflowWebSocket | null = null

onMounted(() => {
  ws = new WorkflowWebSocket(props.workflowId)
  ws.connect((data) => {
    // 处理进度更新
    if (data.type === 'progress') {
      // 更新进度
    }
  })
})

onUnmounted(() => {
  ws?.disconnect()
})
```

## 5. 使用示例

### 5.1 创建工作流

```typescript
import { workflowApi } from '@/api/workflow'

const createWorkflow = async () => {
  try {
    const res = await workflowApi.create({
      name: '我的视频项目',
      input_type: 'novel',
      input_content: '小说内容...'
    })
    console.log('工作流创建成功', res.data.workflow_id)
  } catch (error) {
    console.error('创建工作流失败', error)
  }
}
```

### 5.2 上传文件

```typescript
import { scriptApi } from '@/api/script'

const uploadFile = async (file: File, workflowId: string) => {
  try {
    const res = await scriptApi.upload(
      file,
      workflowId,
      (progress) => {
        console.log(`上传进度: ${progress}%`)
      }
    )
    console.log('文件上传成功', res.data.file_url)
  } catch (error) {
    console.error('文件上传失败', error)
  }
}
```

### 5.3 轮询查询进度

```typescript
import { workflowApi } from '@/api/workflow'

const pollProgress = (workflowId: string) => {
  const interval = setInterval(async () => {
    try {
      const res = await workflowApi.getProgress(workflowId)
      console.log('进度更新', res.data.overall_progress)
      
      if (res.data.overall_progress >= 1.0) {
        clearInterval(interval)
      }
    } catch (error) {
      console.error('查询进度失败', error)
      clearInterval(interval)
    }
  }, 3000) // 每3秒查询一次
  
  return interval
}
```
