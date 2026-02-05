<template>
  <div class="novel-list">
    <!-- 顶部导航栏 -->
    <header class="page-header glass">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon><Document /></el-icon>
            小说管理
          </h1>
          <p class="page-subtitle">管理和查看您的小说作品</p>
        </div>
        <el-button
          type="primary"
          size="large"
          @click="goToUpload"
          class="create-button"
        >
          <el-icon><Plus /></el-icon>
          上传新小说
        </el-button>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="page-main">
      <div class="container">
        <!-- 筛选栏 -->
        <div class="filter-bar glass">
          <el-input
            v-model="searchQuery"
            placeholder="搜索小说名称..."
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
            <el-option label="已上传" value="uploaded" />
            <el-option label="已创建" value="created" />
            <el-option label="已切分" value="split" />
          </el-select>
        </div>

        <!-- 小说列表 -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>

        <el-empty
          v-else-if="filteredNovels.length === 0"
          description="暂无小说"
          :image-size="200"
        >
          <el-button type="primary" @click="goToUpload">上传新小说</el-button>
        </el-empty>

        <div v-else class="novels-grid">
          <div
            v-for="novel in filteredNovels"
            :key="novel.id"
            class="novel-card glass fade-in"
            @click="goToDetail(novel.id)"
          >
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="card-title-section">
                <h3 class="card-title">{{ novel.title || '未命名小说' }}</h3>
                <el-tag
                  :type="getStatusType(novel)"
                  size="large"
                  effect="dark"
                  class="status-tag"
                >
                  {{ getStatusText(novel) }}
                </el-tag>
              </div>
              <el-icon class="card-arrow"><ArrowRight /></el-icon>
            </div>

            <!-- 详细信息 -->
            <div class="card-info">
              <div class="info-item">
                <el-icon><Document /></el-icon>
                <span>资源ID: {{ novel.resource_id.substring(0, 8) }}...</span>
              </div>
              <div class="info-item">
                <el-icon><Clock /></el-icon>
                <span>{{ formatTime(novel.created_at) }}</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="card-actions" @click.stop>
              <el-button
                size="small"
                type="primary"
                @click.stop="goToDetail(novel.id)"
              >
                查看详情
              </el-button>
              <el-button
                size="small"
                @click.stop="handleDelete(novel.id)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  Document,
  ArrowRight,
  Clock
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { novelApi } from '@/api/novel'
import type { Novel } from '@/types/novel'

const router = useRouter()
const loading = ref(false)
const novels = ref<Novel[]>([])
const searchQuery = ref('')
const statusFilter = ref('')

// 从本地存储获取小说列表（临时方案，等后端接口）
const loadNovelsFromStorage = () => {
  try {
    const saved = localStorage.getItem('novels_list')
    if (saved) {
      novels.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载小说列表失败:', error)
  }
}

// 保存小说列表到本地存储（临时方案）
const saveNovelsToStorage = () => {
  try {
    localStorage.setItem('novels_list', JSON.stringify(novels.value))
  } catch (error) {
    console.error('保存小说列表失败:', error)
  }
}

// 获取小说列表（TODO: 等后端接口准备好后实现）
const fetchNovels = async () => {
  loading.value = true
  try {
    // TODO: 调用后端接口获取小说列表
    // const res = await novelApi.list({ page: 1, page_size: 100 })
    // novels.value = res.data.novels
    
    // 临时方案：从本地存储加载
    loadNovelsFromStorage()
    
    // 如果没有数据，显示提示
    if (novels.value.length === 0) {
      ElMessage.info('暂无小说数据，请先上传小说')
    }
  } catch (error) {
    ElMessage.error('获取小说列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 过滤小说列表
const filteredNovels = computed(() => {
  let result = novels.value

  // 搜索过滤
  if (searchQuery.value) {
    result = result.filter((n) =>
      (n.title || '未命名小说').toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // 状态过滤（临时实现，基于是否有章节来判断）
  if (statusFilter.value) {
    // TODO: 等后端接口准备好后，使用实际的状态字段
    result = result.filter((n) => {
      // 临时判断逻辑
      return true
    })
  }

  return result
})

// 获取状态类型
const getStatusType = (novel: Novel): string => {
  // TODO: 等后端接口准备好后，使用实际的状态字段
  return 'success'
}

// 获取状态文本
const getStatusText = (novel: Novel): string => {
  // TODO: 等后端接口准备好后，使用实际的状态字段
  return '已创建'
}

// 格式化时间
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

// 前往上传页面
const goToUpload = () => {
  router.push('/novel/upload')
}

// 前往详情页
const goToDetail = (novelId: string) => {
  router.push(`/novel/${novelId}`)
}

// 删除小说
const handleDelete = async (novelId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这本小说吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // TODO: 调用后端接口删除小说
    // await novelApi.deleteNovel(novelId)
    
    // 临时方案：从本地存储删除
    novels.value = novels.value.filter(n => n.id !== novelId)
    saveNovelsToStorage()
    
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消
  }
}

onMounted(() => {
  fetchNovels()
  
  // 监听上传页面完成后的消息（如果从上传页面跳转回来）
  window.addEventListener('storage', (e) => {
    if (e.key === 'novel_created') {
      // 重新加载列表
      fetchNovels()
    }
  })
})
</script>

<style scoped>
.novel-list {
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
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
}

.page-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

.create-button {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1rem;
  height: auto;
}

/* 主要内容 */
.page-main {
  padding: var(--spacing-xl) 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.filter-select {
  width: 200px;
}

/* 加载状态 */
.loading-container {
  padding: var(--spacing-xl);
}

/* 小说网格 */
.novels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-xl);
}

/* 小说卡片 */
.novel-card {
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  border: 1px solid var(--border-color);
}

.novel-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
}

.card-title-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  word-break: break-word;
}

.status-tag {
  align-self: flex-start;
}

.card-arrow {
  font-size: 1.5rem;
  color: var(--text-tertiary);
  transition: transform var(--transition-base);
}

.novel-card:hover .card-arrow {
  transform: translateX(4px);
  color: var(--primary-color);
}

/* 卡片信息 */
.card-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.info-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.info-item .el-icon {
  font-size: 1rem;
}

/* 操作按钮 */
.card-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

/* 动画 */
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .novels-grid {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .filter-bar {
    flex-direction: column;
  }

  .search-input,
  .filter-select {
    width: 100%;
    max-width: none;
  }
}
</style>

