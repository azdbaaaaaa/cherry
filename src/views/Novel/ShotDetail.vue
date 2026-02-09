<template>
  <div class="shot-detail-page">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" icon="ArrowLeft" text>返回</el-button>
        <h1 class="page-title">镜头详情</h1>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="shot" class="content-container">
      <!-- 镜头基本信息 -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>镜头信息</span>
            <span class="shot-sequence">镜头 {{ shot.sequence }}</span>
          </div>
        </template>
        <div class="shot-info">
          <div class="info-item">
            <span class="label">旁白：</span>
            <span class="value">{{ shot.narration || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">时长：</span>
            <span class="value">{{ shot.duration ? `${shot.duration}秒` : '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">首图提示词：</span>
            <span class="value">{{ shot.first_image_prompt || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">尾图提示词：</span>
            <span class="value">{{ shot.last_image_prompt || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">视频提示词：</span>
            <span class="value">{{ shot.video_prompt || '-' }}</span>
          </div>
        </div>
      </el-card>

      <!-- 生成操作区域 -->
      <el-card class="actions-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>生成操作</span>
          </div>
        </template>
        <div class="actions-grid">
          <div class="action-item">
            <h3>1. 生成图片</h3>
            <p class="action-desc">生成首图和尾图</p>
            <el-button
              type="primary"
              @click="handleGenerateImages"
              :loading="generatingImages"
              :disabled="!shot.first_image_prompt && !shot.last_image_prompt"
            >
              {{ generatingImages ? '生成中...' : '生成图片' }}
            </el-button>
          </div>
          <div class="action-item">
            <h3>2. 生成音频</h3>
            <p class="action-desc">根据旁白生成音频</p>
            <el-button
              type="primary"
              @click="handleGenerateAudio"
              :loading="generatingAudio"
              :disabled="!shot.narration"
            >
              {{ generatingAudio ? '生成中...' : '生成音频' }}
            </el-button>
          </div>
          <div class="action-item">
            <h3>3. 生成字幕</h3>
            <p class="action-desc">根据音频生成字幕</p>
            <el-button
              type="primary"
              @click="handleGenerateSubtitle"
              :loading="generatingSubtitle"
              :disabled="!hasAudios"
            >
              {{ generatingSubtitle ? '生成中...' : '生成字幕' }}
            </el-button>
          </div>
          <div class="action-item">
            <h3>4. 生成视频</h3>
            <p class="action-desc">根据图片和提示词生成视频</p>
            <el-button
              type="primary"
              @click="handleGenerateVideo"
              :loading="generatingVideo"
              :disabled="!hasImages || !shot.video_prompt"
            >
              {{ generatingVideo ? '生成中...' : '生成视频' }}
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 图片列表 -->
      <el-card class="images-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>图片列表</span>
            <el-button text @click="loadImages">刷新</el-button>
          </div>
        </template>
        <div v-if="loadingImages" class="loading-state">
          <el-skeleton :rows="2" animated />
        </div>
        <div v-else-if="images.length === 0" class="empty-state">
          <p>暂无图片</p>
        </div>
        <div v-else class="images-grid">
          <div v-for="image in images" :key="image.id" class="image-item">
            <div class="image-type-badge" :class="image.image_type">
              {{ image.image_type === 'shot_first' ? '首图' : '尾图' }}
            </div>
            <img
              :src="getImageUrl(image.image_resource_id)"
              :alt="image.image_type"
              @error="handleImageError"
            />
            <div class="image-info">
              <p class="image-prompt">{{ image.prompt }}</p>
              <p class="image-version">版本: {{ image.version }}</p>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 音频列表 -->
      <el-card class="audios-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>音频列表</span>
            <el-button text @click="loadAudios">刷新</el-button>
          </div>
        </template>
        <div v-if="loadingAudios" class="loading-state">
          <el-skeleton :rows="2" animated />
        </div>
        <div v-else-if="audios.length === 0" class="empty-state">
          <p>暂无音频</p>
        </div>
        <div v-else class="audios-list">
          <div v-for="audio in audios" :key="audio.id" class="audio-item">
            <div class="audio-info">
              <p class="audio-text">{{ audio.text }}</p>
              <p class="audio-meta">
                时长: {{ audio.duration.toFixed(2) }}秒 | 版本: {{ audio.version }} |
                状态: {{ audio.status }}
              </p>
            </div>
            <audio :src="audio.audio_url" controls class="audio-player" />
          </div>
        </div>
      </el-card>

      <!-- 字幕列表 -->
      <el-card class="subtitles-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>字幕列表</span>
            <el-button text @click="loadSubtitles">刷新</el-button>
          </div>
        </template>
        <div v-if="loadingSubtitles" class="loading-state">
          <el-skeleton :rows="2" animated />
        </div>
        <div v-else-if="subtitles.length === 0" class="empty-state">
          <p>暂无字幕</p>
        </div>
        <div v-else class="subtitles-list">
          <div v-for="subtitle in subtitles" :key="subtitle.id" class="subtitle-item">
            <div class="subtitle-info">
              <p class="subtitle-text">{{ subtitle.text }}</p>
              <p class="subtitle-meta">
                版本: {{ subtitle.version }} | 状态: {{ subtitle.status }}
              </p>
            </div>
            <a
              v-if="subtitle.subtitle_url"
              :href="subtitle.subtitle_url"
              target="_blank"
              class="subtitle-download"
            >
              下载字幕文件
            </a>
          </div>
        </div>
      </el-card>

      <!-- 视频列表 -->
      <el-card class="videos-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>视频列表</span>
            <el-button text @click="loadVideos">刷新</el-button>
          </div>
        </template>
        <div v-if="loadingVideos" class="loading-state">
          <el-skeleton :rows="2" animated />
        </div>
        <div v-else-if="videos.length === 0" class="empty-state">
          <p>暂无视频</p>
        </div>
        <div v-else class="videos-list">
          <div v-for="video in videos" :key="video.id" class="video-item">
            <div class="video-info">
              <p class="video-meta">
                时长: {{ video.duration.toFixed(2) }}秒 | 版本: {{ video.version }} |
                状态: {{ video.status }}
              </p>
              <p v-if="video.error_message" class="video-error">{{ video.error_message }}</p>
            </div>
            <video
              v-if="video.status === 'completed'"
              :src="video.video_url"
              controls
              class="video-player"
            />
            <div v-else class="video-placeholder">
              <p>{{ video.status === 'pending' ? '待处理' : video.status === 'processing' ? '处理中' : '生成失败' }}</p>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { novelApi } from '@/api/novel'
import type { Shot, Image, Audio, Video, Subtitle } from '@/types/novel'

const route = useRoute()
const router = useRouter()

const shotId = computed(() => route.params.shotId as string)

const loading = ref(false)
const shot = ref<Shot | null>(null)

const generatingImages = ref(false)
const generatingAudio = ref(false)
const generatingSubtitle = ref(false)
const generatingVideo = ref(false)

const images = ref<Image[]>([])
const loadingImages = ref(false)

const audios = ref<Audio[]>([])
const loadingAudios = ref(false)

const subtitles = ref<Subtitle[]>([])
const loadingSubtitles = ref(false)

const videos = ref<Video[]>([])
const loadingVideos = ref(false)

const hasImages = computed(() => images.value.length > 0)
const hasAudios = computed(() => audios.value.length > 0)

// 加载镜头详情
const loadShot = async () => {
  try {
    loading.value = true
    const res = await novelApi.getShot(shotId.value)
    shot.value = (res.data as any).shot || res.data
  } catch (error: any) {
    console.error('加载镜头详情失败:', error)
    ElMessage.error(error?.response?.data?.message || '加载镜头详情失败')
  } finally {
    loading.value = false
  }
}

// 生成图片
const handleGenerateImages = async () => {
  try {
    generatingImages.value = true
    await novelApi.generateShotImages(shotId.value)
    ElMessage.success('图片生成任务已提交')
    // 等待一段时间后刷新图片列表
    setTimeout(() => {
      loadImages()
    }, 2000)
  } catch (error: any) {
    console.error('生成图片失败:', error)
    ElMessage.error(error?.response?.data?.message || '生成图片失败')
  } finally {
    generatingImages.value = false
  }
}

// 生成音频
const handleGenerateAudio = async () => {
  try {
    generatingAudio.value = true
    await novelApi.generateShotAudio(shotId.value)
    ElMessage.success('音频生成任务已提交')
    // 等待一段时间后刷新音频列表
    setTimeout(() => {
      loadAudios()
    }, 2000)
  } catch (error: any) {
    console.error('生成音频失败:', error)
    ElMessage.error(error?.response?.data?.message || '生成音频失败')
  } finally {
    generatingAudio.value = false
  }
}

// 生成字幕
const handleGenerateSubtitle = async () => {
  try {
    generatingSubtitle.value = true
    await novelApi.generateShotSubtitle(shotId.value)
    ElMessage.success('字幕生成任务已提交')
    // 等待一段时间后刷新字幕列表
    setTimeout(() => {
      loadSubtitles()
    }, 2000)
  } catch (error: any) {
    console.error('生成字幕失败:', error)
    ElMessage.error(error?.response?.data?.message || '生成字幕失败')
  } finally {
    generatingSubtitle.value = false
  }
}

// 生成视频
const handleGenerateVideo = async () => {
  try {
    generatingVideo.value = true
    await novelApi.generateShotVideo(shotId.value)
    ElMessage.success('视频生成任务已提交')
    // 开始轮询视频状态
    startPollingVideos()
  } catch (error: any) {
    console.error('生成视频失败:', error)
    ElMessage.error(error?.response?.data?.message || '生成视频失败')
  } finally {
    generatingVideo.value = false
  }
}

// 加载图片列表
const loadImages = async () => {
  try {
    loadingImages.value = true
    const res = await novelApi.getShotImages(shotId.value)
    images.value = (res.data as any).images || res.data || []
  } catch (error: any) {
    console.error('加载图片列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '加载图片列表失败')
  } finally {
    loadingImages.value = false
  }
}

// 加载音频列表
const loadAudios = async () => {
  try {
    loadingAudios.value = true
    const res = await novelApi.getShotAudios(shotId.value)
    audios.value = (res.data as any).audios || res.data || []
  } catch (error: any) {
    console.error('加载音频列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '加载音频列表失败')
  } finally {
    loadingAudios.value = false
  }
}

// 加载字幕列表
const loadSubtitles = async () => {
  try {
    loadingSubtitles.value = true
    const res = await novelApi.getShotSubtitles(shotId.value)
    subtitles.value = (res.data as any).subtitles || res.data || []
  } catch (error: any) {
    console.error('加载字幕列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '加载字幕列表失败')
  } finally {
    loadingSubtitles.value = false
  }
}

// 加载视频列表
const loadVideos = async () => {
  try {
    loadingVideos.value = true
    const res = await novelApi.getShotVideos(shotId.value)
    videos.value = (res.data as any).videos || res.data || []
  } catch (error: any) {
    console.error('加载视频列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '加载视频列表失败')
  } finally {
    loadingVideos.value = false
  }
}

// 轮询视频状态
let videoPollTimer: ReturnType<typeof setInterval> | null = null
const startPollingVideos = () => {
  if (videoPollTimer) {
    clearInterval(videoPollTimer)
  }

  let retries = 0
  const maxRetries = 60 // 最多轮询 60 次（5分钟）

  videoPollTimer = setInterval(async () => {
    try {
      await loadVideos()

      // 检查是否所有视频都已完成或失败
      const allCompleted = videos.value.every(
        (video) => video.status === 'completed' || video.status === 'failed'
      )

      if (allCompleted || retries >= maxRetries) {
        if (videoPollTimer) {
          clearInterval(videoPollTimer)
          videoPollTimer = null
        }
        if (retries >= maxRetries) {
          ElMessage.warning('视频生成超时，请手动刷新查看状态')
        }
      }

      retries++
    } catch (error) {
      console.error('轮询视频状态失败:', error)
    }
  }, 5000) // 每 5 秒轮询一次
}

// 获取图片URL
const getImageUrl = (resourceId: string) => {
  return `/api/v1/resources/${resourceId}/download`
}

// 图片加载错误处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-image.png'
}

// 返回
const goBack = () => {
  router.back()
}

onMounted(() => {
  loadShot()
  loadImages()
  loadAudios()
  loadSubtitles()
  loadVideos()
})
</script>

<style scoped lang="scss">
.shot-detail-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .page-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card,
.actions-card,
.images-card,
.audios-card,
.videos-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .shot-sequence {
      font-weight: 600;
      color: var(--el-color-primary);
    }
  }
}

.shot-info {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .info-item {
    display: flex;
    gap: 8px;

    .label {
      font-weight: 600;
      min-width: 100px;
    }

    .value {
      flex: 1;
      color: var(--el-text-color-regular);
    }
  }
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;

  .action-item {
    padding: 16px;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;

    h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .action-desc {
      margin: 0 0 16px 0;
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }
  }
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;

  .image-item {
    position: relative;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    overflow: hidden;

    .image-type-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 8px;
      background: var(--el-color-primary);
      color: white;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1;

      &.shot_first {
        background: var(--el-color-success);
      }

      &.shot_last {
        background: var(--el-color-warning);
      }
    }

    img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .image-info {
      padding: 12px;

      .image-prompt {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: var(--el-text-color-regular);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .image-version {
        margin: 0;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.audios-list,
.subtitles-list,
.videos-list {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .audio-item,
  .subtitle-item,
  .video-item {
    padding: 16px;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;

    .audio-info,
    .subtitle-info,
    .video-info {
      margin-bottom: 12px;

      .audio-text,
      .subtitle-text,
      .video-meta {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: var(--el-text-color-regular);
      }

      .subtitle-meta {
        margin: 0;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }

      .video-error {
        margin: 0;
        font-size: 12px;
        color: var(--el-color-error);
      }
    }

    .subtitle-download {
      color: var(--el-color-primary);
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;

      &:hover {
        color: var(--el-color-primary-light-3);
      }
    }

    .audio-player,
    .video-player {
      width: 100%;
    }

    .video-placeholder {
      padding: 40px;
      text-align: center;
      background: var(--el-fill-color-light);
      border-radius: 8px;
      color: var(--el-text-color-secondary);
    }
  }
}

.loading-container,
.loading-state,
.empty-state {
  padding: 40px;
  text-align: center;
  color: var(--el-text-color-secondary);
}
</style>

