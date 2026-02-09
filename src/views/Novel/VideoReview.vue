<template>
  <div class="video-review">
    <!-- 页面标题和操作 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">视频 Review</h1>
        <div class="header-actions">
          <el-button
            type="primary"
            @click="generateNarrationVideos"
            :loading="generating.narration"
            :disabled="!chapterId"
          >
            生成分镜视频
          </el-button>
          <el-button
            type="success"
            @click="generateFinalVideo"
            :loading="generating.final"
            :disabled="!chapterId"
          >
            生成最终视频
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="page-content">
      <div class="content-container">
        <!-- 分镜视频 -->
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <h2 class="card-title">分镜视频</h2>
              <el-select v-model="selectedVersion" @change="fetchVideos" style="width: 150px">
                <el-option
                  v-for="v in versions"
                  :key="v"
                  :label="`版本 ${v}`"
                  :value="v"
                />
              </el-select>
            </div>
          </template>

          <el-empty v-if="narrationVideos.length === 0" description="暂无分镜视频" />

          <div v-else class="videos-grid">
            <el-card
              v-for="video in narrationVideos"
              :key="video.id"
              class="video-card"
              shadow="hover"
            >
              <div class="video-wrapper">
                <video
                  v-if="video.video_resource_id"
                  :src="getVideoUrl(video.video_resource_id)"
                  controls
                  preload="metadata"
                />
                <el-empty v-else description="视频未生成" :image-size="80" />
              </div>
              <div class="video-info">
                <p><strong>序号:</strong> {{ video.sequence }}</p>
                <p><strong>时长:</strong> {{ formatDuration(video.duration) }}</p>
                <p><strong>版本:</strong> {{ video.version }}</p>
                <p><strong>状态:</strong> 
                  <el-tag :type="getStatusType(video.status)" size="small">
                    {{ getStatusLabel(video.status) }}
                  </el-tag>
                </p>
              </div>
              <div class="video-actions">
                <el-button size="small" @click="regenerateVideo(video.id)">
                  重新生成
                </el-button>
              </div>
            </el-card>
          </div>
        </el-card>

        <!-- 最终视频 -->
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <h2 class="card-title">最终视频</h2>
            </div>
          </template>

          <el-empty v-if="!finalVideo" description="暂无最终视频" />

          <div v-else class="final-video">
            <div class="video-wrapper-large">
              <video
                v-if="finalVideo.video_resource_id"
                :src="getVideoUrl(finalVideo.video_resource_id)"
                controls
                preload="metadata"
              />
              <el-empty v-else description="视频未生成" :image-size="100" />
            </div>
            <div class="video-info">
              <p><strong>时长:</strong> {{ formatDuration(finalVideo.duration) }}</p>
              <p><strong>版本:</strong> {{ finalVideo.version }}</p>
              <p><strong>状态:</strong> 
                <el-tag :type="getStatusType(finalVideo.status)" size="small">
                  {{ getStatusLabel(finalVideo.status) }}
                </el-tag>
              </p>
            </div>
          </div>
        </el-card>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { novelApi } from '@/api/novel'
import type { Video } from '@/types/novel'

const route = useRoute()
const router = useRouter()
const generating = ref({
  narration: false,
  final: false
})
const narrationVideos = ref<Video[]>([])
const finalVideo = ref<Video | null>(null)
const versions = ref<number[]>([])
const selectedVersion = ref<number>(0)

const chapterId = computed(() => route.query.chapterId as string)

const fetchVersions = async () => {
  if (!chapterId.value) return
  try {
    const res = await novelApi.getVideoVersions(chapterId.value)
    versions.value = res.data.versions || []
    if (versions.value.length > 0) {
      selectedVersion.value = Math.max(...versions.value)
    }
  } catch (error) {
    console.error('获取视频版本列表失败', error)
  }
}

const fetchVideos = async () => {
  if (!chapterId.value) return
  try {
    const res = await novelApi.listVideos(
      chapterId.value,
      selectedVersion.value > 0 ? selectedVersion.value : undefined
    )
    const videos = res.data.videos || []
    narrationVideos.value = videos.filter(v => v.video_type === 'narration_video')
    finalVideo.value = videos.find(v => v.video_type === 'final_video') || null
  } catch (error) {
    ElMessage.error('获取视频列表失败')
    console.error(error)
  }
}

const generateNarrationVideos = async () => {
  if (!chapterId.value) {
    ElMessage.warning('缺少 chapterId')
    return
  }
  try {
    generating.value.narration = true
    await novelApi.generateNarrationVideos(chapterId.value)
    ElMessage.success('分镜视频生成任务已提交')
    setTimeout(() => {
      fetchVersions()
      fetchVideos()
    }, 2000)
  } catch (error) {
    ElMessage.error('生成分镜视频失败')
    console.error(error)
  } finally {
    generating.value.narration = false
  }
}

const generateFinalVideo = async () => {
  if (!chapterId.value) {
    ElMessage.warning('缺少 chapterId')
    return
  }
  try {
    generating.value.final = true
    await novelApi.generateFinalVideo(chapterId.value)
    ElMessage.success('最终视频生成任务已提交')
    setTimeout(() => {
      fetchVersions()
      fetchVideos()
    }, 2000)
  } catch (error) {
    ElMessage.error('生成最终视频失败')
    console.error(error)
  } finally {
    generating.value.final = false
  }
}

const regenerateVideo = async (videoId: string) => {
  ElMessage.info('重新生成功能待实现')
  // TODO: 实现重新生成单个视频的逻辑
}

const getVideoUrl = (resourceId: string) => {
  return `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/resources/${resourceId}/download-url`
}

const formatDuration = (seconds: number) => {
  if (!seconds) return '0秒'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    completed: 'success',
    pending: 'info',
    processing: 'warning',
    failed: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    completed: '已完成',
    pending: '待处理',
    processing: '处理中',
    failed: '失败'
  }
  return map[status] || status
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  if (!chapterId.value) {
    ElMessage.warning('缺少 chapterId 参数，请从工作流详情页面进入')
    return
  }
  fetchVersions()
  fetchVideos()
})
</script>

<style scoped>
.video-review {
  height: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.page-content {
  /* 内容区域样式已由布局组件处理 */
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
}

.content-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.video-card {
  overflow: hidden;
}

.video-wrapper {
  width: 100%;
  height: 200px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-wrapper video {
  max-width: 100%;
  max-height: 100%;
}

.video-wrapper-large {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-wrapper-large video {
  width: 100%;
  height: auto;
}

.video-info {
  padding: 12px;
  font-size: 14px;
}

.video-info p {
  margin: 8px 0;
  color: #606266;
}

.video-actions {
  padding: 12px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}

.final-video {
  text-align: center;
}

.final-video .video-info {
  margin-top: 16px;
}
</style>

