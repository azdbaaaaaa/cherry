<template>
  <div class="chapter-detail">
    <!-- 顶部导航栏 -->
    <header class="page-header glass">
      <div class="header-content">
        <div class="header-left">
          <el-button text @click="goBack" class="back-button">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <div>
            <h1 class="page-title">章节详情</h1>
            <p v-if="chapter" class="page-subtitle">
              第 {{ chapter.sequence }} 章：{{ chapter.title }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <el-button
            v-if="chapter"
            @click="goToNovelDetail"
          >
            <el-icon><Document /></el-icon>
            查看小说
          </el-button>
        </div>
      </div>
    </header>

    <main class="page-main">
      <div class="detail-container">
        <!-- 章节基本信息 -->
        <el-card class="info-card glass" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>章节信息</span>
            </div>
          </template>
          <div v-if="chapter">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="章节标题">
                {{ chapter.title }}
              </el-descriptions-item>
              <el-descriptions-item label="章节序号">
                第 {{ chapter.sequence }} 章
              </el-descriptions-item>
              <el-descriptions-item label="总字符数">
                {{ chapter.total_chars.toLocaleString() }}
              </el-descriptions-item>
              <el-descriptions-item label="字数">
                {{ chapter.word_count.toLocaleString() }}
              </el-descriptions-item>
              <el-descriptions-item label="行数">
                {{ chapter.line_count.toLocaleString() }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatDate(chapter.created_at) }}
              </el-descriptions-item>
            </el-descriptions>

            <!-- 章节内容预览 -->
            <el-collapse class="content-preview" v-model="activeCollapse">
              <el-collapse-item name="content" title="章节内容预览">
                <div class="chapter-content">
                  {{ chapter.chapter_text.substring(0, 500) }}
                  <span v-if="chapter.chapter_text.length > 500">...</span>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
          <el-empty v-else-if="!loading" description="章节不存在" />
        </el-card>

        <!-- 处理流程 -->
        <el-card class="process-card glass" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>处理流程</span>
              <el-button
                text
                type="primary"
                @click="refreshStatus"
                :loading="refreshing"
              >
                <el-icon><Refresh /></el-icon>
                刷新状态
              </el-button>
            </div>
          </template>

          <!-- 处理步骤 -->
          <el-steps
            :active="currentStep"
            finish-status="success"
            align-center
            class="process-steps"
          >
            <el-step title="生成解说" description="使用AI生成章节解说文案">
              <template #icon>
                <el-icon v-if="narrationStatus === 'completed'"><Check /></el-icon>
                <el-icon v-else-if="narrationStatus === 'processing'"><Loading /></el-icon>
                <el-icon v-else><EditPen /></el-icon>
              </template>
            </el-step>
            <el-step title="生成音频" description="基于解说生成TTS音频">
              <template #icon>
                <el-icon v-if="audioStatus === 'completed'"><Check /></el-icon>
                <el-icon v-else-if="audioStatus === 'processing'"><Loading /></el-icon>
                <el-icon v-else><VideoPlay /></el-icon>
              </template>
            </el-step>
            <el-step title="生成字幕" description="生成ASS格式字幕文件">
              <template #icon>
                <el-icon v-if="subtitleStatus === 'completed'"><Check /></el-icon>
                <el-icon v-else-if="subtitleStatus === 'processing'"><Loading /></el-icon>
                <el-icon v-else><Document /></el-icon>
              </template>
            </el-step>
            <el-step title="生成图片" description="生成章节配图">
              <template #icon>
                <el-icon v-if="imageStatus === 'completed'"><Check /></el-icon>
                <el-icon v-else-if="imageStatus === 'processing'"><Loading /></el-icon>
                <el-icon v-else><Picture /></el-icon>
              </template>
            </el-step>
            <el-step title="生成视频" description="生成narration视频">
              <template #icon>
                <el-icon v-if="videoStatus === 'completed'"><Check /></el-icon>
                <el-icon v-else-if="videoStatus === 'processing'"><Loading /></el-icon>
                <el-icon v-else><VideoCamera /></el-icon>
              </template>
            </el-step>
            <el-step title="最终视频" description="合并生成最终完整视频">
              <template #icon>
                <el-icon v-if="finalVideoStatus === 'completed'"><Check /></el-icon>
                <el-icon v-else-if="finalVideoStatus === 'processing'"><Loading /></el-icon>
                <el-icon v-else><Film /></el-icon>
              </template>
            </el-step>
          </el-steps>

          <!-- 处理状态卡片 -->
          <div class="status-cards">
            <!-- 解说状态 -->
            <el-card class="status-card">
              <div class="status-header">
                <div class="status-title">
                  <el-icon><EditPen /></el-icon>
                  <span>解说文案</span>
                </div>
                <el-tag :type="getStatusTagType(narrationStatus)">
                  {{ getStatusText(narrationStatus) }}
                </el-tag>
              </div>
              <div class="status-content">
                <p v-if="narrationStatus === 'none'" class="status-tip">
                  尚未生成解说文案
                </p>
                <div v-else-if="narration">
                  <div class="version-select">
                    <span class="label">选择版本：</span>
                    <el-select
                      v-model="selectedNarrationID"
                      size="small"
                      style="width: 220px"
                      placeholder="选择解说版本"
                      @change="handleNarrationSelect"
                    >
                      <el-option
                        v-for="n in narrationVersions"
                        :key="n.id"
                        :label="`v${n.version} · ${formatDate(n.created_at)}`"
                        :value="n.id"
                      />
                    </el-select>
                  </div>
                  <p><span class="label">版本：</span>v{{ narration.version }}</p>
                  <p><span class="label">创建时间：</span>{{ formatDate(narration.created_at) }}</p>
                </div>
              </div>
              <div class="status-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleGenerateNarration"
                  :loading="generatingNarration"
                  :disabled="narrationStatus === 'processing'"
                >
                  {{ narrationStatus === 'none' ? '生成解说' : '重新生成' }}
                </el-button>
                <el-button
                  v-if="narrationStatus === 'completed'"
                  size="small"
                  @click="openEditDialog"
                >
                  编辑并保存新版本
                </el-button>
              </div>
            </el-card>

            <!-- 音频状态 -->
            <el-card class="status-card">
              <div class="status-header">
                <div class="status-title">
                  <el-icon><VideoPlay /></el-icon>
                  <span>音频文件</span>
                </div>
                <el-tag :type="getStatusTagType(audioStatus)">
                  {{ getStatusText(audioStatus) }}
                </el-tag>
              </div>
              <div class="status-content">
                <p v-if="audioStatus === 'none'" class="status-tip">
                  需要先生成解说文案
                </p>
                <div v-else-if="audioStatus === 'completed'">
                  <p><span class="label">音频数量：</span>{{ audioCount }} 个</p>
                </div>
              </div>
              <div class="status-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleGenerateAudios"
                  :loading="generatingAudios"
                  :disabled="narrationStatus !== 'completed' || audioStatus === 'processing'"
                >
                  {{ audioStatus === 'none' ? '生成音频' : '重新生成' }}
                </el-button>
                <el-button
                  size="small"
                  @click="openAudioList"
                  :disabled="!selectedNarrationID"
                >
                  查看列表
                </el-button>
              </div>
            </el-card>

            <!-- 字幕状态 -->
            <el-card class="status-card">
              <div class="status-header">
                <div class="status-title">
                  <el-icon><Document /></el-icon>
                  <span>字幕文件</span>
                </div>
                <el-tag :type="getStatusTagType(subtitleStatus)">
                  {{ getStatusText(subtitleStatus) }}
                </el-tag>
              </div>
              <div class="status-content">
                <p v-if="subtitleStatus === 'none'" class="status-tip">
                  需要先生成音频文件
                </p>
                <div v-else-if="subtitleStatus === 'completed'">
                  <p><span class="label">字幕数量：</span>{{ subtitleCount }} 个</p>
                </div>
              </div>
              <div class="status-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleGenerateSubtitles"
                  :loading="generatingSubtitles"
                  :disabled="audioStatus !== 'completed' || subtitleStatus === 'processing'"
                >
                  {{ subtitleStatus === 'none' ? '生成字幕' : '重新生成' }}
                </el-button>
                <el-button
                  size="small"
                  @click="openSubtitleList"
                  :disabled="!selectedNarrationID"
                >
                  查看列表
                </el-button>
              </div>
            </el-card>

            <!-- 图片状态 -->
            <el-card class="status-card">
              <div class="status-header">
                <div class="status-title">
                  <el-icon><Picture /></el-icon>
                  <span>配图</span>
                </div>
                <el-tag :type="getStatusTagType(imageStatus)">
                  {{ getStatusText(imageStatus) }}
                </el-tag>
              </div>
              <div class="status-content">
                <p v-if="imageStatus === 'none'" class="status-tip">
                  需要先生成解说文案
                </p>
                <div v-else-if="imageStatus === 'completed'">
                  <p><span class="label">图片数量：</span>{{ imageCount }} 张</p>
                </div>
              </div>
              <div class="status-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleGenerateImages"
                  :loading="generatingImages"
                  :disabled="narrationStatus !== 'completed' || imageStatus === 'processing'"
                >
                  {{ imageStatus === 'none' ? '生成图片' : '重新生成' }}
                </el-button>
                <el-button
                  size="small"
                  @click="openImageList"
                  :disabled="!selectedNarrationID"
                >
                  查看列表
                </el-button>
              </div>
            </el-card>

            <!-- 视频状态 -->
            <el-card class="status-card">
              <div class="status-header">
                <div class="status-title">
                  <el-icon><VideoCamera /></el-icon>
                  <span>Narration 视频</span>
                </div>
                <el-tag :type="getStatusTagType(videoStatus)">
                  {{ getStatusText(videoStatus) }}
                </el-tag>
              </div>
              <div class="status-content">
                <p v-if="videoStatus === 'none'" class="status-tip">
                  需要先生成音频、字幕和图片
                </p>
                <div v-else-if="videoStatus === 'completed'">
                  <p><span class="label">视频数量：</span>{{ videoCount }} 个</p>
                </div>
                <div class="version-select" v-if="videoVersions.length">
                  <span class="label">合并/查看版本：</span>
                  <el-select
                    v-model="selectedVideoVersion"
                    size="small"
                    style="width: 160px"
                    placeholder="选择视频版本"
                    @change="mergeConfirmed = false"
                  >
                    <el-option
                      v-for="v in videoVersions"
                      :key="v"
                      :label="`v${v}`"
                      :value="v"
                    />
                  </el-select>
                </div>
              </div>
              <div class="status-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleGenerateVideos"
                  :loading="generatingVideos"
                  :disabled="
                    audioStatus !== 'completed' ||
                    subtitleStatus !== 'completed' ||
                    imageStatus !== 'completed' ||
                    videoStatus === 'processing'
                  "
                >
                  {{ videoStatus === 'none' ? '生成视频' : '重新生成' }}
                </el-button>
                <el-button
                  size="small"
                  @click="openVideoList"
                  :disabled="!chapter"
                >
                  查看列表
                </el-button>
              </div>
            </el-card>

            <!-- 最终视频状态 -->
            <el-card class="status-card">
              <div class="status-header">
                <div class="status-title">
                  <el-icon><Film /></el-icon>
                  <span>最终视频</span>
                </div>
                <el-tag :type="getStatusTagType(finalVideoStatus)">
                  {{ getStatusText(finalVideoStatus) }}
                </el-tag>
              </div>
              <div class="status-content">
                <p v-if="finalVideoStatus === 'none'" class="status-tip">
                  需要先生成所有 narration 视频
                </p>
                <template v-if="finalVideoStatus !== 'completed'">
                  <div v-if="selectedVideoVersion" class="status-tip">
                    将合并视频版本：v{{ selectedVideoVersion }}
                  </div>
                  <el-checkbox
                    v-model="mergeConfirmed"
                    :disabled="!selectedVideoVersion"
                  >
                    我已人工确认该版本镜头视频可用于合并
                  </el-checkbox>
                </template>
                <div v-else-if="finalVideoStatus === 'completed'">
                  <p><span class="label">视频ID：</span>{{ finalVideoId }}</p>
                </div>
              </div>
              <div class="status-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleGenerateFinalVideo"
                  :loading="generatingFinalVideo"
                  :disabled="videoStatus !== 'completed' || finalVideoStatus === 'processing'"
                >
                  {{ finalVideoStatus === 'none' ? '生成最终视频' : '重新生成' }}
                </el-button>
                <el-button
                  v-if="finalVideoStatus === 'completed'"
                  size="small"
                  @click="viewFinalVideo"
                >
                  查看视频
                </el-button>
              </div>
            </el-card>
          </div>
        </el-card>
      </div>
    </main>

    <!-- 编辑解说并保存为新版本 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑解说(JSON)并保存为新版本"
      width="900px"
      destroy-on-close
    >
      <div class="edit-tip">
        说明：这里编辑的是解说的结构化 JSON（scenes/shots）。保存后会生成一个新的解说版本（新 narration_id + version），用于后续音频/字幕/图片/视频生成与版本对比。
      </div>

      <el-form label-width="90px">
        <el-form-item label="当前镜头">
          <el-button size="small" @click="rebuildEditJSON" :disabled="!selectedNarrationID">
            从当前版本重建 JSON
          </el-button>
          <span class="muted" v-if="editShots.length">已加载 {{ editShots.length }} 个镜头</span>
        </el-form-item>
        <el-form-item label="JSON 内容">
          <el-input
            v-model="editNarrationJSON"
            type="textarea"
            :rows="18"
            placeholder="请输入解说 JSON（至少包含 scenes 字段）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="savingManual"
          @click="saveAsNewNarrationVersion"
        >
          保存为新版本
        </el-button>
      </template>
    </el-dialog>

    <!-- 音频列表 -->
    <el-dialog v-model="audioDialogVisible" :title="`音频列表（v${audioListVersion || '-'}）`" width="900px">
      <div class="asset-toolbar">
        <span class="label">查看版本：</span>
        <el-input-number v-model="audioQueryVersion" :min="1" :controls="false" size="small" style="width: 120px" />
        <el-button size="small" @click="openAudioList">刷新</el-button>
        <span class="muted">留空表示最新版本</span>
      </div>
      <el-table :data="audioList" height="520">
        <el-table-column prop="sequence" label="序号" width="80" />
        <el-table-column prop="duration" label="时长(s)" width="100" />
        <el-table-column prop="audio_resource_id" label="ResourceID" min-width="220" />
        <el-table-column prop="text" label="文本" min-width="260" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="openResource(row.audio_resource_id)">预览</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 字幕列表 -->
    <el-dialog v-model="subtitleDialogVisible" :title="`字幕列表（v${subtitleListVersion || '-'}）`" width="900px">
      <div class="asset-toolbar">
        <span class="label">查看版本：</span>
        <el-input-number v-model="subtitleQueryVersion" :min="1" :controls="false" size="small" style="width: 120px" />
        <el-button size="small" @click="openSubtitleList">刷新</el-button>
        <span class="muted">留空表示最新版本</span>
      </div>
      <el-table :data="subtitleList" height="520">
        <el-table-column prop="sequence" label="序号" width="80" />
        <el-table-column prop="format" label="格式" width="80" />
        <el-table-column prop="subtitle_resource_id" label="ResourceID" min-width="260" />
        <el-table-column prop="prompt" label="Prompt" min-width="260" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="openResource(row.subtitle_resource_id)">预览</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 图片列表 -->
    <el-dialog v-model="imageDialogVisible" :title="`图片列表（v${imageListVersion || '-'}）`" width="980px">
      <div class="asset-toolbar">
        <span class="label">查看版本：</span>
        <el-input-number v-model="imageQueryVersion" :min="1" :controls="false" size="small" style="width: 120px" />
        <el-button size="small" @click="openImageList">刷新</el-button>
        <span class="muted">留空表示最新版本</span>
      </div>
      <el-table :data="imageList" height="520">
        <el-table-column prop="sequence" label="序号" width="80" />
        <el-table-column prop="scene_number" label="场景" width="80" />
        <el-table-column prop="shot_number" label="镜头" width="80" />
        <el-table-column prop="character_name" label="角色" width="120" />
        <el-table-column prop="image_resource_id" label="ResourceID" min-width="240" />
        <el-table-column prop="prompt" label="Prompt" min-width="260" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="openResource(row.image_resource_id)">预览</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 视频列表 -->
    <el-dialog v-model="videoDialogVisible" :title="`视频列表（v${videoListVersion || '-'}）`" width="980px">
      <el-table :data="videoList" height="520">
        <el-table-column prop="sequence" label="序号" width="80" />
        <el-table-column prop="video_type" label="类型" width="130" />
        <el-table-column prop="duration" label="时长(s)" width="100" />
        <el-table-column prop="video_resource_id" label="ResourceID" min-width="260" />
        <el-table-column prop="prompt" label="Prompt" min-width="260" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="openResource(row.video_resource_id)">预览</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  Document,
  Refresh,
  Check,
  Loading,
  EditPen,
  VideoPlay,
  Picture,
  VideoCamera,
  Film
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { novelApi } from '@/api/novel'
import { resourceApi } from '@/api/resource'
import { useUserStore } from '@/stores/user'
import type {
  Chapter,
  Narration,
  ShotInfo,
  ManualNarrationRequest,
  Audio,
  Subtitle,
  Image,
  Video
} from '@/types/novel'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const refreshing = ref(false)
const chapter = ref<Chapter | null>(null)
const narration = ref<Narration | null>(null)

