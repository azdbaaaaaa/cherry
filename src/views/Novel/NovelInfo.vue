<template>
  <div class="novel-info-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" icon="ArrowLeft" text>返回</el-button>
        <h1 class="page-title">{{ novel?.title || '剧本详情' }}</h1>
      </div>
      <div class="header-right">
        <!-- 创作视频按钮已移到每个章节上 -->
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="novel" class="content-container">
      <!-- 剧本基本信息 -->
      <el-card class="info-card" shadow="never">
        <div class="novel-info">
          <div class="info-row">
            <span class="label">剧本名称：</span>
            <span class="value">{{ novel.title || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">作者：</span>
            <span class="value">{{ novel.author || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">简介：</span>
            <span class="value">{{ novel.description || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">风格：</span>
            <span class="value">{{ getStyleLabel(novel.style) }}</span>
          </div>
          <div class="info-row">
            <span class="label">旁白类型：</span>
            <span class="value">{{ getNarrationTypeLabel(novel.narration_type) }}</span>
          </div>
          <div class="info-row">
            <span class="label">章节数：</span>
            <span class="value">{{ chapters.length }}</span>
          </div>
        </div>
      </el-card>

      <!-- 章节、角色和道具 TAB -->
      <el-card class="content-card" shadow="never">
        <el-tabs v-model="activeTab" class="content-tabs">
          <!-- 章节列表 TAB -->
          <el-tab-pane label="章节列表" name="chapters">
            <div class="tab-content">
              <div v-if="chapters.length === 0" class="empty-state">
                <p>暂无章节，请先切分章节</p>
              </div>
              <div v-else class="chapters-list">
                <div
                  v-for="chapter in chapters"
                  :key="chapter.id"
                  class="chapter-item"
                >
                  <div class="chapter-content" @click="goToChapterDetail(chapter.id)">
                    <span class="chapter-number">第 {{ chapter.sequence }} 章</span>
                    <span class="chapter-title">{{ chapter.title || `第 ${chapter.sequence} 章` }}</span>
                    <span class="chapter-meta">
                      <span>{{ chapter.word_count }} 字</span>
                      <span class="meta-divider">·</span>
                      <span>{{ chapter.total_chars }} 字符</span>
                    </span>
                  </div>
                  <div class="chapter-actions" @click.stop>
                    <el-button
                      type="primary"
                      size="small"
                      @click="goToCreateVideo(chapter.id)"
                    >
                      <el-icon><VideoPlay /></el-icon>
                      创作视频
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 角色 TAB -->
          <el-tab-pane label="角色" name="characters">
            <div class="tab-content">
              <div class="tab-header">
                <h3>角色列表</h3>
                <div class="tab-actions">
                  <el-button
                    type="primary"
                    @click="generateCharacters"
                    :loading="generatingCharacters"
                    :disabled="!canGenerateCharacters"
                  >
                    <el-icon><Plus /></el-icon>
                    {{ generatingCharacters ? '生成中...' : '生成角色' }}
                  </el-button>
                  <el-button @click="loadCharacters">刷新</el-button>
                </div>
              </div>

              <div v-if="loadingCharacters" class="loading-state">
                <el-skeleton :rows="3" animated />
              </div>
              <div v-else-if="characters.length === 0" class="empty-state">
                <p>暂无角色，点击"生成角色"按钮生成</p>
              </div>
              <div v-else class="characters-grid">
                <div v-for="character in characters" :key="character.id" class="character-card">
                  <div class="character-header">
                    <h4>{{ character.name }}</h4>
                    <el-tag :type="getStatusType(character.status)">{{ character.status }}</el-tag>
                  </div>
                  <div class="character-info">
                    <p><strong>性别：</strong>{{ character.gender || '-' }}</p>
                    <p><strong>年龄段：</strong>{{ character.age_range || '-' }}</p>
                    <p><strong>描述：</strong>{{ character.description || '-' }}</p>
                    <p v-if="character.image_prompt" class="image-prompt">
                      <strong>图片提示词：</strong>{{ character.image_prompt }}
                    </p>
                  </div>
                  
                  <!-- 角色图片列表 -->
                  <div v-if="characterImages[character.id]?.length > 0" class="character-images">
                    <div class="images-title">角色图片（{{ characterImages[character.id].length }} 张）</div>
                    <div class="images-grid">
                      <div
                        v-for="img in characterImages[character.id]"
                        :key="img.id"
                        class="image-item"
                      >
                        <img :src="img.image_url" :alt="`${character.name} - ${getImageSubtypeLabel(img.character_image_subtype)}`" />
                        <div class="image-label">{{ getImageSubtypeLabel(img.character_image_subtype) }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="character-actions">
                    <el-button
                      size="small"
                      type="primary"
                      @click="generateCharacterImages(character.id)"
                      :loading="generatingCharacterImages[character.id]"
                      :disabled="!character.image_prompt"
                    >
                      {{ generatingCharacterImages[character.id] ? '生成中...' : '生成图片' }}
                    </el-button>
                    <el-button
                      size="small"
                      @click="loadCharacterImages(character.id)"
                      :loading="loadingCharacterImages[character.id]"
                    >
                      刷新图片
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 道具 TAB -->
          <el-tab-pane label="道具" name="props">
            <div class="tab-content">
              <div class="tab-header">
                <h3>道具列表</h3>
                <div class="tab-actions">
                  <el-button
                    type="primary"
                    @click="generateProps"
                    :loading="generatingProps"
                    :disabled="!canGenerateProps"
                  >
                    <el-icon><Plus /></el-icon>
                    {{ generatingProps ? '生成中...' : '生成道具' }}
                  </el-button>
                  <el-button @click="loadProps">刷新</el-button>
                </div>
              </div>

              <div v-if="loadingProps" class="loading-state">
                <el-skeleton :rows="3" animated />
              </div>
              <div v-else-if="props.length === 0" class="empty-state">
                <p>暂无道具，点击"生成道具"按钮生成</p>
              </div>
              <div v-else class="props-grid">
                <div v-for="prop in props" :key="prop.id" class="prop-card">
                  <div class="prop-header">
                    <h4>{{ prop.name }}</h4>
                    <el-tag :type="getStatusType(prop.status)">{{ prop.status }}</el-tag>
                  </div>
                  <div class="prop-info">
                    <p><strong>类别：</strong>{{ prop.category || '-' }}</p>
                    <p><strong>描述：</strong>{{ prop.description || '-' }}</p>
                    <p v-if="prop.image_prompt" class="image-prompt">
                      <strong>图片提示词：</strong>{{ prop.image_prompt }}
                    </p>
                  </div>
                  
                  <!-- 道具图片列表 -->
                  <div v-if="propImages[prop.id]?.length > 0" class="prop-images">
                    <div class="images-title">道具图片（{{ propImages[prop.id].length }} 张）</div>
                    <div class="images-grid">
                      <div
                        v-for="img in propImages[prop.id]"
                        :key="img.id"
                        class="image-item"
                      >
                        <img :src="img.image_url" :alt="prop.name" />
                        <div class="image-label">版本 {{ img.version }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="prop-actions">
                    <el-button
                      size="small"
                      type="primary"
                      @click="generatePropImages(prop.id)"
                      :loading="generatingPropImages[prop.id]"
                      :disabled="!prop.image_prompt"
                    >
                      {{ generatingPropImages[prop.id] ? '生成中...' : '生成图片' }}
                    </el-button>
                    <el-button
                      size="small"
                      @click="loadPropImages(prop.id)"
                      :loading="loadingPropImages[prop.id]"
                    >
                      刷新图片
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { VideoPlay, Plus } from '@element-plus/icons-vue'
import { novelApi } from '@/api/novel'
import type { Novel, Chapter, Character, Prop } from '@/types/novel'

const route = useRoute()
const router = useRouter()

const novelId = computed(() => route.params.id as string)

const loading = ref(false)
const novel = ref<Novel | null>(null)
const chapters = ref<Chapter[]>([])

const activeTab = ref('chapters')
const characters = ref<Character[]>([])
const props = ref<Prop[]>([])
const loadingCharacters = ref(false)
const loadingProps = ref(false)
const generatingCharacters = ref(false)
const generatingProps = ref(false)
const generatingCharacterImages = ref<Record<string, boolean>>({})
const generatingPropImages = ref<Record<string, boolean>>({})
const loadingCharacterImages = ref<Record<string, boolean>>({})
const loadingPropImages = ref<Record<string, boolean>>({})
const characterImages = ref<Record<string, import('@/types/novel').Image[]>>({})
const propImages = ref<Record<string, import('@/types/novel').Image[]>>({})

const canCreateVideo = computed(() => chapters.value.length > 0)
const canGenerateCharacters = computed(() => !!novel.value && chapters.value.length > 0)
const canGenerateProps = computed(() => !!novel.value && chapters.value.length > 0)

// 加载剧本详情
const loadNovel = async () => {
  try {
    loading.value = true
    const res = await novelApi.getNovel(novelId.value)
    novel.value = (res.data as any).novel || res.data
  } catch (error: any) {
    console.error('加载剧本详情失败:', error)
    ElMessage.error(error?.response?.data?.message || '加载剧本详情失败')
  } finally {
    loading.value = false
  }
}

// 加载章节列表
const loadChapters = async () => {
  try {
    const res = await novelApi.getChapters(novelId.value)
    chapters.value = (res.data as any).chapters || res.data || []
  } catch (error: any) {
    console.error('加载章节列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '加载章节列表失败')
  }
}

// 加载角色列表
const loadCharacters = async () => {
  try {
    loadingCharacters.value = true
    const res = await novelApi.getCharacters(novelId.value)
    characters.value = (res.data as any).characters || res.data || []
  } catch (error: any) {
    console.error('加载角色列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '加载角色列表失败')
  } finally {
    loadingCharacters.value = false
  }
}

// 加载道具列表
const loadProps = async () => {
  try {
    loadingProps.value = true
    const res = await novelApi.getProps(novelId.value)
    props.value = (res.data as any).props || res.data || []
  } catch (error: any) {
    console.error('加载道具列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '加载道具列表失败')
  } finally {
    loadingProps.value = false
  }
}

// 生成角色（基于整个小说内容）
const generateCharacters = async () => {
  if (!novel.value) return

  try {
    generatingCharacters.value = true
    await novelApi.generateCharactersFromNovel(novelId.value)
    ElMessage.success('角色和道具生成成功')
    // 等待一段时间后刷新
    setTimeout(() => {
      loadCharacters()
      loadProps()
    }, 2000)
  } catch (error: any) {
    console.error('生成角色失败:', error)
    ElMessage.error(error?.response?.data?.message || '生成角色失败')
  } finally {
    generatingCharacters.value = false
  }
}

// 生成道具（基于整个小说内容）
const generateProps = async () => {
  // 道具生成与角色生成使用同一个接口
  await generateCharacters()
}

// 加载角色图片列表
const loadCharacterImages = async (characterId: string) => {
  try {
    loadingCharacterImages.value[characterId] = true
    const res = await novelApi.getCharacterImages(characterId)
    characterImages.value[characterId] = (res.data as any).images || []
  } catch (error: any) {
    console.error('加载角色图片失败:', error)
    ElMessage.error(error?.response?.data?.message || '加载角色图片失败')
  } finally {
    loadingCharacterImages.value[characterId] = false
  }
}

// 生成角色图片
const generateCharacterImages = async (characterId: string) => {
  if (!novel.value) return

  try {
    generatingCharacterImages.value[characterId] = true
    await novelApi.generateCharacterImages(novelId.value)
    ElMessage.success('角色图片生成任务已提交')
    // 等待一段时间后刷新状态和图片列表
    setTimeout(() => {
      loadCharacters()
      loadCharacterImages(characterId)
    }, 2000)
  } catch (error: any) {
    console.error('生成角色图片失败:', error)
    ElMessage.error(error?.response?.data?.message || '生成角色图片失败')
  } finally {
    generatingCharacterImages.value[characterId] = false
  }
}

// 加载道具图片列表
const loadPropImages = async (propId: string) => {
  try {
    loadingPropImages.value[propId] = true
    const res = await novelApi.getPropImages(propId)
    propImages.value[propId] = (res.data as any).images || []
  } catch (error: any) {
    console.error('加载道具图片失败:', error)
    ElMessage.error(error?.response?.data?.message || '加载道具图片失败')
  } finally {
    loadingPropImages.value[propId] = false
  }
}

// 生成道具图片
const generatePropImages = async (propId: string) => {
  if (!novel.value) return

  try {
    generatingPropImages.value[propId] = true
    await novelApi.generatePropImages(novelId.value)
    ElMessage.success('道具图片生成任务已提交')
    // 等待一段时间后刷新状态和图片列表
    setTimeout(() => {
      loadProps()
      loadPropImages(propId)
    }, 2000)
  } catch (error: any) {
    console.error('生成道具图片失败:', error)
    ElMessage.error(error?.response?.data?.message || '生成道具图片失败')
  } finally {
    generatingPropImages.value[propId] = false
  }
}

// 跳转到创作视频页面
const goToCreateVideo = (chapterId: string) => {
  router.push({ 
    name: 'NovelCreateVideo', 
    params: { 
      novelId: novelId.value,
      chapterId: chapterId
    } 
  })
}

// 跳转到章节详情
const goToChapterDetail = (chapterId: string) => {
  router.push({ name: 'ChapterDetail', params: { chapterId } })
}

// 返回
const goBack = () => {
  router.push({ name: 'NovelList' })
}

// 获取风格标签
const getStyleLabel = (style: string) => {
  const labels: Record<string, string> = {
    anime: '漫剧',
    live: '真人剧',
    mixed: '混合'
  }
  return labels[style] || style
}

// 获取旁白类型标签
const getNarrationTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    narration: '旁白/解说',
    dialogue: '真人对话'
  }
  return labels[type] || type
}

// 获取状态类型
const getStatusType = (status: string) => {
  const types: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    completed: 'success',
    pending: 'warning',
    failed: 'danger'
  }
  return types[status] || 'info'
}

// 获取图片子类型标签
const getImageSubtypeLabel = (subtype?: string) => {
  const labels: Record<string, string> = {
    front: '正视图',
    three_view: '三视图',
    detail: '细节图'
  }
  return labels[subtype || ''] || '图片'
}

// 加载所有角色和道具的图片列表
const loadAllImages = async () => {
  // 加载所有角色的图片
  for (const character of characters.value) {
    await loadCharacterImages(character.id)
  }
  // 加载所有道具的图片
  for (const prop of props.value) {
    await loadPropImages(prop.id)
  }
}

onMounted(() => {
  loadNovel()
  loadChapters()
  loadCharacters().then(() => {
    loadAllImages()
  })
  loadProps().then(() => {
    loadAllImages()
  })
})
</script>

<style scoped lang="scss">
.novel-info-page {
  padding: 24px;
  max-width: 1400px;
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
.content-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .chapter-count {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
}

.novel-info {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .info-row {
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

.chapters-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  .chapter-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      border-color: var(--el-color-primary);
      background-color: var(--el-fill-color-light);
    }

    .chapter-content {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      min-width: 0; // 允许内容收缩

      .chapter-number {
        font-weight: 600;
        color: var(--el-color-primary);
        white-space: nowrap;
      }

      .chapter-title {
        font-size: 14px;
        font-weight: 500;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .chapter-meta {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        white-space: nowrap;

        .meta-divider {
          margin: 0 4px;
        }
      }
    }

    .chapter-actions {
      margin-left: 12px;
      flex-shrink: 0;
    }
  }
}

.content-tabs {
  .tab-content {
    padding-top: 16px;

    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .tab-actions {
        display: flex;
        gap: 12px;
      }
    }
  }
}

.characters-grid,
.props-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.character-card,
.prop-card {
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;

  .character-header,
  .prop-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
  }

  .character-info,
  .prop-info {
    margin-bottom: 12px;

    p {
      margin: 8px 0;
      font-size: 14px;
      color: var(--el-text-color-regular);

      strong {
        color: var(--el-text-color-primary);
      }

      &.image-prompt {
        padding: 8px;
        background-color: var(--el-fill-color-light);
        border-radius: 4px;
        font-size: 12px;
        word-break: break-all;
      }
    }
  }

  .character-actions,
  .prop-actions {
    display: flex;
    gap: 8px;
  }
}

.loading-container,
.loading-state,
.empty-state {
  padding: 40px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.character-images,
.prop-images {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color);

  .images-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--el-text-color-primary);
  }

  .images-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;

    .image-item {
      position: relative;
      border: 1px solid var(--el-border-color);
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: var(--el-color-primary);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      img {
        width: 100%;
        height: 120px;
        object-fit: cover;
        display: block;
      }

      .image-label {
        padding: 4px 8px;
        font-size: 12px;
        text-align: center;
        background-color: var(--el-fill-color-light);
        color: var(--el-text-color-secondary);
      }
    }
  }
}
</style>

