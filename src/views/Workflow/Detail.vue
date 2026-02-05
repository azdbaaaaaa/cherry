<template>
  <div class="workflow-detail">
    <!-- 顶部导航栏 -->
    <header class="page-header glass">
      <div class="header-content">
        <div class="header-left">
          <el-button
            text
            @click="goBack"
            class="back-button"
          >
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <h1 class="page-title">{{ workflow?.name || '工作流详情' }}</h1>
        </div>
        <div class="header-actions">
          <el-button
            v-if="workflow?.status === 'pending'"
            type="primary"
            @click="startWorkflow"
            :loading="actionLoading"
          >
            <el-icon><VideoPlay /></el-icon>
            开始
          </el-button>
          <el-button
            v-if="workflow?.status === 'running'"
            @click="pauseWorkflow"
            :loading="actionLoading"
          >
            暂停
          </el-button>
          <el-button
            v-if="workflow?.status === 'paused'"
            type="primary"
            @click="resumeWorkflow"
            :loading="actionLoading"
          >
            恢复
          </el-button>
          <el-button
            v-if="['running', 'paused'].includes(workflow?.status || '')"
            type="danger"
            @click="cancelWorkflow"
            :loading="actionLoading"
          >
            取消
          </el-button>
        </div>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="page-main">
      <div class="content-container">
        <!-- 加载状态 -->
        <el-card v-if="loading" class="content-card glass">
          <el-skeleton :rows="5" animated />
        </el-card>
        
        <!-- 工作流详情 -->
        <template v-else-if="workflow">
          <!-- 状态和进度 -->
          <el-card class="content-card glass status-card">
            <template #header>
              <div class="card-header">
                <h2 class="card-title">工作流状态</h2>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(workflow.status)" size="large">
                  {{ getStatusLabel(workflow.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="当前阶段">
                {{ getStageLabel(workflow.current_stage) || '未开始' }}
              </el-descriptions-item>
              <el-descriptions-item label="进度" :span="2">
                <el-progress 
                  :percentage="Math.round(workflow.progress * 100)" 
                  :status="getProgressStatus(workflow.status)"
                  :stroke-width="12"
                />
                <div class="progress-text">
                  {{ Math.round(workflow.progress * 100) }}%
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="旁白类型">
                {{ workflow.narration_type === 'narration' ? '旁白/解说' : '真人对话' }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatTime(workflow.created_at) }}
              </el-descriptions-item>
              <el-descriptions-item label="更新时间" :span="2">
                {{ formatTime(workflow.updated_at) }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
          
          <!-- 阶段详情 -->
          <el-card class="content-card glass stages-card">
            <template #header>
              <div class="card-header">
                <h2 class="card-title">阶段详情</h2>
              </div>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="stage in stages"
                :key="stage.name"
                :timestamp="stage.timestamp"
                :type="stage.type"
                :icon="stage.icon"
                placement="top"
              >
                <div class="timeline-content">
                  <h4 class="stage-title">{{ stage.label }}</h4>
                  <p class="stage-status" v-if="stage.status">{{ stage.status }}</p>
                  <p class="stage-description" v-if="stage.description">{{ stage.description }}</p>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </template>

        <!-- 错误状态 -->
        <el-card v-else class="content-card glass">
          <el-empty description="工作流不存在或加载失败" />
        </el-card>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CircleCheck, Clock, Loading, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { workflowApi } from '@/api/workflow'
import type { Workflow } from '@/types/workflow'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const actionLoading = ref(false)
const workflow = ref<Workflow | null>(null)
const pollInterval = ref<number | null>(null)

const workflowId = computed(() => route.params.id as string)

const fetchWorkflow = async () => {
  try {
    const res = await workflowApi.get(workflowId.value)
    workflow.value = res.data
  } catch (error) {
    ElMessage.error('获取工作流详情失败')
    console.error(error)
  }
}

const startPolling = () => {
  pollInterval.value = window.setInterval(() => {
    fetchWorkflow()
  }, 3000) // 每3秒轮询一次
}

const stopPolling = () => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = null
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'info',
    running: 'success',
    paused: 'warning',
    completed: 'success',
    failed: 'danger',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    running: '运行中',
    paused: '已暂停',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getStageLabel = (stage: string) => {
  if (!stage) return '未开始'
  const map: Record<string, string> = {
    script: '剧本生成',
    asset: '资产设计',
    storyboard: '分镜生成',
    animatic: '动态分镜',
    video: '视频生成',
    edit: '视频剪辑'
  }
  return map[stage] || stage
}

const getProgressStatus = (status: string) => {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'exception'
  if (status === 'running') return undefined
  return undefined
}

const formatTime = (time: string) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const stages = computed(() => {
  if (!workflow.value) return []
  
  const stageNames = ['script', 'asset', 'storyboard', 'animatic', 'video', 'edit']
  const stageLabels = ['剧本生成', '资产设计', '分镜生成', '动态分镜', '视频生成', '视频剪辑']
  const stageDescriptions: Record<string, string> = {
    script: '生成小说章节和解说文案',
    asset: '生成音频、字幕、图片等素材',
    storyboard: '生成场景和镜头分镜',
    animatic: '生成动态分镜预览',
    video: '生成各个场景的视频片段',
    edit: '合并所有视频片段为最终视频'
  }
  
  // 如果 current_stage 为空字符串，表示工作流还未开始
  const currentStage = workflow.value.current_stage || ''
  const currentStageIndex = currentStage ? stageNames.indexOf(currentStage) : -1
  
  return stageNames.map((name, index) => {
    // 如果 current_stage 为空，所有阶段都是待处理
    if (currentStageIndex === -1) {
      return {
        name,
        label: stageLabels[index],
        status: '待处理',
        description: stageDescriptions[name],
        type: 'info' as const,
        icon: Clock,
        timestamp: ''
      }
    }
    
    const isCompleted = currentStageIndex > index
    const isCurrent = currentStage === name
    
    let type: 'success' | 'primary' | 'warning' | 'info' = 'info'
    let icon = Clock
    let status = '待处理'
    
    if (isCompleted) {
      type = 'success'
      icon = CircleCheck
      status = '已完成'
    } else if (isCurrent) {
      type = 'primary'
      icon = Loading
      status = '进行中'
    }
    
    return {
      name,
      label: stageLabels[index],
      status,
      description: stageDescriptions[name],
      type,
      icon,
      timestamp: isCompleted ? '已完成' : isCurrent ? '进行中' : ''
    }
  })
})

const pauseWorkflow = async () => {
  actionLoading.value = true
  try {
    await workflowApi.pause(workflowId.value)
    ElMessage.success('工作流已暂停')
    await fetchWorkflow()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '暂停工作流失败')
  } finally {
    actionLoading.value = false
  }
}

const resumeWorkflow = async () => {
  actionLoading.value = true
  try {
    await workflowApi.resume(workflowId.value)
    ElMessage.success('工作流已恢复')
    await fetchWorkflow()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '恢复工作流失败')
  } finally {
    actionLoading.value = false
  }
}

const startWorkflow = async () => {
  actionLoading.value = true
  try {
    await workflowApi.start(workflowId.value)
    ElMessage.success('工作流已启动，正在处理中...')
    await fetchWorkflow()
    // 如果工作流状态变为 running，开始轮询
    if (workflow.value?.status === 'running') {
      startPolling()
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '启动工作流失败')
  } finally {
    actionLoading.value = false
  }
}

const cancelWorkflow = async () => {
  try {
    await ElMessageBox.confirm('确定要取消这个工作流吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    actionLoading.value = true
    try {
      await workflowApi.cancel(workflowId.value)
      ElMessage.success('工作流已取消')
      router.push('/workflow')
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '取消工作流失败')
    } finally {
      actionLoading.value = false
    }
  } catch (error) {
    // 用户取消确认对话框
  }
}

const goBack = () => {
  router.back()
}

onMounted(async () => {
  loading.value = true
  await fetchWorkflow()
  loading.value = false
  
  // 如果工作流还在运行，开始轮询
  if (workflow.value?.status === 'running') {
    startPolling()
  }
  
  // 如果工作流是 pending 状态，停止轮询（如果有的话）
  if (workflow.value?.status === 'pending') {
    stopPolling()
  }
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.workflow-detail {
  width: 100%;
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* 顶部导航栏 */
.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-xl);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}

.back-button {
  font-size: 1rem;
  color: var(--text-secondary);
}

.back-button:hover {
  color: var(--primary-color);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* 主要内容 */
.page-main {
  padding: var(--spacing-xl) 0;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.content-card {
  margin-bottom: var(--spacing-xl);
  border-radius: var(--border-radius-xl);
}

.card-header {
  text-align: left;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* 状态卡片 */
.status-card :deep(.el-descriptions__label) {
  font-weight: 600;
  color: var(--text-primary);
}

.status-card :deep(.el-descriptions__content) {
  color: var(--text-secondary);
}

.progress-text {
  margin-top: var(--spacing-xs);
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-align: center;
}

/* 阶段卡片 */
.stages-card :deep(.el-timeline) {
  padding-left: var(--spacing-md);
}

.timeline-content {
  padding-left: var(--spacing-sm);
}

.stage-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.stage-status {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: var(--spacing-xs) 0;
}

.stage-description {
  font-size: 0.85rem;
  color: var(--text-tertiary);
  margin: var(--spacing-xs) 0 0 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .header-actions .el-button {
    flex: 1;
  }

  .content-container {
    padding: 0 var(--spacing-md);
  }
}
</style>
