<template>
  <div class="novel-list">
    <!-- 页面标题和操作 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">剧本列表</h1>
          <p class="page-subtitle">管理和监控您的AI视频生成剧本</p>
        </div>
        <el-button
          type="primary"
          size="large"
          @click="goToCreate"
        >
          <el-icon><Plus /></el-icon>
          创建新剧本
        </el-button>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="page-content">
      <div class="container">
        <!-- 筛选栏 -->
        <div class="filter-bar">
          <el-input
            v-model="searchQuery"
            placeholder="搜索剧本名称..."
            clearable
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select
            v-model="statusFilter"
            placeholder="筛选状态"
            clearable
            class="filter-select"
          >
            <el-option label="全部" value="" />
            <el-option label="待处理" value="pending" />
            <el-option label="运行中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="已暂停" value="paused" />
            <el-option label="已失败" value="failed" />
          </el-select>
        </div>

        <!-- 工作流列表 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>

        <el-empty
          v-else-if="filteredNovels.length === 0"
          description="暂无剧本"
          :image-size="200"
        >
          <el-button type="primary" @click="goToCreate">创建新剧本</el-button>
        </el-empty>

        <div v-else class="novels-grid">
          <div
            v-for="novel in filteredNovels"
            :key="novel.id"
            class="novel-card fade-in"
            @click="goToDetail(novel.id)"
          >
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="card-title-section">
                <h3 class="card-title">{{ novel.title || novel.id }}</h3>
                <el-tag
                  type="info"
                  size="large"
                  effect="dark"
                  class="status-tag"
                >
                  剧本
                </el-tag>
              </div>
              <el-icon class="card-arrow"><ArrowRight /></el-icon>
            </div>

            <!-- 详细信息 -->
            <div class="card-info">
              <div class="info-item">
                <el-icon><Clock /></el-icon>
                <span>{{ formatTime(novel.created_at) }}</span>
              </div>
              <div class="info-item">
                <el-icon><Document /></el-icon>
                <span>{{ novel.author || '未知作者' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  VideoPlay,
  ArrowRight,
  Clock,
  Document
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { novelApi } from '@/api/novel'
import type { Novel } from '@/types/novel'

const router = useRouter()
const loading = ref(false)
const novels = ref<Novel[]>([])
const searchQuery = ref('')
const statusFilter = ref('')

const filteredNovels = computed(() => {
  let result = novels.value

  if (searchQuery.value) {
    result = result.filter((n) =>
      (n.title || n.id).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // 状态筛选暂时不实现，因为 Novel 类型中没有 status 字段
  // if (statusFilter.value) {
  //   result = result.filter((n) => n.status === statusFilter.value)
  // }

  return result
})

const fetchNovels = async () => {
  loading.value = true
  try {
    const res = await novelApi.list({ page: 1, page_size: 100 })
    novels.value = res.data.novels
  } catch (error) {
    ElMessage.error('获取剧本列表失败')
    console.error(error)
  } finally {
    loading.value = false
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

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    running: '运行中',
    paused: '已暂停',
    completed: '已完成',
    failed: '已失败',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getStageText = (stage: string) => {
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

const getProgressColor = (progress: number) => {
  if (progress < 0.3) return '#3b82f6'
  if (progress < 0.7) return '#10b981'
  return '#6366f1'
}

const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

const goToCreate = () => {
  router.push('/novel/create')
}

const goToDetail = (id: string) => {
  router.push(`/novel/${id}`)
}

onMounted(() => {
  fetchNovels()
})
</script>

<style scoped>
.novel-list {
  width: 100%;
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* 顶部导航栏 - 创作平台风格 */
.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-xl);
  background: var(--bg-primary);
  /* 使用纯色背景，更专业 */
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.create-button {
  padding: var(--spacing-md) var(--spacing-xl);
  height: auto;
  font-size: 1rem;
}

/* 主要内容 */
.page-content {
  /* 内容区域样式已由布局组件处理 */
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

/* 筛选栏 - 创作平台风格 */
.filter-bar {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  /* 使用纯色背景，更专业 */
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.filter-select {
  width: 200px;
}

/* 工作流网格 */
.novels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: var(--spacing-xl);
}

/* 工作流卡片 - 创作平台风格：稳定、专业 */
.novel-card {
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  /* 使用纯色背景，更专业 */
}

.novel-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--primary-color);
  opacity: 0;
  transition: opacity var(--transition-fast);
  /* 移除 transform，使用 opacity */
}

.novel-card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
  /* 移除 transform，保持位置稳定 */
}

.novel-card:hover::before {
  opacity: 1;
  /* 只改变透明度，不改变位置 */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
}

.card-title-section {
  flex: 1;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
  line-height: 1.4;
}

.status-tag {
  font-weight: 500;
}

.card-arrow {
  color: var(--text-tertiary);
  font-size: 1.5rem;
  transition: color var(--transition-fast);
  /* 移除 transform，保持位置稳定 */
}

.novel-card:hover .card-arrow {
  color: var(--primary-color);
  /* 只改变颜色，不改变位置 */
}

/* 进度条 */
.progress-section {
  margin-bottom: var(--spacing-lg);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  font-size: 0.9rem;
}

.progress-label {
  color: var(--text-secondary);
}

.progress-value {
  color: var(--text-primary);
  font-weight: 600;
}

/* 卡片信息 */
.card-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.info-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.info-item .el-icon {
  color: var(--primary-color);
}

/* 操作按钮 */
.card-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .create-button {
    width: 100%;
  }

  .novels-grid {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    flex-direction: column;
  }

  .search-input,
  .filter-select {
    max-width: 100%;
    width: 100%;
  }
}
</style>