// 解说版本列表与选择
const narrationVersions = ref<Narration[]>([])
const selectedNarrationID = ref<string>('')

// 编辑解说（JSON）
const editDialogVisible = ref(false)
const editNarrationJSON = ref('')
const editShots = ref<ShotInfo[]>([])
const savingManual = ref(false)

// 资产列表预览（用于版本比对）
const audioDialogVisible = ref(false)
const subtitleDialogVisible = ref(false)
const imageDialogVisible = ref(false)
const videoDialogVisible = ref(false)

const audioList = ref<Audio[]>([])
const subtitleList = ref<Subtitle[]>([])
const imageList = ref<Image[]>([])
const videoList = ref<Video[]>([])

const audioListVersion = ref<number>(0)
const subtitleListVersion = ref<number>(0)
const imageListVersion = ref<number>(0)
const videoListVersion = ref<number>(0)

const audioQueryVersion = ref<number | null>(null)
const subtitleQueryVersion = ref<number | null>(null)
const imageQueryVersion = ref<number | null>(null)

// 最终合并：选择 narration 视频版本 + 人工确认
const videoVersions = ref<number[]>([])
const selectedVideoVersion = ref<number>(0)
const mergeConfirmed = ref(false)

// 处理状态
const narrationStatus = ref<'none' | 'processing' | 'completed' | 'failed'>('none')
const audioStatus = ref<'none' | 'processing' | 'completed' | 'failed'>('none')
const subtitleStatus = ref<'none' | 'processing' | 'completed' | 'failed'>('none')
const imageStatus = ref<'none' | 'processing' | 'completed' | 'failed'>('none')
const videoStatus = ref<'none' | 'processing' | 'completed' | 'failed'>('none')
const finalVideoStatus = ref<'none' | 'processing' | 'completed' | 'failed'>('none')

