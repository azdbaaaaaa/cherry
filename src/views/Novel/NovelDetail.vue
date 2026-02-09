<template>
  <div class="novel-detail fullscreen">
    <!-- 沉浸式顶部栏 -->
    <div class="immersive-header">
        <div class="header-left">
          <button
          @click="router.push('/novel')"
          class="back-button"
        >
          <svg class="icon-arrow-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>返回</span>
          </button>
        <h1 class="novel-title">{{ novel?.title || '剧本详情' }}</h1>
        <span v-if="selectedChapter" class="chapter-title-header">
          第 {{ selectedChapter.sequence }} 章：{{ selectedChapter.title || `第 ${selectedChapter.sequence} 章` }}
        </span>
      </div>
      <div class="header-right">
        <div class="user-avatar">
          <svg class="icon-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="page-content">
      <div class="content-wrapper">
        <!-- 主内容区域 -->
        <div class="main-content">
      <div class="content-container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <div class="skeleton-loader">
            <div class="skeleton-item skeleton-title"></div>
            <div class="skeleton-item skeleton-line" style="width: 60%;"></div>
            <div class="skeleton-item skeleton-line"></div>
            <div class="skeleton-item skeleton-line" style="width: 80%;"></div>
            <div class="skeleton-item skeleton-line"></div>
          </div>
        </div>
        
        <!-- 剧本详情 -->
            <div v-else-if="novel">
          <!-- 场景和镜头内容 -->
          <div class="step-content">
            <!-- 顶部工具栏：剧本信息 + 章节信息 -->
            <div class="top-toolbar">
                  <!-- 左侧：剧本和章节基本信息（紧凑显示） -->
                  <div class="toolbar-left">
                    <div class="novel-basic-info">
                      <span class="novel-name">{{ novel.title || '未命名剧本' }}</span>
                      <span class="novel-meta">
                        <span>{{ getStyleLabel(novel.style) }}</span>
                        <span class="meta-divider">·</span>
                        <span v-if="selectedChapter">第 {{ selectedChapter.sequence }} 章：{{ selectedChapter.title || `第 ${selectedChapter.sequence} 章` }}</span>
                        <span v-else>{{ chapters.length }} 章</span>
                      </span>
              </div>
                </div>

                  <!-- 右侧：切分章节 -->
                  <div class="toolbar-right">
                    <div v-if="chapters.length === 0" class="toolbar-generate">
                      <button
                        @click="handleSplitChapters"
                        :disabled="splittingChapters"
                        class="generate-button generate-button--toolbar"
                      >
                        <span v-if="splittingChapters" class="button-spinner"></span>
                        <span>{{ splittingChapters ? '切分中...' : '切分章节' }}</span>
                      </button>
                      <!-- 进度条和说明 -->
                      <div v-if="splittingChapters" class="generate-progress generate-progress--toolbar">
                        <div class="progress-bar-container">
                          <div class="progress-bar" :style="{ width: `${splitProgress.percentage}%` }"></div>
                        </div>
                        <div class="progress-info">
                          <span class="progress-text">{{ splitProgress.percentage }}%</span>
                          <span class="progress-message">{{ splitProgress.message || '正在切分章节...' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            
            <!-- 第一步：场景和镜头内容（无 tab） -->
            <div class="step-content-panel">
                  <div class="panel-header">
                            <div class="panel-title-group">
                    <span class="panel-title">场景列表（共 {{ scenes.length }} 个场景，{{ totalShots }} 个镜头）</span>
                              <span v-if="selectedChapter" class="panel-subtitle">
                                当前章节：{{ selectedChapter.title || `第 ${selectedChapter.sequence} 章` }}
                                <span v-if="selectedChapter.active_scene_version" class="version-badge">
                                  版本 v{{ selectedChapter.active_scene_version }}
                                </span>
                              </span>
                            </div>
                            <div class="panel-actions">
                              <div class="panel-toggle-buttons">
                                <button 
                                  @click="showImagePrompts = !showImagePrompts"
                                  class="toggle-button"
                                  :class="{ 'is-active': showImagePrompts }"
                                  title="显示/隐藏图片提示词"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21 15 16 10 5 21"/>
                                  </svg>
                                  <span>图片提示词</span>
                                </button>
                                <button 
                                  @click="showVideoPrompts = !showVideoPrompts"
                                  class="toggle-button"
                                  :class="{ 'is-active': showVideoPrompts }"
                                  title="显示/隐藏视频提示词"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="23 7 16 12 23 17 23 7"/>
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                                  </svg>
                                  <span>视频提示词</span>
                                </button>
                              </div>
                              <!-- 版本切换下拉菜单 -->
                              <div v-if="selectedChapter && availableVersions.length > 0" class="version-selector">
                                <select 
                                  :value="selectedChapter.active_scene_version || availableVersions[0]"
                                  @change="handleVersionChange"
                                  class="version-select"
                                  :disabled="switchingVersion"
                                >
                                  <option 
                                    v-for="version in availableVersions" 
                                    :key="version" 
                                    :value="version"
                                  >
                                    版本 v{{ version }}{{ version === selectedChapter.active_scene_version ? ' (当前)' : '' }}
                                  </option>
                                </select>
                              </div>
                    <button 
                      v-if="selectedChapter" 
                      @click="handleGenerateScenes"
                      :disabled="generating"
                      class="action-button action-button--primary"
                    >
                      <span v-if="generating" class="button-spinner"></span>
                      <span>{{ generating ? '生成中...' : generateButtonText }}</span>
                    </button>
                              <div v-else class="panel-hint">请先选择章节</div>
                            </div>
                  </div>
                          
                          <!-- 场景卡片列表 -->
                          <div class="scenes-list" :class="{ 'is-loading': loadingScenes }">
                            <div v-if="loadingScenes" class="scenes-loading-overlay">
                      <div class="loading-spinner"></div>
                    </div>
                            
                      <div 
                        v-for="scene in scenesWithShots" 
                        :key="scene.id"
                              class="scene-card"
                            >
                              <!-- 场景标题栏 -->
                              <div class="scene-header">
                                <h3 class="scene-title">
                                  Scene{{ scene.sequence }}: {{ scene.description || '未命名场景' }}
                                </h3>
                                <div class="scene-actions">
                                  <button class="scene-action-btn" title="复制场景">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                                  </button>
                                  <button class="scene-action-btn" title="删除场景">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <polyline points="3 6 5 6 21 6"/>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                  </button>
                                  <button class="scene-action-btn" title="添加场景">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <line x1="12" y1="5" x2="12" y2="19"/>
                                      <line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                  </button>
                  </div>
                </div>
                              
                              <!-- 镜头列表 -->
                              <div v-if="scene.shots && scene.shots.length > 0" class="shots-list">
                                <div 
                                  v-for="shot in scene.shots" 
                                  :key="shot.id"
                                  class="shot-item shot-item-clickable"
                                  @click="goToShotDetail(shot.id)"
                                >
                                  <!-- 镜头标题 -->
                                  <div class="shot-header">
                                    <span class="shot-label">Shot{{ shot.sequence }}</span>
                                    <svg class="shot-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <path d="M9 18l6-6-6-6"/>
                                    </svg>
                                  </div>
                                  
                                  <!-- 镜头内容区域 -->
                                  <div class="shot-content">
                                    <div class="shot-info-preview">
                                      <div class="shot-info-item">
                                        <span class="shot-info-label">旁白：</span>
                                        <span class="shot-info-value">{{ shot.narration || '-' }}</span>
                          </div>
                                      <div v-if="showImagePrompts && shot.first_image_prompt" class="shot-info-item">
                                        <span class="shot-info-label">首图提示词：</span>
                                        <span class="shot-info-value">{{ shot.first_image_prompt }}</span>
                          </div>
                                      <div v-if="showImagePrompts && shot.last_image_prompt" class="shot-info-item">
                                        <span class="shot-info-label">尾图提示词：</span>
                                        <span class="shot-info-value">{{ shot.last_image_prompt }}</span>
                          </div>
                                      <div v-if="showVideoPrompts && shot.video_prompt" class="shot-info-item">
                                        <span class="shot-info-label">视频提示词：</span>
                                        <span class="shot-info-value">{{ shot.video_prompt }}</span>
                        </div>
                              </div>
                                  </div>
                                  </div>
                                  </div>
                              <div v-else class="no-shots-in-scene">
                                <p>该场景暂无镜头</p>
                        </div>
                      </div>
                            
                            <!-- 空状态 -->
                            <div v-if="scenesWithShots.length === 0 && !loadingScenes" class="scenes-empty">
                              <div class="empty-state-content">
                                <svg class="empty-icon" viewBox="0 0 64 64" fill="none">
                                  <circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
                                  <path d="M32 20v24M20 32h24" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                <p class="empty-text">暂无场景数据</p>
                              </div>
                            </div>
                          </div>
            </div>
          </div>
            </div>

            <!-- 错误状态 -->
            <div v-else class="empty-state">
              <div class="empty-state-content">
                <svg class="empty-icon" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
                  <path d="M32 20v24M20 32h24" stroke="currentColor" stroke-width="2"/>
                </svg>
                <p class="empty-text">剧本不存在或加载失败</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { novelApi } from '@/api/novel'
import type { Novel, Chapter, SceneInfo, ShotInfo, Character, Prop } from '@/types/novel'

// 扩展 SceneInfo 类型，包含镜头列表
interface SceneWithShots extends SceneInfo {
  shots?: ShotInfo[]
}

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const novel = ref<Novel | null>(null)
const chapters = ref<Chapter[]>([])

// 步骤相关
const currentStep = ref(1) // 当前步骤：1-内容生成, 2-转换, 3-视频生成, 4-合并

// 第一步：内容生成相关
const activeTab = ref('scenes') // 当前tab：根据步骤动态变化
const scenes = ref<SceneInfo[]>([])
const shots = ref<ShotInfo[]>([])
const characters = ref<Character[]>([])
const props = ref<Prop[]>([])
const selectedChapter = ref<Chapter | null>(null)
const expandedScenes = ref<Set<string>>(new Set()) // 展开的场景ID集合
const selectedShots = ref<Record<string, string>>({}) // 每个场景选中的镜头ID
const shotSubtitles = ref<Record<string, string>>({}) // 每个镜头的字幕内容
const shotDescriptions = ref<Record<string, string>>({}) // 每个镜头的描述内容（视频提示词）
const shotFirstImagePrompts = ref<Record<string, string>>({}) // 每个镜头的首图提示词
const shotLastImagePrompts = ref<Record<string, string>>({}) // 每个镜头的末图提示词
const expandedShotFields = ref<Record<string, Set<string>>>({}) // 展开的镜头字段（sceneId-shotId-fieldName）
const characterDescriptions = ref<Record<string, string>>({}) // 每个角色的描述内容
const characterImagePrompts = ref<Record<string, string>>({}) // 每个角色的图片提示词
const propDescriptions = ref<Record<string, string>>({}) // 每个道具的描述内容
const propImagePrompts = ref<Record<string, string>>({}) // 每个道具的图片提示词
const expandedCharacterFields = ref<Record<string, Set<string>>>({}) // 展开的角色字段（characterId-fieldName）
const expandedPropFields = ref<Record<string, Set<string>>>({}) // 展开的道具字段（propId-fieldName）
const showImagePrompts = ref(true) // 是否显示图片提示词（首图和末图）
const showVideoPrompts = ref(true) // 是否显示视频提示词
const switchingVersion = ref(false) // 是否正在切换版本

// 第三步：视频生成相关
const audios = ref<import('@/types/novel').Audio[]>([]) // 音频列表
const videos = ref<import('@/types/novel').Video[]>([]) // 视频列表
const loadingAudios = ref(false) // 加载音频中
const loadingVideos = ref(false) // 加载视频中
const generatingAudios = ref(false) // 生成音频中
const generatingVideos = ref(false) // 生成视频中
const generatingSingleAudio = ref<string | null>(null) // 正在生成单个音频的 shot ID
const generatingSingleVideo = ref<string | null>(null) // 正在生成单个视频的 shot ID

// 判断是否已经生成过内容（generation_status 不为空且不是 none）
const hasGeneratedContent = computed(() => {
  if (!novel.value) return false
  const status = novel.value.generation_status
  // 如果状态为空、none、或者已完成、失败，都认为已经生成过
  return status !== '' && status !== undefined && status !== null
})


// 切换场景展开/收起
const toggleScene = (sceneId: string) => {
  if (expandedScenes.value.has(sceneId)) {
    expandedScenes.value.delete(sceneId)
  } else {
    expandedScenes.value.add(sceneId)
  }
}

// 选择镜头
const selectShot = (sceneId: string, shotId: string) => {
  selectedShots.value[sceneId] = shotId
}

// 展开字段
const expandField = (sceneId: string, shotId: string, fieldName: string) => {
  // 先收起所有已展开的字段
  Object.keys(expandedShotFields.value).forEach(sId => {
    expandedShotFields.value[sId] = new Set()
  })
  
  // 展开当前字段
  const key = `${sceneId}-${shotId}-${fieldName}`
  if (!expandedShotFields.value[sceneId]) {
    expandedShotFields.value[sceneId] = new Set()
  }
  expandedShotFields.value[sceneId].add(key)
}

// 收起字段
const collapseField = (sceneId: string, shotId: string, fieldName: string) => {
  const key = `${sceneId}-${shotId}-${fieldName}`
  if (expandedShotFields.value[sceneId]) {
    // 创建新的 Set 以确保响应式更新
    const newSet = new Set(expandedShotFields.value[sceneId])
    newSet.delete(key)
    expandedShotFields.value[sceneId] = newSet
  }
}

// 检查字段是否展开
const isFieldExpanded = (sceneId: string, shotId: string, fieldName: string) => {
  const key = `${sceneId}-${shotId}-${fieldName}`
  return expandedShotFields.value[sceneId]?.has(key) || false
}

// 复制文本
const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

// 展开角色字段
const expandCharacterField = (characterId: string, fieldName: string) => {
  // 先收起所有已展开的角色字段
  Object.keys(expandedCharacterFields.value).forEach(id => {
    expandedCharacterFields.value[id] = new Set()
  })
  
  // 展开当前字段
  if (!expandedCharacterFields.value[characterId]) {
    expandedCharacterFields.value[characterId] = new Set()
  }
  expandedCharacterFields.value[characterId].add(fieldName)
}

// 收起角色字段
const collapseCharacterField = (characterId: string, fieldName: string) => {
  if (expandedCharacterFields.value[characterId]) {
    // 创建新的 Set 以确保响应式更新
    const newSet = new Set(expandedCharacterFields.value[characterId])
    newSet.delete(fieldName)
    expandedCharacterFields.value[characterId] = newSet
  }
}

// 检查角色字段是否展开
const isCharacterFieldExpanded = (characterId: string, fieldName: string) => {
  return expandedCharacterFields.value[characterId]?.has(fieldName) || false
}

// 展开道具字段
const expandPropField = (propId: string, fieldName: string) => {
  // 先收起所有已展开的道具字段
  Object.keys(expandedPropFields.value).forEach(id => {
    expandedPropFields.value[id] = new Set()
  })
  
  // 展开当前字段
  if (!expandedPropFields.value[propId]) {
    expandedPropFields.value[propId] = new Set()
  }
  expandedPropFields.value[propId].add(fieldName)
}

// 收起道具字段
const collapsePropField = (propId: string, fieldName: string) => {
  if (expandedPropFields.value[propId]) {
    // 创建新的 Set 以确保响应式更新
    const newSet = new Set(expandedPropFields.value[propId])
    newSet.delete(fieldName)
    expandedPropFields.value[propId] = newSet
  }
}

// 检查道具字段是否展开
const isPropFieldExpanded = (propId: string, fieldName: string) => {
  return expandedPropFields.value[propId]?.has(fieldName) || false
}

// 将场景和镜头关联
const scenesWithShots = computed<SceneWithShots[]>(() => {
  return scenes.value.map(scene => {
    const sceneShots = shots.value.filter(shot => shot.scene_id === scene.id)
    return {
      ...scene,
      shots: sceneShots
    }
  })
})

// 可用版本列表（从场景中提取所有版本号）
const availableVersions = computed(() => {
  if (!selectedChapter.value || scenes.value.length === 0) {
    return []
  }
  const versionSet = new Set<number>()
  scenes.value.forEach(scene => {
    if (scene.version) {
      versionSet.add(scene.version)
    }
  })
  return Array.from(versionSet).sort((a, b) => b - a) // 降序排列，最新版本在前
})

// 判断是否有版本
const hasVersion = computed(() => {
  return availableVersions.value.length > 0
})

// 生成按钮文本
const generateButtonText = computed(() => {
  return hasVersion.value ? '重新生成' : '生成场景'
})

// 初始化镜头数据
const initShotData = () => {
  scenesWithShots.value.forEach(scene => {
    if (scene.shots && scene.shots.length > 0) {
      // 初始化字幕和描述
      scene.shots.forEach(shot => {
        if (!shotSubtitles.value[shot.id]) {
          shotSubtitles.value[shot.id] = shot.narration || ''
        }
        if (!shotDescriptions.value[shot.id]) {
          shotDescriptions.value[shot.id] = shot.video_prompt || ''
        }
        if (!shotFirstImagePrompts.value[shot.id]) {
          shotFirstImagePrompts.value[shot.id] = shot.first_image_prompt || ''
        }
        if (!shotLastImagePrompts.value[shot.id]) {
          shotLastImagePrompts.value[shot.id] = shot.last_image_prompt || ''
        }
      })
    }
  })
}

// 初始化角色数据
const initCharacterData = () => {
  characters.value.forEach(character => {
    if (!characterDescriptions.value[character.id]) {
      characterDescriptions.value[character.id] = character.description || ''
    }
    if (!characterImagePrompts.value[character.id]) {
      characterImagePrompts.value[character.id] = character.image_prompt || ''
    }
  })
}

// 初始化道具数据
const initPropData = () => {
  props.value.forEach(prop => {
    if (!propDescriptions.value[prop.id]) {
      propDescriptions.value[prop.id] = prop.description || ''
    }
    if (!propImagePrompts.value[prop.id]) {
      propImagePrompts.value[prop.id] = prop.image_prompt || ''
    }
  })
}

// 监听场景和镜头数据变化，初始化镜头数据
watch([scenes, shots], () => {
  initShotData()
}, { deep: true, immediate: true })

// 监听角色数据变化，初始化角色数据
watch(characters, () => {
  initCharacterData()
}, { deep: true, immediate: true })

// 监听道具数据变化，初始化道具数据
watch(props, () => {
  initPropData()
}, { deep: true, immediate: true })

// 总镜头数
const totalShots = computed(() => shots.value.length)

// 获取场景下的镜头数量
const getShotsCountForScene = (sceneId: string) => {
  return shots.value.filter(shot => shot.scene_id === sceneId).length
}

// 加载状态
const loadingScenes = ref(false)
const loadingShots = ref(false)
const loadingCharacters = ref(false)
const loadingProps = ref(false)
const generating = ref(false)
const generatingCharacters = ref(false)
const generatingProps = ref(false)

// 切分章节相关
const splittingChapters = ref(false)
const splitProgress = ref({
  percentage: 0,
  message: ''
})

const novelId = computed(() => route.params.novelId as string)
const chapterId = computed(() => route.params.chapterId as string)


const fetchNovel = async () => {
  if (!novelId.value) {
    ElMessage.error('剧本ID无效')
    router.push('/novel')
    return
  }

  if (!chapterId.value) {
    ElMessage.error('章节ID无效')
    router.push({ name: 'NovelInfo', params: { id: novelId.value } })
    return
  }

  try {
    loading.value = true
    const res = await novelApi.getNovel(novelId.value)
    novel.value = res.data.novel
    // 获取关联的章节信息
    await fetchRelatedData()
  } catch (error: any) {
    console.error('获取剧本详情失败:', error)
    const errorMessage = error?.response?.data?.message || error?.message || '获取剧本详情失败'
    ElMessage.error(errorMessage)
    
    // 如果是404错误，跳转到剧本列表
    if (error?.response?.status === 404) {
      setTimeout(() => {
        router.push('/novel')
      }, 2000)
    }
  } finally {
    loading.value = false
  }
}

const fetchRelatedData = async () => {
  if (!novel.value || !chapterId.value) return
  try {
    // 获取章节列表（用于显示，但不用于选择）
    const chaptersRes = await novelApi.getChapters(novel.value.id)
    chapters.value = chaptersRes.data.chapters || []
    
    // 直接使用路由中的 chapterId，查找对应的章节
    const chapter = chapters.value.find(ch => ch.id === chapterId.value)
    if (chapter) {
      selectedChapter.value = chapter
      // 加载第一步的数据
      await loadStep1Data()
    } else {
      ElMessage.error('章节不存在')
      router.push({ name: 'NovelInfo', params: { id: novelId.value } })
    }
  } catch (error) {
    console.error('获取关联数据失败', error)
  }
}

// 加载第一步的数据
const loadStep1Data = async () => {
  if (!novel.value || !selectedChapter.value) return
  
  // 加载场景和镜头（场景tab需要同时加载）
  if (activeTab.value === 'scenes') {
    await Promise.all([loadScenes(), loadShots()])
  }
  // 加载人物
  if (activeTab.value === 'characters') {
    await loadCharacters()
  }
  // 加载道具
  if (activeTab.value === 'props') {
    await loadProps()
  }
}

// 加载场景数据
const loadScenes = async () => {
  if (!selectedChapter.value) return
  
  // 如果没有生效版本，不请求接口，清空数据
  if (!selectedChapter.value.active_scene_version || selectedChapter.value.active_scene_version === 0) {
    scenes.value = []
    loadingScenes.value = false
    return
  }
  
  try {
    loadingScenes.value = true
    const res = await novelApi.getScenes(selectedChapter.value.id)
    scenes.value = res.data.scenes || []
  } catch (error: any) {
    console.error('获取场景列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '获取场景列表失败')
  } finally {
    loadingScenes.value = false
  }
}

// 加载镜头数据
const loadShots = async () => {
  if (!selectedChapter.value) return
  
  // 如果没有生效版本，不请求接口，清空数据
  if (!selectedChapter.value.active_scene_version || selectedChapter.value.active_scene_version === 0) {
    shots.value = []
    loadingShots.value = false
    return
  }
  
  try {
    loadingShots.value = true
    const res = await novelApi.getShots(selectedChapter.value.id)
    shots.value = res.data.shots || []
  } catch (error: any) {
    console.error('获取镜头列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '获取镜头列表失败')
  } finally {
    loadingShots.value = false
  }
}

// 加载人物数据
const loadCharacters = async () => {
  if (!novel.value) return
  try {
    loadingCharacters.value = true
    const res = await novelApi.getCharacters(novel.value.id)
    // 响应拦截器已经处理了 { code: 0, data: [...] } 格式，返回的是 data 字段
    // 所以 res.data 就是数组或者包含数组的对象
    const data = res.data as any
    characters.value = Array.isArray(data) ? data : (data?.characters || data?.data || data || [])
  } catch (error: any) {
    console.error('获取人物列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '获取人物列表失败')
  } finally {
    loadingCharacters.value = false
  }
}

// 加载道具数据
const loadProps = async () => {
  if (!novel.value) return
  try {
    loadingProps.value = true
    const res = await novelApi.getProps(novel.value.id)
    // 响应拦截器已经处理了 { code: 0, data: [...] } 格式，返回的是 data 字段
    // 所以 res.data 就是数组或者包含数组的对象
    const data = res.data as any
    props.value = Array.isArray(data) ? data : (data?.props || data?.data || data || [])
    console.log('道具列表加载:', props.value.length, '个道具', props.value)
  } catch (error: any) {
    console.error('获取道具列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '获取道具列表失败')
  } finally {
    loadingProps.value = false
  }
}

// 加载音频列表
const loadAudios = async () => {
  if (!selectedChapter.value) return
  try {
    loadingAudios.value = true
    const version = selectedChapter.value.active_scene_version || undefined
    const res = await novelApi.getAudiosByChapter(selectedChapter.value.id, version)
    // 响应拦截器已经处理了格式
    const data = res.data as any
    audios.value = Array.isArray(data) ? data : (data?.audios || data?.data || data || [])
  } catch (error: any) {
    console.error('获取音频列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '获取音频列表失败')
  } finally {
    loadingAudios.value = false
  }
}

// 加载视频列表
const loadVideos = async () => {
  if (!selectedChapter.value) return
  try {
    loadingVideos.value = true
    const version = selectedChapter.value.active_scene_version || undefined
    const res = await novelApi.getVideosByChapter(selectedChapter.value.id, version)
    // 响应拦截器已经处理了格式
    const data = res.data as any
    videos.value = Array.isArray(data) ? data : (data?.videos || data?.data || data || [])
  } catch (error: any) {
    console.error('获取视频列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '获取视频列表失败')
  } finally {
    loadingVideos.value = false
  }
}

// 选择章节
const selectChapter = async (chapter: Chapter) => {
  selectedChapter.value = chapter
  // 切换章节时重新加载场景和镜头，并刷新章节信息
  await Promise.all([
    loadScenes(), 
    loadShots(),
    fetchChapterInfo()
  ])
}

// 处理生成场景按钮点击（带确认）
const handleGenerateScenes = async () => {
  if (!selectedChapter.value) {
    ElMessage.warning('请先选择章节')
    return
  }

  // 如果已有版本，需要确认
  if (hasVersion.value) {
    try {
      await ElMessageBox.confirm(
        '重新生成场景将创建新版本，是否继续？',
        '确认重新生成',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
    } catch {
      // 用户取消
      return
    }
  }

  // 执行生成
  await generateNarration()
}

// 生成场景和镜头
const generateNarration = async () => {
  if (!selectedChapter.value) {
    ElMessage.warning('请先选择章节')
    return
  }
  
  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let isPolling = true
  
  try {
    generating.value = true
    const oldVersion = selectedChapter.value.active_scene_version || 0
    await novelApi.generateScenes(selectedChapter.value.id)
    ElMessage.success('场景生成中，请稍候...')
    
    // 轮询检查新版本是否生成完成
    let retryCount = 0
    const maxRetries = 30 // 最多重试30次（30秒）
    const retryInterval = 1000 // 每次间隔1秒
    
    const checkNewVersion = async (): Promise<boolean> => {
      await fetchChapterInfo()
      const newVersion = selectedChapter.value?.active_scene_version || 0
      // 如果版本号增加了，说明生成完成
      if (newVersion > oldVersion) {
        return true
      }
      return false
    }
    
    // 开始轮询
    const pollForNewVersion = async () => {
      if (!isPolling) {
        return
      }
      
      if (retryCount >= maxRetries) {
        // 超时后仍然尝试加载一次
        await fetchChapterInfo()
        await Promise.all([
          loadScenes(),
          loadShots()
        ])
        ElMessage.warning('场景生成可能还在进行中，请稍后刷新查看')
        isPolling = false
        return
      }
      
      retryCount++
      const hasNewVersion = await checkNewVersion()
      
      if (hasNewVersion) {
        // 获取到新版本，加载场景和镜头
        isPolling = false
        await Promise.all([
          loadScenes(),
          loadShots()
        ])
        ElMessage.success('场景生成完成！')
        return
      }
      
      // 继续轮询
      if (isPolling) {
        pollTimer = setTimeout(pollForNewVersion, retryInterval)
      }
    }
    
    // 延迟开始轮询（给后端一些处理时间）
    setTimeout(() => {
      if (isPolling) {
        pollForNewVersion()
      }
    }, 1000)
  } catch (error: any) {
    console.error('生成场景失败:', error)
    ElMessage.error(error?.response?.data?.message || '生成场景失败')
    isPolling = false
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
  } finally {
    generating.value = false
  }
}

// 切换场景版本
const handleVersionChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newVersion = parseInt(target.value, 10)
  
  if (!selectedChapter.value || isNaN(newVersion)) {
    return
  }

  // 如果选择的版本已经是当前版本，不需要切换
  if (selectedChapter.value.active_scene_version === newVersion) {
    return
  }

  try {
    switchingVersion.value = true
    await novelApi.setActiveSceneVersion(selectedChapter.value.id, newVersion)
    ElMessage.success(`已切换到版本 v${newVersion}`)
    
    // 刷新章节信息、场景和镜头
    await Promise.all([
      fetchChapterInfo(),
      loadScenes(),
      loadShots()
    ])
  } catch (error: any) {
    console.error('切换版本失败:', error)
    ElMessage.error(error?.response?.data?.message || '切换版本失败')
    // 恢复下拉菜单的值
    target.value = String(selectedChapter.value.active_scene_version || availableVersions.value[0] || '')
  } finally {
    switchingVersion.value = false
  }
}

// 获取章节信息（用于刷新版本号）
const fetchChapterInfo = async () => {
  if (!selectedChapter.value || !novel.value) {
    return
  }
  try {
    const response = await novelApi.getChapters(novel.value.id)
    // 处理不同的响应格式
    const data = response.data as any
    const chapters = data?.chapters || data || []
    const chapter = chapters.find((ch: any) => ch.id === selectedChapter.value!.id)
    if (chapter) {
      // 使用 Object.assign 确保响应式更新
      Object.assign(selectedChapter.value, chapter)
    }
  } catch (error: any) {
    console.error('获取章节信息失败:', error)
  }
}

// 生成人物图片（人物抽卡）- 异步版本
const generateCharacterImages = async () => {
  if (!novel.value) return
  try {
    generatingCharacters.value = true
    await novelApi.generateCharacterImages(novel.value.id)
    ElMessage.success('人物抽卡任务已启动，正在轮询状态...')
    
    // 开始轮询状态
    let retryCount = 0
    const maxRetries = 60 // 最多轮询60次（5分钟）
    const retryInterval = 5000 // 每次间隔5秒
    
    const pollStatus = async () => {
      if (retryCount >= maxRetries) {
        ElMessage.warning('人物抽卡可能还在进行中，请稍后刷新查看')
        generatingCharacters.value = false
        await loadCharacters()
        return
      }
      
      retryCount++
      try {
        const response = await novelApi.getCharacterImageGenerationStatus(novel.value!.id)
        const data = response.data as any
        const summary = data?.summary || data
        
        // 如果所有任务都完成了（没有 pending），停止轮询
        if (summary && summary.pending === 0) {
          generatingCharacters.value = false
          await loadCharacters()
          
          if (summary.failed > 0) {
            ElMessage.warning(`人物抽卡完成，但有 ${summary.failed} 个角色生成失败`)
          } else {
            ElMessage.success('人物抽卡完成！')
          }
          return
        }
        
        // 继续轮询
        setTimeout(pollStatus, retryInterval)
      } catch (error: any) {
        console.error('查询人物抽卡状态失败:', error)
        // 继续轮询，不中断
        setTimeout(pollStatus, retryInterval)
      }
    }
    
    // 延迟开始轮询（给后端一些处理时间）
    setTimeout(pollStatus, 2000)
  } catch (error: any) {
    console.error('人物抽卡失败:', error)
    ElMessage.error(error?.response?.data?.message || '人物抽卡失败')
    generatingCharacters.value = false
  }
}


// 生成道具图片（道具抽卡）- 异步版本
const generatePropImages = async () => {
  if (!novel.value) return
  try {
    generatingProps.value = true
    await novelApi.generatePropImages(novel.value.id)
    ElMessage.success('道具抽卡任务已启动，正在轮询状态...')
    
    // 开始轮询状态
    let retryCount = 0
    const maxRetries = 60 // 最多轮询60次（5分钟）
    const retryInterval = 5000 // 每次间隔5秒
    
    const pollStatus = async () => {
      if (retryCount >= maxRetries) {
        ElMessage.warning('道具抽卡可能还在进行中，请稍后刷新查看')
        generatingProps.value = false
        await loadProps()
        return
      }
      
      retryCount++
      try {
        const response = await novelApi.getPropImageGenerationStatus(novel.value!.id)
        const data = response.data as any
        const summary = data?.summary || data
        
        // 如果所有任务都完成了（没有 pending），停止轮询
        if (summary && summary.pending === 0) {
          generatingProps.value = false
          await loadProps()
          
          if (summary.failed > 0) {
            ElMessage.warning(`道具抽卡完成，但有 ${summary.failed} 个道具生成失败`)
          } else {
            ElMessage.success('道具抽卡完成！')
          }
          return
        }
        
        // 继续轮询
        setTimeout(pollStatus, retryInterval)
      } catch (error: any) {
        console.error('查询道具抽卡状态失败:', error)
        // 继续轮询，不中断
        setTimeout(pollStatus, retryInterval)
      }
    }
    
    // 延迟开始轮询（给后端一些处理时间）
    setTimeout(pollStatus, 2000)
  } catch (error: any) {
    console.error('道具抽卡失败:', error)
    ElMessage.error(error?.response?.data?.message || '道具抽卡失败')
    generatingProps.value = false
  }
}


// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // 隐藏图片，显示占位符
  img.style.display = 'none'
  // 检查是角色图片还是道具图片
  const characterPlaceholder = img.parentElement?.parentElement?.querySelector('.character-image-placeholder')
  const propPlaceholder = img.parentElement?.parentElement?.querySelector('.prop-image-placeholder')
  if (characterPlaceholder) {
    (characterPlaceholder as HTMLElement).style.display = 'flex'
  } else if (propPlaceholder) {
    (propPlaceholder as HTMLElement).style.display = 'flex'
  }
}

// 编辑镜头
const editShot = (_shot: ShotInfo) => {
  // TODO: 实现编辑镜头功能
  ElMessage.info('编辑镜头功能开发中...')
}

// 获取场景下的所有镜头
const getShotsBySceneId = (sceneId: string) => {
  return shots.value.filter(shot => shot.scene_id === sceneId)
}

// 获取 shot 的音频
const getAudioForShot = (shotId: string) => {
  return audios.value.find(audio => audio.shot_id === shotId)
}

// 获取 shot 的视频
const getVideoForShot = (shotId: string) => {
  return videos.value.find(video => video.shot_id === shotId)
}

// 获取音频状态样式类
const getAudioStatusClass = (shotId: string) => {
  const audio = getAudioForShot(shotId)
  if (!audio) return 'status-badge--pending'
  switch (audio.status) {
    case 'completed':
      return 'status-badge--success'
    case 'failed':
      return 'status-badge--error'
    case 'pending':
      return 'status-badge--pending'
    default:
      return 'status-badge--pending'
  }
}

// 获取音频状态文本
const getAudioStatusText = (shotId: string) => {
  const audio = getAudioForShot(shotId)
  if (!audio) return '未生成'
  switch (audio.status) {
    case 'completed':
      return '音频已生成'
    case 'failed':
      return '音频生成失败'
    case 'pending':
      return '音频生成中'
    default:
      return '未生成'
  }
}

// 获取视频状态样式类
const getVideoStatusClass = (shotId: string) => {
  const video = getVideoForShot(shotId)
  if (!video) return 'status-badge--pending'
  switch (video.status) {
    case 'completed':
      return 'status-badge--success'
    case 'failed':
      return 'status-badge--error'
    case 'processing':
    case 'pending':
      return 'status-badge--pending'
    default:
      return 'status-badge--pending'
  }
}

// 获取视频状态文本
const getVideoStatusText = (shotId: string) => {
  const video = getVideoForShot(shotId)
  if (!video) return '未生成'
  switch (video.status) {
    case 'completed':
      return '视频已生成'
    case 'failed':
      return '视频生成失败'
    case 'processing':
      return '视频生成中'
    case 'pending':
      return '视频待生成'
    default:
      return '未生成'
  }
}

// 格式化时长
const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return '0秒'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  if (mins > 0) {
    return `${mins}分${secs}秒`
  }
  return `${secs}秒`
}

// 为章节生成所有音频
const generateAudiosForChapter = async () => {
  if (!selectedChapter.value) {
    ElMessage.warning('请先选择章节')
    return
  }

  try {
    generatingAudios.value = true
    await novelApi.generateAudiosForChapter(selectedChapter.value.id)
    ElMessage.success('音频生成任务已提交，正在生成中...')
    
    // 开始轮询音频状态
    startPollingAudios()
  } catch (error: any) {
    console.error('生成音频失败:', error)
    ElMessage.error(error?.response?.data?.message || '生成音频失败')
  } finally {
    generatingAudios.value = false
  }
}

// 为章节生成所有视频
const generateVideosForChapter = async () => {
  if (!selectedChapter.value) {
    ElMessage.warning('请先选择章节')
    return
  }

  try {
    generatingVideos.value = true
    await novelApi.generateVideosForChapter(selectedChapter.value.id)
    ElMessage.success('视频生成任务已提交，正在生成中...')
    
    // 开始轮询视频状态
    startPollingVideos()
  } catch (error: any) {
    console.error('生成视频失败:', error)
    ElMessage.error(error?.response?.data?.message || '生成视频失败')
  } finally {
    generatingVideos.value = false
  }
}

// 为单个 shot 生成音频
const generateAudioForShot = async (shotId: string) => {
  // 注意：目前后端只支持按章节批量生成，单个生成需要后端支持
  // 这里先提示用户使用批量生成
  ElMessage.info('请使用"生成所有音频"按钮批量生成')
}

// 为单个 shot 生成视频
const generateVideoForShot = async (shotId: string) => {
  // 注意：目前后端只支持按章节批量生成，单个生成需要后端支持
  // 这里先提示用户使用批量生成
  ElMessage.info('请使用"生成所有视频"按钮批量生成')
}

// 轮询音频状态
let audioPollTimer: ReturnType<typeof setInterval> | null = null
const startPollingAudios = () => {
  if (audioPollTimer) {
    clearInterval(audioPollTimer)
  }
  
  let retries = 0
  const maxRetries = 60 // 最多轮询 60 次（5分钟）
  
  audioPollTimer = setInterval(async () => {
    if (!selectedChapter.value) {
      if (audioPollTimer) {
        clearInterval(audioPollTimer)
        audioPollTimer = null
      }
      return
    }
    
    try {
      await loadAudios()
      
      // 检查是否所有音频都已完成或失败
      const allCompleted = audios.value.every(audio => 
        audio.status === 'completed' || audio.status === 'failed'
      )
      
      if (allCompleted || retries >= maxRetries) {
        if (audioPollTimer) {
          clearInterval(audioPollTimer)
          audioPollTimer = null
        }
        if (retries >= maxRetries) {
          ElMessage.warning('音频生成超时，请手动刷新查看状态')
        }
      }
      
      retries++
    } catch (error) {
      console.error('轮询音频状态失败:', error)
    }
  }, 5000) // 每 5 秒轮询一次
}

// 轮询视频状态
let videoPollTimer: ReturnType<typeof setInterval> | null = null
const startPollingVideos = () => {
  if (videoPollTimer) {
    clearInterval(videoPollTimer)
  }
  
  let retries = 0
  const maxRetries = 120 // 最多轮询 120 次（10分钟，视频生成较慢）
  
  videoPollTimer = setInterval(async () => {
    if (!selectedChapter.value) {
      if (videoPollTimer) {
        clearInterval(videoPollTimer)
        videoPollTimer = null
      }
      return
    }
    
    try {
      await loadVideos()
      
      // 检查是否所有视频都已完成或失败
      const allCompleted = videos.value.every(video => 
        video.status === 'completed' || video.status === 'failed'
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

// 切分章节
const handleSplitChapters = async () => {
  if (!novel.value) {
    ElMessage.warning('请先加载剧本信息')
    return
  }

  // 如果已经在切分中，不重复启动
  if (splittingChapters.value) {
    ElMessage.warning('切分任务正在进行中，请稍候...')
    return
  }

  splittingChapters.value = true
  splitProgress.value = {
    percentage: 0,
    message: '准备开始切分章节...'
  }

  try {
    // 调用后端切分章节接口
    await novelApi.splitChapters(novel.value.id, 50) // 默认切分为50章
    
    ElMessage.success('章节切分成功！')
    
    // 刷新章节列表
    await fetchRelatedData()
    
    splitProgress.value = {
      percentage: 100,
      message: '切分完成'
    }
    
    // 2秒后重置进度
      setTimeout(() => {
      splitProgress.value = {
          percentage: 0,
          message: ''
        }
    }, 2000)
  } catch (error: any) {
    console.error('切分章节失败:', error)
    ElMessage.error({
      message: error?.response?.data?.message || '切分章节失败',
      duration: 5000,
      showClose: true
    })
    splitProgress.value = {
      percentage: 0,
      message: error?.response?.data?.message || '切分失败'
    }
  } finally {
    splittingChapters.value = false
  }
}

// 跳转到镜头详情页
const goToShotDetail = (shotId: string) => {
  router.push({ name: 'ShotDetail', params: { shotId } })
}

// 监听章节切换，加载场景和镜头数据
watch(selectedChapter, () => {
    if (selectedChapter.value) {
      loadScenes()
      loadShots()
  }
})


const getStyleLabel = (style: string) => {
  const map: Record<string, string> = {
    anime: '漫剧（动画风格）',
    live: '真人剧（真人风格）',
    mixed: '混合风格'
  }
  return map[style] || style
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


onMounted(async () => {
  await fetchNovel()
})

// 组件卸载时清理轮询定时器
onBeforeUnmount(() => {
  if (audioPollTimer) {
    clearInterval(audioPollTimer)
    audioPollTimer = null
  }
  if (videoPollTimer) {
    clearInterval(videoPollTimer)
    videoPollTimer = null
  }
})
</script>

<style scoped>
.novel-detail {
  width: 100%;
  min-height: 100vh;
  background: #f8fafc;
}

.novel-detail.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  overflow: auto;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
  background-attachment: fixed;
  background-size: 200% 200%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

/* 沉浸式顶部栏 - 高级设计 */
.immersive-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 40px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  gap: 32px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 0 0 auto;
  min-width: 0;
  max-width: 280px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  background: rgba(0, 0, 0, 0.04);
  white-space: nowrap;
  cursor: pointer;
  font-family: inherit;
  backdrop-filter: blur(10px);
}

.back-button:hover {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  transform: translateX(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.icon-arrow-left {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.novel-title {
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 40px;
  min-width: 0;
}

/* 自定义步骤指示器 */
.custom-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  max-width: 700px;
  width: 100%;
  margin: 0 auto;
}

.custom-step {
  display: flex;
  align-items: center;
  flex: 1;
  position: relative;
  min-width: 0;
}

.custom-step:last-child {
  flex: 0 0 auto;
}

.custom-step-indicator {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.custom-step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(0, 0, 0, 0.04);
  color: #94a3b8;
  border: 2px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.custom-step.is-active .custom-step-number {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2), 0 4px 16px rgba(59, 130, 246, 0.3);
  transform: scale(1.1);
}

.custom-step.is-completed .custom-step-number {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  border-color: #10b981;
  box-shadow: 0 2px 12px rgba(16, 185, 129, 0.3);
}

.custom-step.is-pending .custom-step-number {
  background: rgba(0, 0, 0, 0.03);
  color: #94a3b8;
  border-color: rgba(0, 0, 0, 0.06);
}

.custom-step-title {
  margin-left: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-step.is-active .custom-step-title {
  color: #1e293b;
  font-weight: 600;
}

.custom-step.is-completed .custom-step-title {
  color: #059669;
}

.custom-step.is-pending .custom-step-title {
  color: #94a3b8;
}

.custom-step-line {
  position: absolute;
  left: 28px;
  right: -28px;
  top: 12px;
  height: 2px;
  background: rgba(0, 0, 0, 0.08);
  z-index: 1;
  transition: all 0.3s ease;
}

.custom-step.is-completed .custom-step-line {
  background: #10b981;
  opacity: 0.8;
}

.custom-step.is-active ~ .custom-step .custom-step-line {
  background: rgba(0, 0, 0, 0.08);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 0 0 auto;
}

.step-button {
  min-width: 90px;
  height: 40px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  background: rgba(0, 0, 0, 0.04);
  color: #475569;
  cursor: pointer;
  font-family: inherit;
  padding: 0 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.step-button:hover:not(:disabled) {
  color: #1e293b;
  background: rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.step-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.step-button--primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.step-button--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.user-avatar:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

.icon-user {
  width: 18px;
  height: 18px;
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
.content-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
}

/* 加载容器 */
.loading-container {
  padding: 48px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

/* 骨架屏加载动画 */
.skeleton-loader {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-item {
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.skeleton-title {
  height: 24px;
  width: 200px;
}

.skeleton-line {
  height: 16px;
  width: 100%;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 信息卡片 */
.info-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  margin-bottom: 28px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.info-card:hover {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.info-card-header {
  padding: 24px 28px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
  backdrop-filter: blur(10px);
}

.info-card-title {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  letter-spacing: -0.2px;
}

.info-card-body {
  padding: 28px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 11px;
}

.info-value {
  font-size: 15px;
  color: #111827;
  font-weight: 500;
  margin-top: 4px;
}

.info-item--full {
  grid-column: 1 / -1;
}

.info-value--action {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.generate-button--inline {
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.generate-button--inline:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.generate-button--inline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.generate-progress {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
}

.progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.progress-text {
  color: #3b82f6;
  font-weight: 600;
  min-width: 40px;
}

.progress-message {
  color: #6b7280;
  flex: 1;
}

/* 章节区域 */
.chapters-section {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  margin-bottom: 28px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.chapters-header {
  padding: 20px 28px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
}

.chapters-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  letter-spacing: -0.2px;
}

.chapters-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.chapter-item:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.chapter-item.is-selected {
  background: rgba(59, 130, 246, 0.08);
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.chapter-number {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.chapter-item.is-selected .chapter-number {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.chapter-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chapter-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}

.chapter-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
}

.chapter-word-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.chapter-selected-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
}

.chapters-empty {
  padding: 40px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.panel-title-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.panel-subtitle {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.15) 100%);
  color: #3b82f6;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.version-selector {
  display: flex;
  align-items: center;
  margin-right: 12px;
}

.version-select {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  min-width: 120px;
}

.version-select:hover:not(:disabled) {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
  color: #3b82f6;
}

.version-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.version-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.panel-hint {
  font-size: 14px;
  color: #6b7280;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 6px;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-toggle-buttons {
  display: flex;
  gap: 8px;
}

.toggle-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-button:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.toggle-button.is-active {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
  color: #3b82f6;
}

.toggle-button svg {
  width: 16px;
  height: 16px;
}

/* 顶部工具栏 */
.top-toolbar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.toolbar-left {
  flex-shrink: 0;
  min-width: 200px;
}

.novel-basic-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.novel-name {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
}

.novel-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.meta-divider {
  color: #d1d5db;
}

.toolbar-center {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.chapters-selector {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.chapters-selector::-webkit-scrollbar {
  height: 6px;
}

.chapters-selector::-webkit-scrollbar-track {
  background: transparent;
}

.chapters-selector::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.chapter-selector-item {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.chapter-selector-item:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(59, 130, 246, 0.3);
}

.chapter-selector-item.is-selected {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
  color: #3b82f6;
}

.chapter-selector-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
}

.chapter-selector-item.is-selected .chapter-selector-number {
  background: #3b82f6;
  color: #ffffff;
}

.chapter-selector-title {
  font-size: 14px;
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapters-selector-empty {
  padding: 8px 16px;
  color: #6b7280;
  font-size: 14px;
}

.toolbar-right {
  flex-shrink: 0;
  min-width: 180px;
}

.toolbar-generate {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.generate-button--toolbar {
  padding: 10px 20px;
  font-size: 14px;
}

.generate-progress--toolbar {
  width: 100%;
  min-width: 200px;
}

/* 标签页容器 */
.tabs-container {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.tabs-header {
  display: flex;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 0;
}

.tab-item {
  padding: 18px 28px;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 3px solid transparent;
  position: relative;
  letter-spacing: -0.1px;
}

.tab-item::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  transform: scaleX(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-item:hover {
  color: #111827;
  background: rgba(59, 130, 246, 0.04);
}

.tab-item.is-active {
  color: #3b82f6;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

.tab-item.is-active::before {
  transform: scaleX(1);
}

.tabs-content {
  padding: 0;
}

.tab-panel {
  padding: 28px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f3f4f6;
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.2px;
}

.empty-state {
  padding: 80px 24px;
  text-align: center;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.empty-state .empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.empty-state .empty-icon {
  width: 96px;
  height: 96px;
  color: #9ca3af;
  opacity: 0.4;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08));
}

.empty-state .empty-text {
  color: #6b7280;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  letter-spacing: -0.2px;
}

.step-content {
  width: 100%;
  animation: fadeInUp 0.5s ease;
}

/* 一键生成区域 */
.auto-generate-section {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.auto-generate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.auto-generate-info {
  flex: 1;
}

.auto-generate-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
  letter-spacing: -0.2px;
}

.auto-generate-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.auto-generate-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2);
  min-width: 140px;
}

.auto-generate-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
}

.auto-generate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 进度容器 */
.progress-container {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.progress-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.progress-step {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  position: relative;
  transition: all 0.3s ease;
}

.progress-step-indicator {
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.progress-step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  background: rgba(0, 0, 0, 0.04);
  color: #94a3b8;
  border: 2px solid rgba(0, 0, 0, 0.08);
}

.progress-step.is-active .progress-step-number {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2), 0 4px 16px rgba(59, 130, 246, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

.progress-step.is-completed .progress-step-number {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  border-color: #10b981;
  box-shadow: 0 2px 12px rgba(16, 185, 129, 0.3);
}

.progress-step.is-pending .progress-step-number {
  background: rgba(0, 0, 0, 0.03);
  color: #94a3b8;
  border-color: rgba(0, 0, 0, 0.06);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.progress-step-content {
  flex: 1;
  padding-top: 4px;
}

.progress-step-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
  transition: all 0.3s ease;
}

.progress-step.is-active .progress-step-title {
  color: #3b82f6;
}

.progress-step.is-completed .progress-step-title {
  color: #059669;
}

.progress-step.is-pending .progress-step-title {
  color: #94a3b8;
}

.progress-step-message {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
  font-style: italic;
}

.progress-step-line {
  position: absolute;
  left: 16px;
  top: 40px;
  bottom: -16px;
  width: 2px;
  background: rgba(0, 0, 0, 0.08);
  z-index: 1;
  transition: all 0.3s ease;
}

.progress-step:last-child .progress-step-line {
  display: none;
}

.progress-step.is-completed .progress-step-line {
  background: #10b981;
  opacity: 0.8;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  position: relative;
  overflow: hidden;
}

.progress-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-percentage {
  font-size: 14px;
  font-weight: 600;
  color: #3b82f6;
  min-width: 50px;
  text-align: right;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}



.progress-text {
  margin-top: var(--spacing-xs);
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-align: center;
}



/* 自定义表格样式 */
.custom-table {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
}

.custom-table.is-loading {
  pointer-events: none;
}

.table-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 12px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-right-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.custom-table-header {
  display: flex;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-bottom: 2px solid rgba(0, 0, 0, 0.06);
}

.custom-table-cell {
  padding: 18px 16px;
  font-size: 14px;
  color: #111827;
  display: flex;
  align-items: center;
  border-right: 1px solid #e5e7eb;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
}

.custom-table-header .custom-table-cell {
  font-weight: 700;
  color: #374151;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 12px;
}

.custom-table-header .custom-table-cell:last-child {
  border-right: none;
}

.custom-table-body {
  background: transparent;
}

.custom-table-row {
  display: flex;
  border-bottom: 1px solid #f3f4f6;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-table-row:hover {
  background: linear-gradient(90deg, rgba(248, 250, 252, 0.6) 0%, rgba(255, 255, 255, 0.4) 100%);
  transform: translateX(2px);
  box-shadow: -2px 0 8px rgba(59, 130, 246, 0.1);
}

.custom-table-row:last-child {
  border-bottom: none;
}

.custom-table-row .custom-table-cell {
  border-right: 1px solid #e5e7eb;
  background: transparent;
}

.custom-table-row .custom-table-cell:last-child {
  border-right: none;
}

.custom-table-row-main {
  display: flex;
  width: 100%;
}

.custom-table-row-expanded {
  width: 100%;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  animation: expandRow 0.3s ease;
}

@keyframes expandRow {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 1000px;
  }
}

.expand-icon {
  width: 20px;
  height: 20px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.expand-icon:hover {
  color: #3b82f6;
  transform: scale(1.1);
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
}

.status-badge--pending {
  background: rgba(255, 193, 7, 0.1);
  color: #f57c00;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.status-badge--success {
  background: rgba(76, 175, 80, 0.1);
  color: #2e7d32;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.status-badge--error {
  background: rgba(244, 67, 54, 0.1);
  color: #c62828;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.shot-media-section {
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.shot-media-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.shot-media-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.shot-media-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.audio-player,
.video-player {
  width: 100%;
  max-width: 100%;
  border-radius: 6px;
  background: #000;
}

.shot-media-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.error-text {
  color: #c62828;
  font-size: 12px;
}

.action-button--small {
  padding: 6px 12px;
  font-size: 12px;
  height: auto;
  min-height: auto;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.status-success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-pending {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #3730a3;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.custom-table-empty {
  padding: 80px 24px;
  text-align: center;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  color: #9ca3af;
  opacity: 0.4;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08));
}

.empty-state-content .empty-text {
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;
  margin: 0;
  letter-spacing: -0.2px;
}

.table-image {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
  background: #f3f4f6;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.table-image:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

.empty-text {
  color: #9ca3af;
}


/* 镜头表格样式 */
.shots-table {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  overflow: visible;
  margin-top: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  min-width: 1000px;
}

.shots-table-header {
  display: flex;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-bottom: 2px solid rgba(0, 0, 0, 0.06);
}

.shots-table-cell {
  padding: 10px 12px;
  font-size: 13px;
  color: #111827;
  display: flex;
  align-items: flex-start;
  border-right: 1px solid #e5e7eb;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
}

.shots-table-header .shots-table-cell {
  font-weight: 600;
  color: #6b7280;
  font-size: 12px;
  padding: 10px 12px;
}

.shots-table-header .shots-table-cell:last-child {
  border-right: none;
}

.shots-table-body {
  background: transparent;
}

.shots-table-row {
  display: flex;
  border-bottom: 1px solid #f3f4f6;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.shots-table-row:hover {
  background: linear-gradient(90deg, rgba(248, 250, 252, 0.6) 0%, rgba(255, 255, 255, 0.4) 100%);
  transform: translateX(2px);
  box-shadow: -2px 0 8px rgba(59, 130, 246, 0.1);
}

.shots-table-row:last-child {
  border-bottom: none;
}

.shots-table-row .shots-table-cell {
  border-right: 1px solid #e5e7eb;
  background: transparent;
}

.shots-table-row .shots-table-cell:last-child {
  border-right: none;
}


/* 镜头容器（嵌套表格） */
.shots-container {
  padding: 16px 20px;
  background: transparent;
  margin: 0;
  border: none;
  overflow-x: auto;
}

.shots-header {
  font-weight: 700;
  font-size: 14px;
  color: #374151;
  margin-bottom: 16px;
  padding-left: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: -0.2px;
}

.shots-header::before {
  content: '';
  width: 4px;
  height: 18px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 2px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}


.no-shots {
  padding: 48px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.1px;
}

/* 场景卡片列表 */
.scenes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}

.scenes-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 12px;
}

.scene-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s ease;
}

.scene-card:hover {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.scene-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
}

.scene-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  letter-spacing: -0.2px;
}

.scene-actions {
  display: flex;
  gap: 8px;
}

.scene-action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
}

.scene-action-btn:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
  transform: scale(1.05);
}

.scene-action-btn svg {
  width: 16px;
  height: 16px;
}

.shots-list {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.shot-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.shot-item.is-selected {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.shot-selector {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-top: 4px;
}

.shot-radio {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.shot-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  user-select: none;
}

.shot-item.is-selected .shot-label {
  color: #3b82f6;
}

.shot-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shot-field {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
}

.shot-field-label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  flex-shrink: 0;
  padding-top: 10px;
  min-width: 80px;
}

.shot-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
}

.shot-text-single {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 14px;
  color: #111827;
  cursor: text;
  transition: all 0.2s ease;
  line-height: 1.5;
  min-height: 40px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shot-text-single:hover {
  border-color: #3b82f6;
  background: rgba(255, 255, 255, 1);
}

.shot-textarea {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 14px;
  color: #111827;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s ease;
  line-height: 1.5;
}

.shot-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: rgba(255, 255, 255, 1);
}

.shot-textarea--description {
  min-height: 80px;
}

.shot-input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 4px;
}

.char-count {
  font-size: 12px;
  color: #9ca3af;
}

.shot-input-actions {
  display: flex;
  gap: 8px;
}

.shot-action-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
  border-radius: 4px;
}

.shot-action-icon:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #3b82f6;
}

.shot-action-icon svg {
  width: 14px;
  height: 14px;
}

.shot-edit-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
}

.shot-edit-icon:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #3b82f6;
  color: #3b82f6;
}

.shot-edit-icon svg {
  width: 14px;
  height: 14px;
}

.no-shots-in-scene {
  padding: 40px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

.scenes-empty {
  padding: 80px 40px;
  text-align: center;
}

/* 人物卡片列表 */
.characters-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}

.character-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s ease;
}

.character-card:hover {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.character-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
}

.character-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  letter-spacing: -0.2px;
}

.character-meta {
  display: flex;
  gap: 8px;
}

.character-tag {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.character-content {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.character-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.character-field-label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
}

.character-input-wrapper {
  position: relative;
}

.character-text-single {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 14px;
  color: #111827;
  cursor: text;
  transition: all 0.2s ease;
  line-height: 1.5;
  min-height: 40px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.character-text-single:hover {
  border-color: #3b82f6;
  background: rgba(255, 255, 255, 1);
}

.character-textarea {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 14px;
  color: #111827;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s ease;
  line-height: 1.5;
  min-height: 80px;
}

.character-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: rgba(255, 255, 255, 1);
}

.character-image {
  margin-top: 8px;
}

.character-image-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.characters-empty {
  padding: 80px 40px;
  text-align: center;
}

/* 新的人物卡片样式（类似截图） */
.characters-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  position: relative;
}

.character-card-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.character-image-container {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  margin: 0;
  line-height: 0;
}

.character-image-container:hover {
  border-color: rgba(0, 0, 0, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.character-info-container {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.character-info-container:hover {
  border-color: rgba(0, 0, 0, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.character-card-new {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.character-card-new:hover {
  border-color: rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.character-card-content {
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.character-image {
  width: 100%;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #ffffff;
  margin: 0;
  padding: 0;
  display: block;
  line-height: 0;
}

.character-image-wrapper {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  display: block;
  line-height: 0;
}

.character-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  margin: 0;
  padding: 0;
}

.character-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.3);
  background: #ffffff;
}

.character-image-placeholder svg {
  width: 64px;
  height: 64px;
}


.character-edit-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.character-edit-icon:hover {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 1);
}

.character-edit-icon svg {
  width: 16px;
  height: 16px;
}

.character-info {
  text-align: left;
  width: 100%;
}

.character-name {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.character-meta-new {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
}

.character-gender,
.character-age {
  display: flex;
  align-items: center;
  gap: 4px;
}

.character-description,
.character-prompt {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.7);
  text-align: left;
  line-height: 1.6;
  width: 100%;
}

.character-description {
  margin-top: 4px;
}

.character-prompt {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.character-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.8);
  margin-right: 4px;
}

.character-text {
  color: rgba(0, 0, 0, 0.6);
  word-break: break-word;
}


/* 道具卡片列表 */
.props-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  position: relative;
}

.prop-card-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prop-image-container {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  margin: 0;
  line-height: 0;
}

.prop-image-container:hover {
  border-color: rgba(0, 0, 0, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.prop-info-container {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prop-info-container:hover {
  border-color: rgba(0, 0, 0, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.prop-info {
  text-align: left;
  width: 100%;
  margin-bottom: 0;
}

.prop-name {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.prop-meta-new {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
}

.prop-category {
  display: flex;
  align-items: center;
  gap: 4px;
}

.prop-description,
.prop-prompt {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.7);
  text-align: left;
  line-height: 1.6;
  width: 100%;
}

.prop-description {
  margin-top: 4px;
}

.prop-prompt {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.prop-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.8);
  margin-right: 4px;
}

.prop-text {
  color: rgba(0, 0, 0, 0.6);
  word-break: break-word;
}

.prop-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #ffffff;
  margin: 0;
  padding: 0;
  display: block;
  line-height: 0;
}

.prop-image-wrapper {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  display: block;
  line-height: 0;
}

.prop-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  margin: 0;
  padding: 0;
}

.prop-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.3);
  background: #ffffff;
}

.prop-image-placeholder svg {
  width: 64px;
  height: 64px;
}

.props-empty {
  padding: 80px 40px;
  text-align: center;
}

.card-actions {
  display: flex;
  gap: 12px;
}

.step-actions {
  margin-top: 32px;
  text-align: center;
}

.step-actions .action-button {
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 500;
  transition: all 0.3s ease;
}

/* 操作按钮 */
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  background: rgba(0, 0, 0, 0.04);
  color: #6b7280;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.action-button:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.08);
  color: #111827;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.action-button--primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
  border: none;
}

.action-button--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.45);
  transform: translateY(-2px);
}

.button-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.edit-button {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.edit-button:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.12) 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .header-center {
    display: none;
  }
  
  .immersive-header {
    padding: 12px 20px;
  }
  
  .content-container {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .immersive-header {
    flex-wrap: wrap;
    padding: 12px 16px;
    gap: 12px;
  }

  .header-left {
    flex: 1;
    min-width: 0;
  }

  .novel-title {
    font-size: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-center {
    display: none;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
    gap: 8px;
  }

  .step-button {
    min-width: 70px;
    font-size: 13px;
    padding: 8px 12px;
  }

  .user-avatar {
    width: 28px;
    height: 28px;
  }

  .content-container {
    padding: 16px;
  }

  .info-card {
    margin-bottom: 16px;
  }

  .tab-panel {
    padding: 16px;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

}

/* 滚动条样式优化 */
.novel-detail.fullscreen::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.novel-detail.fullscreen::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.novel-detail.fullscreen::-webkit-scrollbar-thumb {
  background: #3b82f6;
  border-radius: 4px;
}

.novel-detail.fullscreen::-webkit-scrollbar-thumb:hover {
  background: #2563eb;
}
</style>
