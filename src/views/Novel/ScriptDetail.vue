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
        </div>
      <div class="header-center">
        <div class="custom-steps">
          <div 
            v-for="(step, index) in steps" 
            :key="index"
            class="custom-step"
            :class="{
              'is-active': currentStep === index + 1,
              'is-completed': currentStep > index + 1,
              'is-pending': currentStep < index + 1
            }"
          >
            <div class="custom-step-indicator">
              <div class="custom-step-number">{{ index + 1 }}</div>
            </div>
            <div class="custom-step-title">{{ step.title }}</div>
            <div v-if="index < steps.length - 1" class="custom-step-line"></div>
          </div>
        </div>
      </div>
      <div class="header-right">
          <button
          v-if="currentStep > 1"
          @click="goToPrevStep"
          class="step-button"
        >
          上一步
          </button>
          <button
          @click="goToNextStep"
          :disabled="!canGoToNextStep"
          class="step-button step-button--primary"
          >
          下一步
          </button>
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
        <template v-else-if="novel">
          <!-- 剧本信息卡片 -->
          <div class="info-card">
            <div class="info-card-header">
              <h2 class="info-card-title">剧本信息</h2>
              </div>
            <div class="info-card-body">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">标题</span>
                  <span class="info-value">{{ novel.title || '未命名剧本' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">旁白类型</span>
                  <span class="info-value">{{ novel.narration_type === 'narration' ? '旁白/解说' : '真人对话' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">风格</span>
                  <span class="info-value">{{ getStyleLabel(novel.style) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">章节数</span>
                  <span class="info-value">{{ chapters.length }} 章</span>
                </div>
                <div class="info-item">
                  <span class="info-label">创建时间</span>
                  <span class="info-value">{{ formatTime(novel.created_at) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">更新时间</span>
                  <span class="info-value">{{ formatTime(novel.updated_at) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 第一步：内容生成 -->
          <div v-if="currentStep === 1" class="step-content">
            <div class="tabs-container">
              <div class="tabs-header">
                <div 
                  v-for="tab in tabs" 
                  :key="tab.name"
                  :class="['tab-item', { 'is-active': activeTab === tab.name }]"
                  @click="activeTab = tab.name"
                >
                  {{ tab.label }}
              </div>
              </div>
              
              <div class="tabs-content">
                <!-- 场景和镜头 Tab -->
                <div v-if="activeTab === 'scenes'" class="tab-panel">
                  <div class="panel-header">
                    <span class="panel-title">场景列表（共 {{ scenes.length }} 个场景，{{ totalShots }} 个镜头）</span>
                    <button 
                      v-if="selectedChapter" 
                      @click="generateNarration"
                      :disabled="generating"
                      class="action-button action-button--primary"
                    >
                      <span v-if="generating" class="button-spinner"></span>
                      <span>{{ generating ? '生成中...' : '生成场景' }}</span>
                    </button>
                  </div>
                  <!-- 场景列表（自定义表格） -->
                  <div class="custom-table" :class="{ 'is-loading': loadingScenes }">
                    <div v-if="loadingScenes" class="table-loading-overlay">
                      <div class="loading-spinner"></div>
                    </div>
                    <div class="custom-table-header">
                      <div class="custom-table-cell" style="width: 50px;">展开</div>
                      <div class="custom-table-cell" style="width: 120px;">场景编号</div>
                      <div class="custom-table-cell" style="flex: 1;">场景描述</div>
                      <div class="custom-table-cell" style="width: 100px;">镜头数</div>
                      <div class="custom-table-cell" style="width: 80px;">序号</div>
                      <div class="custom-table-cell" style="width: 100px;">状态</div>
                    </div>
                    <div class="custom-table-body">
                      <div 
                        v-for="scene in scenesWithShots" 
                        :key="scene.id"
                        class="custom-table-row"
                        :class="{ 'is-expanded': expandedScenes.has(scene.id) }"
                      >
                        <div class="custom-table-row-main">
                          <div class="custom-table-cell" style="width: 50px;">
                            <svg 
                              class="expand-icon"
                              @click="toggleScene(scene.id)"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path v-if="!expandedScenes.has(scene.id)" d="M6 9l6 6 6-6"/>
                              <path v-else d="M18 15l-6-6-6 6"/>
                            </svg>
                  </div>
                          <div class="custom-table-cell" style="width: 120px;">
                            {{ scene.scene_number || '-' }}
                </div>
                          <div class="custom-table-cell" style="flex: 1;">
                            {{ scene.narration || '-' }}
                          </div>
                          <div class="custom-table-cell" style="width: 100px;">
                            {{ getShotsCountForScene(scene.id) }}
                          </div>
                          <div class="custom-table-cell" style="width: 80px;">
                            {{ scene.sequence || '-' }}
                          </div>
                          <div class="custom-table-cell" style="width: 100px;">
                            <span 
                              class="status-badge"
                              :class="scene.status === 'completed' ? 'status-success' : 'status-pending'"
                            >
                              {{ scene.status === 'completed' ? '已完成' : '待处理' }}
                            </span>
                          </div>
                        </div>
                        <!-- 展开的镜头列表 -->
                        <div 
                          v-if="expandedScenes.has(scene.id) && scene.shots && scene.shots.length > 0"
                          class="custom-table-row-expanded"
                        >
                          <div class="shots-container">
                            <div class="shots-header">镜头列表（{{ scene.shots.length }} 个）</div>
                            <div class="shots-table">
                              <div class="shots-table-header">
                                <div class="shots-table-cell" style="width: 120px;">镜头编号</div>
                                <div class="shots-table-cell" style="flex: 1;">解说</div>
                                <div class="shots-table-cell" style="width: 100px;">人物</div>
                                <div class="shots-table-cell" style="width: 120px;">运镜</div>
                                <div class="shots-table-cell" style="flex: 1;">图片提示词</div>
                                <div class="shots-table-cell" style="width: 80px;">序号</div>
                                <div class="shots-table-cell" style="width: 120px;">操作</div>
                              </div>
                              <div class="shots-table-body">
                                <div 
                                  v-for="shot in scene.shots" 
                                  :key="shot.id || shot.shot_number"
                                  class="shots-table-row"
                                >
                                  <div class="shots-table-cell" style="width: 120px;">
                                    {{ shot.shot_number || '-' }}
                                  </div>
                                  <div class="shots-table-cell" style="flex: 1;">
                                    {{ shot.narration || '-' }}
                                  </div>
                                  <div class="shots-table-cell" style="width: 100px;">
                                    {{ shot.character || '-' }}
                                  </div>
                                  <div class="shots-table-cell" style="width: 120px;">
                                    {{ shot.camera_movement || '-' }}
                                  </div>
                                  <div class="shots-table-cell" style="flex: 1;">
                                    {{ shot.image_prompt || '-' }}
                                  </div>
                                  <div class="shots-table-cell" style="width: 80px;">
                                    {{ shot.index || '-' }}
                                  </div>
                                  <div class="shots-table-cell" style="width: 120px;">
                                    <button class="edit-button" @click="editShot(shot)">编辑</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div 
                          v-else-if="expandedScenes.has(scene.id)"
                          class="custom-table-row-expanded"
                        >
                          <div class="no-shots">该场景暂无镜头</div>
                        </div>
                      </div>
                      <div v-if="scenesWithShots.length === 0" class="custom-table-empty">
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
                
                <!-- 人物 Tab -->
                <div v-if="activeTab === 'characters'" class="tab-panel">
                  <div class="panel-header">
                    <span class="panel-title">人物列表（共 {{ characters.length }} 个人物）</span>
                    <button
                      @click="generateCharacterImages"
                      :disabled="generatingCharacters"
                      class="action-button action-button--primary"
                    >
                      <span v-if="generatingCharacters" class="button-spinner"></span>
                      <span>{{ generatingCharacters ? '生成中...' : '人物抽卡' }}</span>
                    </button>
                  </div>
                  <!-- 人物列表（自定义表格） -->
                  <div class="custom-table" :class="{ 'is-loading': loadingCharacters }">
                    <div v-if="loadingCharacters" class="table-loading-overlay">
                      <div class="loading-spinner"></div>
                    </div>
                    <div class="custom-table-header">
                      <div class="custom-table-cell" style="width: 120px;">姓名</div>
                      <div class="custom-table-cell" style="flex: 1;">描述</div>
                      <div class="custom-table-cell" style="width: 80px;">性别</div>
                      <div class="custom-table-cell" style="width: 100px;">年龄段</div>
                      <div class="custom-table-cell" style="width: 120px;">图片</div>
                </div>
                    <div class="custom-table-body">
                      <div 
                        v-for="character in characters" 
                        :key="character.id || character.name"
                        class="custom-table-row"
                      >
                        <div class="custom-table-cell" style="width: 120px;">
                          {{ character.name || '-' }}
                        </div>
                        <div class="custom-table-cell" style="flex: 1;">
                          {{ character.description || '-' }}
                        </div>
                        <div class="custom-table-cell" style="width: 80px;">
                          {{ character.gender || '-' }}
                        </div>
                        <div class="custom-table-cell" style="width: 100px;">
                          {{ character.age_group || '-' }}
                        </div>
                        <div class="custom-table-cell" style="width: 120px;">
                          <img 
                            v-if="character.image_resource_id" 
                            :src="character.image_resource_id" 
                            class="table-image"
                            alt="人物图片"
                          />
                          <span v-else class="empty-text">-</span>
                        </div>
                      </div>
                      <div v-if="characters.length === 0" class="custom-table-empty">
                        <div class="empty-state-content">
                          <svg class="empty-icon" viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
                            <path d="M32 20v24M20 32h24" stroke="currentColor" stroke-width="2"/>
                          </svg>
                          <p class="empty-text">暂无人物数据</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 道具 Tab -->
                <div v-if="activeTab === 'props'" class="tab-panel">
                  <div class="panel-header">
                    <span class="panel-title">道具列表（共 {{ props.length }} 个道具）</span>
                    <button
                      @click="generatePropImages"
                      :disabled="generatingProps"
                      class="action-button action-button--primary"
                    >
                      <span v-if="generatingProps" class="button-spinner"></span>
                      <span>{{ generatingProps ? '生成中...' : '道具抽卡' }}</span>
                    </button>
                  </div>
                  <!-- 道具列表（自定义表格） -->
                  <div class="custom-table" :class="{ 'is-loading': loadingProps }">
                    <div v-if="loadingProps" class="table-loading-overlay">
                      <div class="loading-spinner"></div>
                    </div>
                    <div class="custom-table-header">
                      <div class="custom-table-cell" style="width: 120px;">名称</div>
                      <div class="custom-table-cell" style="flex: 1;">描述</div>
                      <div class="custom-table-cell" style="width: 100px;">分类</div>
                      <div class="custom-table-cell" style="width: 120px;">图片</div>
                </div>
                    <div class="custom-table-body">
                      <div 
                        v-for="prop in props" 
                        :key="prop.id || prop.name"
                        class="custom-table-row"
                      >
                        <div class="custom-table-cell" style="width: 120px;">
                          {{ prop.name || '-' }}
                        </div>
                        <div class="custom-table-cell" style="flex: 1;">
                          {{ prop.description || '-' }}
                        </div>
                        <div class="custom-table-cell" style="width: 100px;">
                          {{ prop.category || '-' }}
                        </div>
                        <div class="custom-table-cell" style="width: 120px;">
                          <img 
                            v-if="prop.image_resource_id" 
                            :src="prop.image_resource_id" 
                            class="table-image"
                            alt="道具图片"
                          />
                          <span v-else class="empty-text">-</span>
                        </div>
                      </div>
                      <div v-if="props.length === 0" class="custom-table-empty">
                        <div class="empty-state-content">
                          <svg class="empty-icon" viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
                            <path d="M32 20v24M20 32h24" stroke="currentColor" stroke-width="2"/>
                          </svg>
                          <p class="empty-text">暂无道具数据</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 其他步骤（待实现） -->
          <div v-else class="step-content">
            <div class="empty-state">
              <div class="empty-state-content">
                <svg class="empty-icon" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
                  <path d="M32 20v24M20 32h24" stroke="currentColor" stroke-width="2"/>
                </svg>
                <p class="empty-text">第{{ currentStep }}步功能开发中...</p>
              </div>
              <div class="step-actions">
                <button @click="goToPrevStep" v-if="currentStep > 1" class="action-button">返回上一步</button>
              </div>
            </div>
          </div>
        </template>

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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
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
const activeTab = ref('scenes') // 当前tab：scenes, characters, props
const scenes = ref<SceneInfo[]>([])
const shots = ref<ShotInfo[]>([])
const characters = ref<Character[]>([])
const props = ref<Prop[]>([])
const selectedChapter = ref<Chapter | null>(null)
const expandedScenes = ref<Set<string>>(new Set()) // 展开的场景ID集合

// Tab 配置
const tabs = [
  { name: 'scenes', label: '场景与镜头' },
  { name: 'characters', label: '人物' },
  { name: 'props', label: '道具' }
]

// 步骤配置
const steps = [
  { title: '内容生成' },
  { title: '转换' },
  { title: '视频生成' },
  { title: '合并' }
]

// 切换场景展开/收起
const toggleScene = (sceneId: string) => {
  if (expandedScenes.value.has(sceneId)) {
    expandedScenes.value.delete(sceneId)
  } else {
    expandedScenes.value.add(sceneId)
  }
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

const novelId = computed(() => route.params.id as string)

// 是否可以进入下一步（第一步至少要有场景数据）
const canGoToNextStep = computed(() => {
  if (currentStep.value === 1) {
    return scenes.value.length > 0
  }
  return true
})

const fetchNovel = async () => {
  if (!novelId.value) {
    ElMessage.error('剧本ID无效')
    router.push('/novel')
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
  if (!novel.value) return
  try {
    // 获取章节列表
    const chaptersRes = await novelApi.getChapters(novel.value.id)
    chapters.value = chaptersRes.data.chapters || []
    
    // 默认选择第一个章节
    if (chapters.value.length > 0) {
      selectedChapter.value = chapters.value[0]
      // 加载第一步的数据
      await loadStep1Data()
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
    characters.value = res.data.characters || []
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
    // 注意：后端可能还没有道具列表接口，这里先留空
    // const res = await novelApi.getProps(novel.value.id)
    // props.value = res.data.props || []
    props.value = []
  } catch (error: any) {
    console.error('获取道具列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '获取道具列表失败')
  } finally {
    loadingProps.value = false
  }
}

// 生成场景（生成解说）
const generateNarration = async () => {
  if (!selectedChapter.value) {
    ElMessage.warning('请先选择章节')
    return
  }
  try {
    generating.value = true
    await novelApi.generateNarration(selectedChapter.value.id)
    ElMessage.success('场景生成中，请稍候...')
    // 等待一段时间后刷新场景列表
    setTimeout(() => {
      loadScenes()
    }, 2000)
  } catch (error: any) {
    console.error('生成场景失败:', error)
    ElMessage.error(error?.response?.data?.message || '生成场景失败')
  } finally {
    generating.value = false
  }
}

// 生成人物图片（人物抽卡）
const generateCharacterImages = async () => {
  if (!novel.value) return
  try {
    generatingCharacters.value = true
    await novelApi.generateCharacterImages(novel.value.id)
    ElMessage.success('人物抽卡中，请稍候...')
    // 等待一段时间后刷新人物列表
    setTimeout(() => {
      loadCharacters()
    }, 2000)
  } catch (error: any) {
    console.error('人物抽卡失败:', error)
    ElMessage.error(error?.response?.data?.message || '人物抽卡失败')
  } finally {
    generatingCharacters.value = false
  }
}

// 生成道具图片（道具抽卡）
const generatePropImages = async () => {
  if (!novel.value) return
  try {
    generatingProps.value = true
    await novelApi.generatePropImages(novel.value.id)
    ElMessage.success('道具抽卡中，请稍候...')
    // 等待一段时间后刷新道具列表
    setTimeout(() => {
      loadProps()
    }, 2000)
  } catch (error: any) {
    console.error('道具抽卡失败:', error)
    ElMessage.error(error?.response?.data?.message || '道具抽卡失败')
  } finally {
    generatingProps.value = false
  }
}

// 编辑镜头
const editShot = (_shot: ShotInfo) => {
  // TODO: 实现编辑镜头功能
  ElMessage.info('编辑镜头功能开发中...')
}

// 步骤导航
const goToNextStep = () => {
  if (currentStep.value < 4) {
    currentStep.value++
  }
}

const goToPrevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// 监听 tab 切换，加载对应数据
watch(activeTab, () => {
  loadStep1Data()
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
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
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
  overflow: hidden;
  margin-top: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
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
  align-items: center;
  border-right: 1px solid #e5e7eb;
  line-height: 1.5;
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
