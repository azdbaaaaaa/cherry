import request from './client'

export interface Workflow {
  id: string
  name: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  current_stage: 'script' | 'asset' | 'storyboard' | 'animatic' | 'video' | 'edit' | '' // 允许空字符串表示未开始
  progress: number
  narration_type: 'narration' | 'dialogue' // 旁白类型：narration（旁白/解说）或 dialogue（真人对话）
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface CreateWorkflowRequest {
  name: string
  input_type: 'text' | 'file'
  resource_id?: string // file 模式下必填
  text_content?: string // text 模式下必填
  resource_source?: 'existing' | 'new' // 可选，预留字段
  narration_type: 'narration' | 'dialogue' // 旁白类型：narration（旁白/解说）或 dialogue（真人对话）
}

export interface WorkflowListResponse {
  workflows: Workflow[]
  total: number
  page: number
  page_size: number
}

export const workflowApi = {
  create(data: CreateWorkflowRequest) {
    return request.post<{ workflow_id: string; status: string; created_at: string }>(
      '/api/v1/workflow',
      data
    )
  },
  
  get(id: string) {
    return request.get<Workflow>(`/api/v1/workflow/${id}`)
  },
  
  list(params?: { page?: number; page_size?: number; status?: string }) {
    return request.get<WorkflowListResponse>('/api/v1/workflow', { params })
  },
  
  pause(id: string) {
    return request.post(`/api/v1/workflow/${id}/pause`)
  },
  
  resume(id: string) {
    return request.post(`/api/v1/workflow/${id}/resume`)
  },
  
  cancel(id: string) {
    return request.post(`/api/v1/workflow/${id}/cancel`)
  },
  
  start(id: string) {
    return request.post(`/api/v1/workflow/${id}/start`)
  },
  
  getProgress(id: string) {
    return request.get<{ overall_progress: number; current_stage: string; stage_progress: number }>(
      `/api/v1/workflow/${id}/progress`
    )
  }
}
