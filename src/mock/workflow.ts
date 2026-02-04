import { MockMethod } from 'vite-plugin-mock'

// Mock 工作流数据
let mockWorkflows: any[] = [
  {
    id: '1',
    name: '测试工作流1',
    status: 'running',
    current_stage: 'script',
    progress: 0.3,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:30:00Z'
  },
  {
    id: '2',
    name: '测试工作流2',
    status: 'completed',
    current_stage: 'edit',
    progress: 1.0,
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    completed_at: '2024-01-01T12:00:00Z'
  },
  {
    id: '3',
    name: '测试工作流3',
    status: 'pending',
    current_stage: 'script',
    progress: 0,
    created_at: '2024-01-01T11:00:00Z',
    updated_at: '2024-01-01T11:00:00Z'
  }
]

export default [
  // 创建工作流
  {
    url: '/api/v1/workflow',
    method: 'post',
    response: ({ body }: { body: any }) => {
      const { name, input_type, input_content, options } = body

      const newWorkflow = {
        id: String(mockWorkflows.length + 1),
        name: name || `工作流_${Date.now()}`,
        status: 'pending',
        current_stage: 'script',
        progress: 0,
        input_type,
        input_content,
        options,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockWorkflows.push(newWorkflow)

      return {
        code: 0,
        message: 'success',
        data: {
          workflow_id: newWorkflow.id,
          status: newWorkflow.status,
          created_at: newWorkflow.created_at
        }
      }
    }
  },

  // 获取工作流详情 - 支持路径参数和query参数两种方式
  {
    url: '/api/v1/workflow/:id',
    method: 'get',
    response: ({ url, query }: { url: string; query: any }) => {
      // 优先从路径参数获取，如果没有则从query获取
      const id = url.split('/').pop() || query.id
      if (!id) {
        return {
          code: 40001,
          message: 'id参数必需',
          data: null
        }
      }
      const workflow = mockWorkflows.find(w => w.id === id)

      if (!workflow) {
        return {
          code: 40401,
          message: '工作流不存在',
          data: null
        }
      }

      return {
        code: 0,
        message: 'success',
        data: workflow
      }
    }
  },

  // 获取工作流列表
  {
    url: '/api/v1/workflow',
    method: 'get',
    response: ({ query }: { query: any }) => {
      const { page = 1, page_size = 20, status } = query
      const pageNum = Number(page)
      const pageSize = Number(page_size)

      // 过滤
      let filtered = mockWorkflows
      if (status) {
        filtered = filtered.filter(w => w.status === status)
      }

      // 分页
      const start = (pageNum - 1) * pageSize
      const end = start + pageSize
      const workflows = filtered.slice(start, end)

      return {
        code: 0,
        message: 'success',
        data: {
          workflows,
          total: filtered.length,
          page: pageNum,
          page_size: pageSize
        }
      }
    }
  },

  // 暂停工作流 - 支持路径参数和body参数两种方式
  {
    url: '/api/v1/workflow/:id/pause',
    method: 'post',
    response: ({ url, body }: { url: string; body: any }) => {
      // 优先从路径参数获取，如果没有则从body获取
      const id = url.split('/').slice(-2, -1)[0] || body.id
      if (!id) {
        return {
          code: 40001,
          message: 'id参数必需',
          data: null
        }
      }
      const workflow = mockWorkflows.find(w => w.id === id)

      if (!workflow) {
        return {
          code: 40401,
          message: '工作流不存在',
          data: null
        }
      }

      if (workflow.status !== 'running') {
        return {
          code: 40001,
          message: '工作流状态不允许暂停',
          data: null
        }
      }

      workflow.status = 'paused'
      workflow.updated_at = new Date().toISOString()

      return {
        code: 0,
        message: '暂停成功',
        data: workflow
      }
    }
  },

  // 恢复工作流 - 支持路径参数和body参数两种方式
  {
    url: '/api/v1/workflow/:id/resume',
    method: 'post',
    response: ({ url, body }: { url: string; body: any }) => {
      // 优先从路径参数获取，如果没有则从body获取
      const id = url.split('/').slice(-2, -1)[0] || body.id
      if (!id) {
        return {
          code: 40001,
          message: 'id参数必需',
          data: null
        }
      }
      const workflow = mockWorkflows.find(w => w.id === id)

      if (!workflow) {
        return {
          code: 40401,
          message: '工作流不存在',
          data: null
        }
      }

      if (workflow.status !== 'paused') {
        return {
          code: 40001,
          message: '工作流状态不允许恢复',
          data: null
        }
      }

      workflow.status = 'running'
      workflow.updated_at = new Date().toISOString()

      return {
        code: 0,
        message: '恢复成功',
        data: workflow
      }
    }
  },

  // 取消工作流 - 支持路径参数和body参数两种方式
  {
    url: '/api/v1/workflow/:id/cancel',
    method: 'post',
    response: ({ url, body }: { url: string; body: any }) => {
      // 优先从路径参数获取，如果没有则从body获取
      const id = url.split('/').slice(-2, -1)[0] || body.id
      if (!id) {
        return {
          code: 40001,
          message: 'id参数必需',
          data: null
        }
      }
      const workflow = mockWorkflows.find(w => w.id === id)

      if (!workflow) {
        return {
          code: 40401,
          message: '工作流不存在',
          data: null
        }
      }

      if (['completed', 'failed', 'cancelled'].includes(workflow.status)) {
        return {
          code: 40001,
          message: '工作流状态不允许取消',
          data: null
        }
      }

      workflow.status = 'cancelled'
      workflow.updated_at = new Date().toISOString()

      return {
        code: 0,
        message: '取消成功',
        data: workflow
      }
    }
  },

  // 获取工作流进度 - 支持路径参数和query参数两种方式
  {
    url: '/api/v1/workflow/:id/progress',
    method: 'get',
    response: ({ url, query }: { url: string; query: any }) => {
      // 优先从路径参数获取，如果没有则从query获取
      const id = url.split('/').pop() || query.id
      if (!id) {
        return {
          code: 40001,
          message: 'id参数必需',
          data: null
        }
      }
      const workflow = mockWorkflows.find(w => w.id === id)

      if (!workflow) {
        return {
          code: 40401,
          message: '工作流不存在',
          data: null
        }
      }

      // 模拟进度更新
      if (workflow.status === 'running' && workflow.progress < 1.0) {
        workflow.progress = Math.min(workflow.progress + 0.1, 1.0)
        if (workflow.progress >= 1.0) {
          workflow.status = 'completed'
          workflow.completed_at = new Date().toISOString()
        }
      }

      const stages = ['script', 'asset', 'storyboard', 'animatic', 'video', 'edit']
      const currentStageIndex = stages.indexOf(workflow.current_stage)
      const stageProgress = workflow.progress - (currentStageIndex / stages.length)

      return {
        code: 0,
        message: 'success',
        data: {
          workflow_id: workflow.id,
          overall_progress: workflow.progress,
          current_stage: workflow.current_stage,
          stage_progress: Math.max(0, Math.min(1, stageProgress * stages.length)),
          stages: stages.map((stage, index) => ({
            stage,
            status: index < currentStageIndex ? 'completed' : 
                   index === currentStageIndex ? 'processing' : 'pending',
            progress: index < currentStageIndex ? 1.0 : 
                     index === currentStageIndex ? stageProgress * stages.length : 0.0
          }))
        }
      }
    }
  }
] as MockMethod[]
