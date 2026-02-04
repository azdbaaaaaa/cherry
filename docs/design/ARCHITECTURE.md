# Cherry 前端架构设计文档

## 1. 项目概述

Cherry 是 AI视频生成工作流系统的前端应用，提供用户友好的界面来创建、管理和监控视频生成工作流。

## 2. 技术架构

### 2.1 技术选型

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.4+ | 核心框架 |
| TypeScript | 5+ | 类型安全 |
| Vite | 5+ | 构建工具 |
| Pinia | 2+ | 状态管理 |
| Vue Router | 4+ | 路由管理 |
| Element Plus | 2.4+ | UI组件库 |
| Axios | 1.6+ | HTTP客户端 |
| VueUse | 10+ | 组合式工具库 |

### 2.2 项目结构

```
src/
├── api/                      # API接口层
│   ├── workflow.ts          # 工作流API
│   ├── script.ts            # 剧本API
│   ├── asset.ts             # 资产API
│   ├── storyboard.ts        # 分镜API
│   ├── animatic.ts          # 动态分镜API
│   ├── video.ts             # 视频API
│   ├── edit.ts              # 剪辑API
│   ├── client.ts            # Axios实例
│   └── types.ts             # API类型定义
│
├── components/              # 组件层
│   ├── common/              # 通用组件
│   │   ├── FileUpload.vue
│   │   ├── ProgressBar.vue
│   │   ├── StatusBadge.vue
│   │   └── ImagePreview.vue
│   ├── workflow/             # 工作流相关组件
│   │   ├── WorkflowCard.vue
│   │   ├── WorkflowProgress.vue
│   │   ├── StageIndicator.vue
│   │   └── WorkflowActions.vue
│   ├── script/              # 剧本相关组件
│   │   ├── ScriptInput.vue
│   │   └── ScriptPreview.vue
│   ├── asset/               # 资产相关组件
│   │   ├── AssetList.vue
│   │   ├── AssetCard.vue
│   │   └── AssetDesigner.vue
│   ├── storyboard/          # 分镜相关组件
│   │   ├── StoryboardGrid.vue
│   │   ├── ShotEditor.vue
│   │   └── ShotPreview.vue
│   └── video/               # 视频相关组件
│       ├── VideoPlayer.vue
│       └── VideoProgress.vue
│
├── views/                   # 页面视图层
│   ├── Home.vue            # 首页
│   ├── Workflow/           # 工作流页面
│   │   ├── List.vue       # 工作流列表
│   │   ├── Create.vue     # 创建工作流
│   │   └── Detail.vue     # 工作流详情
│   ├── Script/             # 剧本页面
│   ├── Asset/              # 资产页面
│   ├── Storyboard/         # 分镜页面
│   ├── Video/              # 视频页面
│   └── Settings/           # 设置页面
│
├── stores/                 # 状态管理 (Pinia)
│   ├── workflow.ts        # 工作流状态
│   ├── user.ts            # 用户状态
│   └── app.ts             # 应用状态
│
├── router/                 # 路由配置
│   ├── index.ts
│   └── guards.ts          # 路由守卫
│
├── utils/                  # 工具函数
│   ├── request.ts         # 请求封装
│   ├── format.ts          # 格式化工具
│   ├── validate.ts        # 验证工具
│   └── constants.ts      # 常量定义
│
├── types/                  # 类型定义
│   ├── workflow.ts
│   ├── api.ts
│   └── common.ts
│
├── assets/                 # 静态资源
│   ├── images/
│   ├── styles/
│   └── fonts/
│
├── App.vue                # 根组件
└── main.ts                # 入口文件
```

## 3. 核心模块设计

### 3.1 API层设计

**职责**:
- 封装所有后端API调用
- 统一错误处理
- 请求/响应拦截
- 类型定义

**示例**:

```typescript
// api/workflow.ts
import { request } from './client'
import type { Workflow, CreateWorkflowRequest } from '../types/workflow'

export const workflowApi = {
  // 创建工作流
  create(data: CreateWorkflowRequest) {
    return request.post<Workflow>('/api/v1/workflow', data)
  },
  
  // 查询工作流
  get(id: string) {
    return request.get<Workflow>(`/api/v1/workflow/${id}`)
  },
  
  // 查询列表
  list(params: { page?: number; page_size?: number }) {
    return request.get<WorkflowListResponse>('/api/v1/workflow', { params })
  }
}
```

### 3.2 状态管理设计

**使用Pinia进行状态管理**:

```typescript
// stores/workflow.ts
import { defineStore } from 'pinia'
import { workflowApi } from '@/api/workflow'
import type { Workflow } from '@/types/workflow'

export const useWorkflowStore = defineStore('workflow', {
  state: () => ({
    workflows: [] as Workflow[],
    currentWorkflow: null as Workflow | null,
    loading: false
  }),
  
  actions: {
    async fetchWorkflows() {
      this.loading = true
      try {
        const res = await workflowApi.list({ page: 1, page_size: 20 })
        this.workflows = res.data.workflows
      } finally {
        this.loading = false
      }
    },
    
    async createWorkflow(data: CreateWorkflowRequest) {
      const res = await workflowApi.create(data)
      this.workflows.unshift(res.data)
      return res.data
    }
  }
})
```