// 数量统计
const audioCount = ref(0)
const subtitleCount = ref(0)
const imageCount = ref(0)
const videoCount = ref(0)
const finalVideoId = ref('')

// 生成中状态
const generatingNarration = ref(false)
const generatingAudios = ref(false)
const generatingSubtitles = ref(false)
const generatingImages = ref(false)
const generatingVideos = ref(false)
const generatingFinalVideo = ref(false)

// 折叠面板
const activeCollapse = ref<string[]>([])

// 轮询定时器
let pollTimer: number | null = null

// 计算当前步骤
const currentStep = computed(() => {
  if (finalVideoStatus.value === 'completed') return 6
  if (videoStatus.value === 'completed') return 5
  if (imageStatus.value === 'completed') return 4
  if (subtitleStatus.value === 'completed') return 3
  if (audioStatus.value === 'completed') return 2
  if (narrationStatus.value === 'completed') return 1
  return 0
})

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

// 获取状态标签类型
const getStatusTagType = (status: string): string => {
  const map: Record<string, string> = {
    none: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return map[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    none: '未处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return map[status] || status
}

// 获取章节信息
const fetchChapter = async () => {
  const chapterId = route.params.chapterId as string
  if (!chapterId) return

  loading.value = true
  try {
    // 通过章节列表获取（因为后端没有单独的获取章节接口）
    const novelId = route.query.novel_id as string
    if (novelId) {
      const result = await novelApi.getChapters(novelId)
      const found = result.chapters.find(c => c.id === chapterId)
      if (found) {
        chapter.value = found
        // 获取章节后，加载解说版本列表
        await loadNarrations()
      } else {
        ElMessage.error('章节不存在')
      }
    } else {
      ElMessage.error('缺少小说ID参数')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取章节信息失败')
    console.error('获取章节信息失败:', error)
  } finally {
    loading.value = false
  }
}

const loadNarrations = async () => {
  if (!chapter.value) return

  try {
    const res = await novelApi.listNarrations(chapter.value.id)
    narrationVersions.value = res.narrations || []

    if (narrationVersions.value.length === 0) {
      narrationStatus.value = 'none'
      narration.value = null
      selectedNarrationID.value = ''
      return
    }

    // 优先保持当前选择；否则选择最新版本（后端已按 version desc 排序）
    const keepID = selectedNarrationID.value
    const canKeep = keepID && narrationVersions.value.some(n => n.id === keepID)
    await selectNarration(canKeep ? keepID : narrationVersions.value[0].id)
  } catch (error: any) {
    console.error('获取解说版本列表失败:', error)
  }
}

const selectNarration = async (narrationId: string) => {
  const selected = narrationVersions.value.find(n => n.id === narrationId)
  if (!selected) return

  narration.value = selected
  selectedNarrationID.value = selected.id
  narrationStatus.value = selected.status as any
}

const handleNarrationSelect = async (narrationId: string) => {
  await selectNarration(narrationId)
}

// 刷新状态
const refreshStatus = async () => {
  refreshing.value = true
  try {
    await Promise.all([
      loadNarrations(),
      // TODO: 添加获取音频、字幕、图片、视频状态的接口调用
    ])
    ElMessage.success('状态已刷新')
  } catch (error) {
    console.error('刷新状态失败:', error)
  } finally {
    refreshing.value = false
  }
}

// 生成解说
const handleGenerateNarration = async () => {
  if (!chapter.value) return

  generatingNarration.value = true
  narrationStatus.value = 'processing'

  try {
    const res = await novelApi.generateNarration(chapter.value.id)
    ElMessage.success(`解说生成成功（v${res.version}）`)

    // 刷新版本列表并定位到新版本
    await loadNarrations()
    if (res.narration_id) {
      await selectNarration(res.narration_id)
    }
    
    // 开始轮询状态
    startPolling()
  } catch (error: any) {
    ElMessage.error(error.message || '生成解说失败')
    narrationStatus.value = 'failed'
    console.error('生成解说失败:', error)
  } finally {
    generatingNarration.value = false
  }
}

// 生成音频
const handleGenerateAudios = async () => {
  if (!selectedNarrationID.value) return

  generatingAudios.value = true
  audioStatus.value = 'processing'

  try {
    const result = await novelApi.generateAudios(selectedNarrationID.value)
    ElMessage.success(`音频生成任务已提交，将生成 ${result.count} 个音频文件`)
    audioCount.value = result.count
    
    // 开始轮询状态
    startPolling()
  } catch (error: any) {
    ElMessage.error(error.message || '生成音频失败')
    audioStatus.value = 'failed'
    console.error('生成音频失败:', error)
  } finally {
    generatingAudios.value = false
  }
}

// 生成字幕
const handleGenerateSubtitles = async () => {
  if (!selectedNarrationID.value) return

  generatingSubtitles.value = true
  subtitleStatus.value = 'processing'

  try {
    const result = await novelApi.generateSubtitles(selectedNarrationID.value)
    ElMessage.success(`字幕生成任务已提交，将生成 ${result.count} 个字幕文件`)
    subtitleCount.value = result.count
    
    // 开始轮询状态
    startPolling()
  } catch (error: any) {
    ElMessage.error(error.message || '生成字幕失败')
    subtitleStatus.value = 'failed'
    console.error('生成字幕失败:', error)
  } finally {
    generatingSubtitles.value = false
  }
}

// 生成图片
const handleGenerateImages = async () => {
  if (!selectedNarrationID.value) return

  generatingImages.value = true
  imageStatus.value = 'processing'

  try {
    const result = await novelApi.generateImages(selectedNarrationID.value)
    ElMessage.success(`图片生成任务已提交，将生成 ${result.count} 张图片`)
    imageCount.value = result.count
    
    // 开始轮询状态
    startPolling()
  } catch (error: any) {
    ElMessage.error(error.message || '生成图片失败')
    imageStatus.value = 'failed'
    console.error('生成图片失败:', error)
  } finally {
    generatingImages.value = false
  }
}

// 生成视频
const handleGenerateVideos = async () => {
  if (!chapter.value) return

  generatingVideos.value = true
  videoStatus.value = 'processing'

  try {
    const result = await novelApi.generateShotVideos(chapter.value.id)
    ElMessage.success(`视频生成任务已提交，将生成 ${result.count} 个视频`)
    videoCount.value = result.count
    
    // 开始轮询状态
    startPolling()
  } catch (error: any) {
    ElMessage.error(error.message || '生成视频失败')
    videoStatus.value = 'failed'
    console.error('生成视频失败:', error)
  } finally {
    generatingVideos.value = false
  }
}

// 生成最终视频
const handleGenerateFinalVideo = async () => {
  if (!chapter.value) return
  if (!selectedVideoVersion.value) {
    ElMessage.error('请先选择要合并的视频版本')
    return
  }
  if (!mergeConfirmed.value) {
    ElMessage.warning('请先人工确认后再合并生成最终视频')
    return
  }

  generatingFinalVideo.value = true
  finalVideoStatus.value = 'processing'

  try {
    const result = await novelApi.generateFinalVideoWithVersion(chapter.value.id, selectedVideoVersion.value)
    ElMessage.success(`最终视频生成任务已提交（合并 v${selectedVideoVersion.value}）`)
    finalVideoId.value = result.video_id
    
    // 开始轮询状态
    startPolling()
  } catch (error: any) {
    ElMessage.error(error.message || '生成最终视频失败')
    finalVideoStatus.value = 'failed'
    console.error('生成最终视频失败:', error)
  } finally {
    generatingFinalVideo.value = false
  }
}

const openEditDialog = async () => {
  if (!chapter.value || !selectedNarrationID.value) return

  try {
    const res = await novelApi.getShots(selectedNarrationID.value)
    editShots.value = res.shots || []
    rebuildEditJSON()
    editDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '加载镜头失败')
    console.error('加载镜头失败:', error)
  }
}

const rebuildEditJSON = () => {
  // 生成最小可解析结构：{ scenes: [...] }
  const sceneMap: Record<string, ShotInfo[]> = {}
  for (const shot of editShots.value) {
    const sn = shot.scene_number || '1'
    if (!sceneMap[sn]) sceneMap[sn] = []
    sceneMap[sn].push(shot)
  }
  const sceneNumbers = Object.keys(sceneMap).sort((a, b) => Number(a) - Number(b))
  const scenes = sceneNumbers.map(sceneNumber => {
    const shots = (sceneMap[sceneNumber] || [])
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .map(s => ({
        closeup_number: s.shot_number,
        character: s.character || '',
        narration: s.narration || '',
        scene_prompt: s.scene_prompt || '',
        video_prompt: s.video_prompt || ''
      }))
    return {
      scene_number: sceneNumber,
      shots
    }
  })

  editNarrationJSON.value = JSON.stringify({ scenes }, null, 2)
}

const saveAsNewNarrationVersion = async () => {
  if (!chapter.value) return
  if (!userStore.user?.id) {
    ElMessage.error('用户未登录，无法保存新版本')
    return
  }

  savingManual.value = true
  try {
    const payload: ManualNarrationRequest = {
      user_id: userStore.user.id,
      narration_text: editNarrationJSON.value
    }
    const res = await novelApi.createNarrationManual(chapter.value.id, payload)
    ElMessage.success(`已保存为新版本 v${res.version}`)

    editDialogVisible.value = false

    // 刷新并切换到新版本
    await loadNarrations()
    if (res.narration_id) {
      await selectNarration(res.narration_id)
    }
  } catch (error: any) {
    ElMessage.error(error.message || '保存新版本失败')
    console.error('保存新版本失败:', error)
  } finally {
    savingManual.value = false
  }
}

const openResource = async (resourceId: string) => {
  try {
    const res = await resourceApi.getDownloadURL(resourceId)
    if (res.download_url) {
      window.open(res.download_url, '_blank')
    } else {
      ElMessage.error('无法获取下载链接')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取下载链接失败')
    console.error('获取下载链接失败:', error)
  }
}

const loadVideoVersionList = async () => {
  if (!chapter.value) return
  try {
    const res = await novelApi.getVideoVersions(chapter.value.id)
    videoVersions.value = res.versions || []
    if (videoVersions.value.length > 0) {
      selectedVideoVersion.value = Math.max(...videoVersions.value)
    }
  } catch (error) {
    console.error('获取视频版本失败:', error)
  }
}

const openAudioList = async () => {
  if (!selectedNarrationID.value) return
  const res = await novelApi.listAudios(
    selectedNarrationID.value,
    audioQueryVersion.value || undefined
  )
  audioList.value = res.audios || []
  audioListVersion.value = res.version
  audioDialogVisible.value = true
}

const openSubtitleList = async () => {
  if (!selectedNarrationID.value) return
  const res = await novelApi.listSubtitles(
    selectedNarrationID.value,
    subtitleQueryVersion.value || undefined
  )
  subtitleList.value = res.subtitles || []
  subtitleListVersion.value = res.version
  subtitleDialogVisible.value = true
}

const openImageList = async () => {
  if (!selectedNarrationID.value) return
  const res = await novelApi.listImages(
    selectedNarrationID.value,
    imageQueryVersion.value || undefined
  )
  imageList.value = res.images || []
  imageListVersion.value = res.version
  imageDialogVisible.value = true
}

const openVideoList = async () => {
  if (!chapter.value) return
  const res = await novelApi.listVideos(chapter.value.id, selectedVideoVersion.value || undefined)
  videoList.value = res.videos || []
  videoListVersion.value = res.version
  videoDialogVisible.value = true
}

// 查看最终视频
const viewFinalVideo = () => {
  // TODO: 跳转到视频播放页或显示弹窗
  ElMessage.info('查看视频功能开发中')
}

// 开始轮询状态
const startPolling = () => {
  // 清除之前的定时器
  if (pollTimer) {
    clearInterval(pollTimer)
  }

  // 每5秒轮询一次状态
  pollTimer = window.setInterval(() => {
    refreshStatus()
  }, 5000)
}

// 停止轮询
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 前往小说详情页
const goToNovelDetail = () => {
  if (chapter.value) {
    router.push(`/novel/${chapter.value.novel_id}`)
  }
}

// 返回
const goBack = () => {
  router.back()
}

onMounted(async () => {
  await fetchChapter()
  await loadVideoVersionList()
  // 如果有处理中的任务，开始轮询
  if (chapter.value && (
    narrationStatus.value === 'processing' ||
    audioStatus.value === 'processing' ||
    subtitleStatus.value === 'processing' ||
    imageStatus.value === 'processing' ||
    videoStatus.value === 'processing' ||
    finalVideoStatus.value === 'processing'
  )) {
    startPolling()
  }
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.chapter-detail {
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
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  margin: 0;
}

.page-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: var(--spacing-xs) 0 0 0;
}

/* 主要内容 */
.page-main {
  padding: var(--spacing-xl) 0;
}

.detail-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

/* 卡片样式 */
.info-card,
.process-card {
  border-radius: var(--border-radius-xl);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: var(--text-primary);
}

/* 章节内容预览 */
.content-preview {
  margin-top: var(--spacing-lg);
}

.chapter-content {
  max-height: 300px;
  overflow-y: auto;
  line-height: 1.8;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* 处理步骤 */
.process-steps {
  margin-bottom: var(--spacing-2xl);
  padding: var(--spacing-xl) 0;
}

/* 状态卡片网格 */
.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.status-card {
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-base);
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.status-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.status-content {
  margin-bottom: var(--spacing-md);
  min-height: 60px;
}

.status-tip {
  color: var(--text-tertiary);
  font-size: 0.9rem;
  margin: 0;
}

.status-content p {
  margin: var(--spacing-xs) 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.status-content .label {
  font-weight: 600;
  color: var(--text-primary);
}

.status-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

.asset-toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.muted {
  color: var(--text-tertiary);
  font-size: 0.85rem;
}

.version-select {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .status-cards {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
}
</style>

