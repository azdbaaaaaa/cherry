export interface Workflow {
  id: string
  name: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  current_stage: 'script' | 'asset' | 'storyboard' | 'animatic' | 'video' | 'edit' | '' // 允许空字符串表示未开始
  progress: number
  narration_type: 'narration' | 'dialogue' // 旁白类型：narration（旁白/解说）或 dialogue（真人对话）
  style: 'anime' | 'live' | 'mixed' // 风格：anime（漫剧）、live（真人剧）、mixed（混合）
  error_message?: string // 错误信息（失败时）
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
  style: 'anime' | 'live' | 'mixed' // 风格：anime（漫剧）、live（真人剧）、mixed（混合）
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