### 3.3 路由设计

```typescript
// router/index.ts
const routes = [
  {
    path: '/',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/workflow',
    children: [
      {
        path: '',
        component: () => import('@/views/Workflow/List.vue')
      },
      {
        path: 'create',
        component: () => import('@/views/Workflow/Create.vue')
      },
      {
        path: ':id',
        component: () => import('@/views/Workflow/Detail.vue')
      }
    ]
  }
]
```

## 4. 核心功能模块

### 4.1 工作流管理

**功能**:
- 创建工作流
- 查看工作流列表
- 查看工作流详情和进度
- 暂停/恢复/取消工作流

**关键组件**:
- `WorkflowCard`: 工作流卡片
- `WorkflowProgress`: 进度显示
- `StageIndicator`: 阶段指示器

### 4.2 剧本生成

**功能**:
- 上传输入文件（小说、Word、PDF）
- 查看剧本生成进度
- 预览生成的剧本和分镜脚本

**关键组件**:
- `ScriptInput`: 输入组件
- `ScriptPreview`: 预览组件

### 4.3 资产设计

**功能**:
- 查看提取的资产列表
- 上传参考图
- 查看生成的设计图
- 重新生成设计图

**关键组件**:
- `AssetList`: 资产列表
- `AssetCard`: 资产卡片
- `AssetDesigner`: 资产设计器

### 4.4 分镜生成

**功能**:
- 查看分镜网格
- 编辑分镜提示词
- 预览分镜图
- 重新生成分镜

**关键组件**:
- `StoryboardGrid`: 分镜网格
- `ShotEditor`: 分镜编辑器
- `ShotPreview`: 分镜预览

### 4.5 视频生成与剪辑

**功能**:
- 查看视频生成进度
- 预览视频片段
- 添加背景音乐
- 下载最终视频

**关键组件**:
- `VideoPlayer`: 视频播放器
- `VideoProgress`: 进度显示

## 5. 实时更新设计

### 5.1 WebSocket集成

使用WebSocket实时接收工作流进度更新：

```typescript
// utils/websocket.ts
export function connectWorkflowWS(workflowId: string) {
  const ws = new WebSocket(`ws://api.example.com/api/v1/workflow/${workflowId}/ws`)
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    // 处理进度更新
    if (data.type === 'progress') {
      // 更新状态
    }
  }
  
  return ws
}
```

### 5.2 轮询方案（备选）

如果WebSocket不可用，使用轮询：

```typescript
// utils/polling.ts
export function pollWorkflowStatus(workflowId: string, interval = 3000) {
  return setInterval(async () => {
    const res = await workflowApi.get(workflowId)
    // 更新状态
  }, interval)
}
```

## 6. 文件上传设计

### 6.1 大文件上传

支持分片上传和进度显示：

```typescript
// utils/upload.ts
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
) {
  const chunkSize = 2 * 1024 * 1024 // 2MB
  const chunks = Math.ceil(file.size / chunkSize)
  
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)
    
    // 上传分片
    await uploadChunk(chunk, i, chunks)
    
    // 更新进度
    onProgress?.(Math.round(((i + 1) / chunks) * 100))
  }
}
```

## 7. 错误处理

### 7.1 全局错误处理

```typescript
// utils/request.ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 跳转到登录页
      router.push('/login')
    } else if (error.response?.status === 403) {
      // 显示权限错误
      ElMessage.error('无权限访问')
    }
    return Promise.reject(error)
  }
)
```

### 7.2 组件级错误处理

使用ErrorBoundary或try-catch处理组件错误。

## 8. 性能优化

### 8.1 代码分割

使用动态导入实现路由级别的代码分割：

```typescript
const WorkflowDetail = () => import('@/views/Workflow/Detail.vue')
```

### 8.2 图片懒加载

使用VueUse的`useIntersectionObserver`实现图片懒加载。

### 8.3 虚拟滚动

对于长列表使用虚拟滚动（如`vue-virtual-scroller`）。

### 8.4 缓存策略

- API响应缓存（使用SWR模式）
- 图片缓存
- 路由缓存

## 9. 响应式设计

### 9.1 断点定义

```typescript
// utils/constants.ts
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}
```

### 9.2 移动端适配

- 使用Element Plus的响应式布局
- 移动端优化交互
- 触摸手势支持

## 10. 开发规范

### 10.1 命名规范

- 组件: PascalCase (`WorkflowCard.vue`)
- 文件/目录: kebab-case (`workflow-card.vue`)
- 变量/函数: camelCase (`getWorkflow`)
- 常量: UPPER_SNAKE_CASE (`API_BASE_URL`)

### 10.2 代码组织

- 一个组件一个文件
- 组合式API优先
- TypeScript严格模式
- 组件props和emits必须定义类型

### 10.3 提交规范

遵循Conventional Commits:
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `perf`: 性能优化
