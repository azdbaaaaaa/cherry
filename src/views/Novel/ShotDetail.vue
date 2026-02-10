<template>
  <div class="shot-detail-page">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" icon="ArrowLeft" text>返回</el-button>
        <h1 class="page-title">镜头详情</h1>
      </div>
      <div class="header-right">
        <el-button
          type="primary"
          size="large"
          @click="handleGenerateFinalVideo"
          :loading="generatingFinalVideo"
          :disabled="!chapterId"
        >
          生成章节完整视频
        </el-button>
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
        <div class="steps-container">
          <el-steps :active="activeStepIndex" finish-status="success" align-center>
            <el-step title="生成图片" description="生成首图和尾图" />
            <el-step title="生成音频" description="根据旁白生成音频" />
            <el-step title="生成字幕" description="根据音频生成字幕" />
            <el-step title="生成视频" description="根据图片和提示词生成视频" />
          </el-steps>
          
          <!-- 步骤内容区域 -->
          <div class="step-content">
            <!-- 步骤1: 生成图片 -->
            <div v-show="activeStepIndex === 0" class="step-panel">
              <div class="step-header">
                <h3>1. 生成图片</h3>
                <p class="step-desc">生成首图和尾图</p>
              </div>
              <div class="step-actions">
                <el-button
                  type="primary"
                  @click="handleGenerateImages"
                  :loading="generatingImages"
                  :disabled="!shot.first_image_prompt && !shot.last_image_prompt"
                >
                  {{ generatingImages ? '生成中...' : '生成图片' }}
                </el-button>
                <el-button text @click="loadImages">刷新列表</el-button>
              </div>
              <div v-if="loadingImages" class="loading-state">
                <el-skeleton :rows="2" animated />
              </div>
              <div v-else-if="images.length === 0" class="empty-state">
                <p>暂无图片，请先生成图片</p>
              </div>
              <div v-else>
                <el-table :data="imageVersionRows" stripe class="asset-table">
                  <el-table-column prop="version" label="版本" width="80" />
                  <el-table-column prop="scene_id" label="场景ID" min-width="220" />
                  <el-table-column label="首图" width="180">
                    <template #default="{ row }">
                      <img
                        v-if="row.first?.image_url"
                        :src="row.first.image_url"
                        alt="首图预览"
                        class="image-thumb"
                        @click="openImagePreview(row.first.image_url)"
                        @error="handleImageError"
                        @load="handleImageLoad"
                      />
                      <span v-else class="muted">-</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="尾图" width="180">
                    <template #default="{ row }">
                      <img
                        v-if="row.last?.image_url"
                        :src="row.last.image_url"
                        alt="尾图预览"
                        class="image-thumb"
                        @click="openImagePreview(row.last.image_url)"
                        @error="handleImageError"
                        @load="handleImageLoad"
                      />
                      <span v-else class="muted">-</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" width="100" />
                  <el-table-column prop="created_at" label="创建时间" min-width="190" />
                  <el-table-column label="提示词" min-width="260">
                    <template #default="{ row }">
                      <span class="ellipsis">
                        {{ row.first?.prompt || row.last?.prompt || '-' }}
                      </span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>

            <!-- 步骤2: 生成音频 -->
            <div v-show="activeStepIndex === 1" class="step-panel">
              <div class="step-header">
                <h3>2. 生成音频</h3>
                <p class="step-desc">根据旁白生成音频</p>
              </div>
              <div class="step-actions">
                <el-button
                  type="primary"
                  @click="handleGenerateAudio"
                  :loading="generatingAudio"
                  :disabled="!shot.narration || !hasImages"
                >
                  {{ generatingAudio ? '生成中...' : '生成音频' }}
                </el-button>
                <el-button text @click="loadAudios">刷新列表</el-button>
              </div>
              <div v-if="loadingAudios" class="loading-state">
                <el-skeleton :rows="2" animated />
              </div>
              <div v-else-if="audios.length === 0" class="empty-state">
                <p>暂无音频，请先生成音频</p>
              </div>
              <div v-else>
                <el-table :data="audios" stripe class="asset-table">
                  <el-table-column prop="version" label="版本" width="80" />
                  <el-table-column prop="status" label="状态" width="100" />
                  <el-table-column label="时长(秒)" width="110">
                    <template #default="{ row }">
                      {{ row.duration.toFixed(2) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="播放" width="230">
                    <template #default="{ row }">
                      <audio :src="row.audio_url" controls class="audio-player" />
                    </template>
                  </el-table-column>
                  <el-table-column prop="created_at" label="创建时间" min-width="190" />
                  <el-table-column label="文本" min-width="260">
                    <template #default="{ row }">
                      <span class="ellipsis">{{ row.text }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>

            <!-- 步骤3: 生成字幕 -->
            <div v-show="activeStepIndex === 2" class="step-panel">
              <div class="step-header">
                <h3>3. 生成字幕</h3>
                <p class="step-desc">根据音频生成字幕</p>
              </div>
              <div class="step-actions">
                <el-button
                  type="primary"
                  @click="handleGenerateSubtitle"
                  :loading="generatingSubtitle"
                  :disabled="!hasAudios"
                >
                  {{ generatingSubtitle ? '生成中...' : '生成字幕' }}
                </el-button>
                <el-button text @click="loadSubtitles">刷新列表</el-button>
              </div>
              <div v-if="loadingSubtitles" class="loading-state">
                <el-skeleton :rows="2" animated />
              </div>
              <div v-else-if="subtitles.length === 0" class="empty-state">
                <p>暂无字幕，请先生成字幕</p>
              </div>
              <div v-else>
                <el-table :data="subtitles" stripe class="asset-table">
                  <el-table-column prop="version" label="版本" width="80" />
                  <el-table-column prop="format" label="格式" width="90" />
                  <el-table-column prop="status" label="状态" width="100" />
                  <el-table-column prop="created_at" label="创建时间" min-width="190" />
                  <el-table-column label="操作" width="160">
                    <template #default="{ row }">
                      <a
                        v-if="row.subtitle_url"
                        :href="row.subtitle_url"
                        target="_blank"
                        class="subtitle-download"
                      >
                        下载 ASS
                      </a>
                    </template>
                  </el-table-column>
                  <el-table-column label="内容" min-width="260">
                    <template #default="{ row }">
                      <span class="ellipsis">{{ row.prompt }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>

            <!-- 步骤4: 生成视频 -->
            <div v-show="activeStepIndex === 3" class="step-panel">
              <div class="step-header">
                <h3>4. 生成视频</h3>
                <p class="step-desc">根据图片和提示词生成视频</p>
              </div>
              <div class="step-actions">
                <el-button
                  type="primary"
                  @click="handleGenerateVideo"
                  :loading="generatingVideo"
                  :disabled="!hasImages || !shot.video_prompt"
                >
                  {{ generatingVideo ? '生成中...' : '生成视频' }}
                </el-button>
                <el-button text @click="loadVideos">刷新列表</el-button>
              </div>
              <div v-if="loadingVideos" class="loading-state">
                <el-skeleton :rows="2" animated />
              </div>
              <div v-else-if="videos.length === 0" class="empty-state">
                <p>暂无视频，请先生成视频</p>
              </div>
              <div v-else>
                <el-table :data="videos" stripe class="asset-table">
                  <el-table-column prop="version" label="版本" width="80" />
                  <el-table-column prop="status" label="状态" width="110" />
                  <el-table-column label="时长(秒)" width="110">
                    <template #default="{ row }">
                      {{ row.duration.toFixed(2) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="预览" width="260">
                    <template #default="{ row }">
                      <div v-if="row.status === 'completed'">
                        <video
                          :src="row.video_url"
                          controls
                          class="video-player"
                        />
                      </div>
                      <div v-else class="video-placeholder">
                        <p>{{ row.status === 'pending' ? '待处理' : row.status === 'processing' ? '处理中' : '生成失败' }}</p>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="created_at" label="创建时间" min-width="190" />
                </el-table>
              </div>
            </div>
          </div>

          <!-- 导航按钮 - 固定在步骤内容底部 -->
          <div class="step-navigation">
            <div class="nav-buttons">
              <el-button
                size="large"
                :icon="ArrowLeft"
                @click="prevStep"
                :disabled="activeStepIndex === 0"
                class="nav-btn nav-btn-prev"
              >
                上一步
              </el-button>
              <div class="step-indicator">
                <span class="current-step">{{ activeStepIndex + 1 }}</span>
                <span class="step-divider">/</span>
                <span class="total-steps">4</span>
              </div>
              <el-button
                type="primary"
                size="large"
                @click="nextStep"
                :disabled="activeStepIndex === 3"
                class="nav-btn nav-btn-next"
              >
                下一步
                <el-icon class="ml-1"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图片预览弹窗 -->
    <el-dialog
      v-model="imagePreviewVisible"
      width="60%"
      top="5vh"
      destroy-on-close
      class="image-preview-dialog"
    >
      <img :src="imagePreviewUrl" alt="图片预览" class="image-preview-large" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
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
const generatingFinalVideo = ref(false)

const images = ref<Image[]>([])
const loadingImages = ref(false)

// 图片按版本聚合：每个版本一条记录，包含首图和尾图
interface ImageVersionRow {
  version: number
  status: Image['status']
  created_at: string
  first?: Image
  last?: Image
  scene_id?: string
}

const imageVersionRows = computed<ImageVersionRow[]>(() => {
  const map = new Map<number, ImageVersionRow>()

  for (const img of images.value) {
    const v = img.version
    let row = map.get(v)
    if (!row) {
      row = {
        version: v,
        status: img.status,
        created_at: img.created_at,
        first: undefined,
        last: undefined,
        scene_id: shot.value?.scene_id
      }
      map.set(v, row)
    }

    const imageType = (img as any).image_type
    if (imageType === 'shot_first') {
      row.first = img
    } else if (imageType === 'shot_last') {
      row.last = img
    }

    // 简单的状态聚合：如果有失败则标记失败，其次处理中，否则完成
    if (img.status === 'failed') {
      row.status = 'failed'
    } else if (img.status === 'pending') {
      if (row.status !== 'failed') row.status = 'pending'
    } else if (img.status === 'completed') {
      if (row.status === 'pending') {
        // 保持 pending，直到两张都完成
        if (row.first?.status === 'completed' && row.last?.status === 'completed') {
          row.status = 'completed'
        }
      } else if (row.status !== 'failed') {
        row.status = 'completed'
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.version - b.version)
})

const audios = ref<Audio[]>([])
const loadingAudios = ref(false)

const subtitles = ref<Subtitle[]>([])
const loadingSubtitles = ref(false)

const videos = ref<Video[]>([])
const loadingVideos = ref(false)

// 当前镜头所属章节ID
const chapterId = computed(() => {
  const s = shot.value as any
  return (s && s.chapter_id) || ''
})

// 生成章节完整视频
const handleGenerateFinalVideo = async () => {
  if (!chapterId.value) {
    ElMessage.error('缺少章节ID，无法生成章节视频')
    return
  }

  try {
    generatingFinalVideo.value = true
    await novelApi.generateFinalVideo(chapterId.value)
    ElMessage.success('章节完整视频生成任务已提交，可在章节视频列表中查看')
  } catch (error: any) {
    console.error('生成章节完整视频失败:', error)
    ElMessage.error(error?.response?.data?.message || '生成章节完整视频失败')
  } finally {
    generatingFinalVideo.value = false
  }
}

// 图片预览
const imagePreviewVisible = ref(false)
const imagePreviewUrl = ref<string>('')

const openImagePreview = (url?: string) => {
  if (!url) return
  imagePreviewUrl.value = url
  imagePreviewVisible.value = true
}

const hasImages = computed(() => images.value.length > 0)
const hasAudios = computed(() => audios.value.length > 0)

// 步骤状态
const stepStatus = computed(() => {
  return {
    images: hasImages.value ? 'completed' : (generatingImages.value ? 'processing' : 'wait'),
    audio: hasAudios.value ? 'completed' : (generatingAudio.value ? 'processing' : 'wait'),
    subtitle: subtitles.value.length > 0 ? 'completed' : (generatingSubtitle.value ? 'processing' : 'wait'),
    video: videos.value.length > 0 ? 'completed' : (generatingVideo.value ? 'processing' : 'wait')
  }
})

// 当前激活的步骤索引（用于显示哪个步骤的内容）
const activeStepIndex = ref(0)

// 上一步
const prevStep = () => {
  if (activeStepIndex.value > 0) {
    activeStepIndex.value--
  }
}

// 下一步
const nextStep = () => {
  if (activeStepIndex.value < 3) {
    activeStepIndex.value++
  }
}

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
    // 持续轮询直到图片生成完成
    const checkInterval = setInterval(() => {
      loadImages().then(() => {
        if (hasImages.value) {
          clearInterval(checkInterval)
        }
      })
    }, 3000)
    // 30秒后停止轮询
    setTimeout(() => clearInterval(checkInterval), 30000)
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

// 图片URL现在直接从API返回，不需要再构建

// 图片加载错误处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // 如果已经是占位图或 data URL，不再设置，避免无限循环
  if (img.src.startsWith('data:')) {
    return
  }
  // 使用一个占位符 SVG 作为占位图（灰色背景，显示图片图标）
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="300" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14" font-family="Arial"%3E图片加载失败%3C/text%3E%3C/svg%3E'
  // 添加错误样式类
  img.classList.add('image-error')
}

// 图片加载成功处理
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  // 移除错误样式类
  img.classList.remove('image-error')
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0;
  overflow-y: auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px 32px;
  margin: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .page-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card,
.actions-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
  overflow: hidden;
  background: #ffffff;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    font-size: 16px;

    .shot-sequence {
      font-weight: 600;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }
  }
}

.shot-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 24px;

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    transition: all 0.2s;

    &:hover {
      border-color: rgba(102, 126, 234, 0.3);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
    }

    .label {
      font-weight: 600;
      color: #667eea;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .value {
      color: var(--el-text-color-primary);
      font-size: 14px;
      line-height: 1.6;
      word-break: break-word;
    }
  }
}

.steps-container {
  padding: 32px;

  :deep(.el-steps) {
    .el-step__head {
      .el-step__icon {
        width: 40px;
        height: 40px;
        border-width: 3px;
        font-size: 16px;
        font-weight: 600;
      }

      &.is-process .el-step__icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-color: #667eea;
      }

      &.is-finish .el-step__icon {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        border-color: #11998e;
      }
    }

    .el-step__title {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .el-step__description {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }

  .step-content {
    margin-top: 48px;
    min-height: 500px;
    padding: 32px;
    background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .step-panel {
    .step-header {
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid rgba(102, 126, 234, 0.1);

      h3 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .step-desc {
        margin: 0;
        color: var(--el-text-color-secondary);
        font-size: 15px;
        line-height: 1.6;
      }
    }

    .step-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 32px;
      align-items: center;

      .el-button {
        border-radius: 8px;
        font-weight: 500;
        padding: 12px 24px;
        height: auto;
      }
    }
  }

  .step-navigation {
    margin-top: 40px;
    padding-top: 32px;
    border-top: 2px solid rgba(0, 0, 0, 0.06);

    .nav-buttons {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
    }

    .nav-btn {
      min-width: 140px;
      height: 48px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      &:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      }

      &.nav-btn-prev {
        background: white;
        border: 2px solid #e4e7ed;

        &:not(:disabled):hover {
          border-color: #667eea;
          color: #667eea;
        }
      }

      &.nav-btn-next {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;

        &:not(:disabled):hover {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .step-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 20px;
      background: rgba(102, 126, 234, 0.1);
      border-radius: 20px;
      font-weight: 600;

      .current-step {
        font-size: 20px;
        color: #667eea;
      }

      .step-divider {
        color: #667eea;
        opacity: 0.5;
      }

      .total-steps {
        font-size: 16px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;

  .image-item {
    position: relative;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 16px;
    overflow: hidden;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .image-type-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 6px 14px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
      color: white;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      z-index: 1;
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

      &.shot_first {
        background: linear-gradient(135deg, rgba(17, 153, 142, 0.9) 0%, rgba(56, 239, 125, 0.9) 100%);
      }

      &.shot_last {
        background: linear-gradient(135deg, rgba(255, 183, 77, 0.9) 0%, rgba(255, 206, 84, 0.9) 100%);
      }
    }

    .image-thumb {
      width: 100%;
      height: 240px;
      object-fit: cover;
      display: block;
      cursor: zoom-in;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.02);
      }
    }

    .image-info {
      padding: 16px;
      background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);

      .image-prompt {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        line-height: 1.6;
        font-weight: 500;
      }

      .image-version {
        margin: 0;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        font-weight: 500;
      }
    }
  }
}

.audios-list,
.subtitles-list,
.videos-list {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .audio-item,
  .subtitle-item,
  .video-item {
    padding: 24px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 16px;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
      border-color: rgba(102, 126, 234, 0.3);
    }

    .audio-info,
    .subtitle-info,
    .video-info {
      margin-bottom: 16px;

      .audio-text,
      .subtitle-text {
        margin: 0 0 12px 0;
        font-size: 15px;
        color: var(--el-text-color-primary);
        line-height: 1.6;
        font-weight: 500;
      }

      .audio-meta,
      .subtitle-meta,
      .video-meta {
        margin: 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        font-weight: 500;
      }

      .video-error {
        margin: 8px 0 0 0;
        font-size: 13px;
        color: var(--el-color-error);
        padding: 8px 12px;
        background: rgba(245, 108, 108, 0.1);
        border-radius: 8px;
        border-left: 3px solid var(--el-color-error);
      }
    }

    .subtitle-download {
      display: inline-flex;
      align-items: center;
      padding: 8px 16px;
      color: white;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      transition: all 0.3s;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
      }
    }

    .audio-player,
    .video-player {
      width: 100%;
      margin-top: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .video-player {
      max-height: 500px;
    }

    .video-placeholder {
      padding: 60px 40px;
      text-align: center;
      background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
      border-radius: 12px;
      color: var(--el-text-color-secondary);
      border: 2px dashed rgba(0, 0, 0, 0.1);
      font-size: 15px;
      font-weight: 500;
    }
  }
}

.loading-container,
.loading-state {
  padding: 60px;
  text-align: center;
}

.empty-state {
  padding: 80px 40px;
  text-align: center;
  color: var(--el-text-color-secondary);
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 12px;
  border: 2px dashed rgba(0, 0, 0, 0.1);

  p {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
  }
}
</style>

