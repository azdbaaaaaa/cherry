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
