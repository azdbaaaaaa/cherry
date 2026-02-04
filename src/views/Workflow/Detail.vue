<template>
  <div class="workflow-detail">
    <el-container>
      <el-header>
        <div class="header-content">
          <h2>{{ workflow?.name || '工作流详情' }}</h2>
          <div class="actions">
            <el-button
              v-if="workflow?.status === 'running'"
              @click="pauseWorkflow"
            >
              暂停
            </el-button>
            <el-button
              v-if="workflow?.status === 'paused'"
              type="primary"
              @click="resumeWorkflow"
            >
              恢复
            </el-button>
            <el-button
              v-if="['running', 'paused'].includes(workflow?.status || '')"
              type="danger"
              @click="cancelWorkflow"
            >
              取消
            </el-button>
          </div>
        </div>
      </el-header>
      <el-main>
        <el-card v-if="loading">
          <el-skeleton :rows="5" animated />
        </el-card>
        
        <div v-else-if="workflow">
          <!-- 状态和进度 -->
          <el-card class="status-card">
            <el-descriptions title="工作流状态" :column="2">
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(workflow.status)">
                  {{ workflow.status }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="当前阶段">
                {{ workflow.current_stage }}
              </el-descriptions-item>
              <el-descriptions-item label="进度" :span="2">
                <el-progress :percentage="workflow.progress * 100" />
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
          
          <!-- 阶段详情 -->
          <el-card class="stages-card">
            <template #header>
              <span>阶段详情</span>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="stage in stages"
                :key="stage.name"
                :timestamp="stage.timestamp"
                :type="stage.type"
              >
                <h4>{{ stage.label }}</h4>
                <p v-if="stage.status">{{ stage.status }}</p>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { workflowApi } from '@/api/workflow'
import type { Workflow } from '@/types/workflow'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
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

const stages = computed(() => {
  if (!workflow.value) return []
  
  const stageNames = ['script', 'asset', 'storyboard', 'animatic', 'video', 'edit']
  const stageLabels = ['剧本生成', '资产设计', '分镜生成', '动态分镜', '视频生成', '视频剪辑']
  
  return stageNames.map((name, index) => {
    const isCompleted = workflow.value!.current_stage !== name &&
      stageNames.indexOf(workflow.value!.current_stage) > index
    const isCurrent = workflow.value!.current_stage === name
    
    return {
      name,
      label: stageLabels[index],
      status: isCurrent ? '进行中' : isCompleted ? '已完成' : '待处理',
      type: isCompleted ? 'success' : isCurrent ? 'primary' : 'info',
      timestamp: ''
    }
  })
})

const pauseWorkflow = async () => {
  try {
    await workflowApi.pause(workflowId.value)
    ElMessage.success('工作流已暂停')
    await fetchWorkflow()
  } catch (error) {
    ElMessage.error('暂停工作流失败')
  }
}

const resumeWorkflow = async () => {
  try {
    await workflowApi.resume(workflowId.value)
    ElMessage.success('工作流已恢复')
    await fetchWorkflow()
  } catch (error) {
    ElMessage.error('恢复工作流失败')
  }
}

const cancelWorkflow = async () => {
  try {
    await ElMessageBox.confirm('确定要取消这个工作流吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await workflowApi.cancel(workflowId.value)
    ElMessage.success('工作流已取消')
    router.push('/workflow')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消工作流失败')
    }
  }
}

onMounted(async () => {
  loading.value = true
  await fetchWorkflow()
  loading.value = false
  
  // 如果工作流还在运行，开始轮询
  if (workflow.value?.status === 'running') {
    startPolling()
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
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.el-header {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.el-main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.status-card,
.stages-card {
  margin-bottom: 20px;
}
</style>
