<template>
  <div class="novel-detail">
    <!-- 页面标题和操作 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">小说详情</h1>
        <div class="header-actions">
          <el-button
            v-if="novel"
            type="primary"
            @click="goToCreate"
          >
            <el-icon><Plus /></el-icon>
            上传新小说
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="page-content">
      <div class="detail-container">
        <!-- 小说信息卡片 -->
        <el-card class="detail-card glass" v-loading="loading">
          <div v-if="novel">
            <el-descriptions title="小说信息" :column="2" border>
              <el-descriptions-item label="小说名称">
                {{ novel.title || '未命名小说' }}
              </el-descriptions-item>
              <el-descriptions-item label="小说ID">
                <el-button
                  text
                  type="primary"
                  @click="copyToClipboard(novel.id)"
                >
                  {{ novel.id }}
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
              </el-descriptions-item>
              <el-descriptions-item label="工作流ID">
                <el-button
                  text
                  type="primary"
                  @click="copyToClipboard(novel.workflow_id)"
                >
                  {{ novel.workflow_id }}
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
              </el-descriptions-item>
              <el-descriptions-item label="资源ID">
                <el-button
                  text
                  type="primary"
                  @click="copyToClipboard(novel.resource_id)"
                >
                  {{ novel.resource_id }}
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatDate(novel.created_at) }}
              </el-descriptions-item>
              <el-descriptions-item label="更新时间">
                {{ formatDate(novel.updated_at) }}
              </el-descriptions-item>
              <el-descriptions-item v-if="novel.author" label="作者" :span="2">
                {{ novel.author }}
              </el-descriptions-item>
              <el-descriptions-item v-if="novel.description" label="简介" :span="2">
                {{ novel.description }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <div v-else-if="!loading">
            <el-empty description="小说不存在" />
          </div>
        </el-card>

        <!-- 章节列表 -->
        <el-card
          v-if="novel"
          class="chapters-card glass"
          v-loading="loadingChapters"
        >
          <template #header>
            <div class="chapters-header">
              <span>章节列表（共 {{ chapters.length }} 章）</span>
              <el-button
                text
                type="primary"
                @click="refreshChapters"
                :loading="loadingChapters"
              >
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>

          <el-empty
            v-if="!loadingChapters && chapters.length === 0"
            description="暂无章节，请先切分章节"
          >
            <el-button
              type="primary"
              @click="goToCreate"
            >
              前往上传页面
            </el-button>
          </el-empty>

          <el-table
            v-else
            :data="chapters"
            stripe
            style="width: 100%"
            @row-click="handleChapterClick"
          >
            <el-table-column prop="sequence" label="序号" width="80" align="center" />
            <el-table-column prop="title" label="章节标题" min-width="200" />
            <el-table-column prop="word_count" label="字数" width="100" align="right">
              <template #default="{ row }">
                {{ row.word_count.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="line_count" label="行数" width="100" align="right">
              <template #default="{ row }">
                {{ row.line_count.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="total_chars" label="总字符数" width="120" align="right">
              <template #default="{ row }">
                {{ row.total_chars.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button
                  text
                  type="primary"
                  @click.stop="viewChapter(row)"
                >
                  查看详情
                </el-button>
                <el-button
                  text
                  type="primary"
                  @click.stop="goToChapterDetail(row)"
                >
                  处理流程
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  Plus,
  CopyDocument,
  Refresh
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { novelApi } from '@/api/novel'
import type { Novel, Chapter } from '@/types/novel'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const loadingChapters = ref(false)
const novel = ref<Novel | null>(null)
const chapters = ref<Chapter[]>([])

// 格式化日期
const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 复制到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 获取小说详情
const fetchNovel = async () => {
  const novelId = route.params.id as string
  if (!novelId) return

  loading.value = true
  try {
    const result = await novelApi.getNovel(novelId)
    novel.value = result.novel
  } catch (error: any) {
    ElMessage.error(error.message || '获取小说详情失败')
    console.error('获取小说详情失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取章节列表
const fetchChapters = async () => {
  if (!novel.value) return

  loadingChapters.value = true
  try {
    const result = await novelApi.getChapters(novel.value.id)
    chapters.value = result.chapters || []
  } catch (error: any) {
    ElMessage.error(error.message || '获取章节列表失败')
    console.error('获取章节列表失败:', error)
  } finally {
    loadingChapters.value = false
  }
}

// 刷新章节列表
const refreshChapters = () => {
  fetchChapters()
}

// 查看章节
const viewChapter = (chapter: Chapter) => {
  // TODO: 跳转到章节详情页或显示章节内容
  ElMessage.info(`查看章节: ${chapter.title}`)
}

// 前往章节详情页（处理流程）
const goToChapterDetail = (chapter: Chapter) => {
  router.push({
    path: `/novel/chapters/${chapter.id}`,
    query: { novel_id: chapter.novel_id }
  })
}

// 章节行点击
const handleChapterClick = (row: Chapter) => {
  goToChapterDetail(row)
}

// 前往上传页面
const goToCreate = () => {
  router.push('/novel/create')
}

// 返回

onMounted(async () => {
  await fetchNovel()
  if (novel.value) {
    await fetchChapters()
  }
})
</script>

<style scoped>
.novel-detail {
  width: 100%;
  min-height: 100vh;
  background: var(--bg-secondary);
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-xl);
}

.header-content {
  max-width: 1000px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
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
}

.page-content {
  /* 内容区域样式已由布局组件处理 */
}

.detail-container {
  max-width: 1000px;
  margin: 0 auto;
}

.detail-card {
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  padding: var(--spacing-xl);
}
</style>

