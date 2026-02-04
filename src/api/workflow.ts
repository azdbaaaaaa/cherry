import request from './client'

export interface Workflow {
  id: string
  name: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  current_stage: 'script' | 'asset' | 'storyboard' | 'animatic' | 'video' | 'edit'
  progress: number
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
  
  getProgress(id: string) {
    return request.get<{ overall_progress: number; current_stage: string; stage_progress: number }>(
      `/api/v1/workflow/${id}/progress`
    )
  }
}
