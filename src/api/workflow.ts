import request from './client'
import type { Workflow, CreateWorkflowRequest } from '@/types/workflow'

// 重新导出类型，保持向后兼容
export type { Workflow, CreateWorkflowRequest }

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
