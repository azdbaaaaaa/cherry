<template>
  <div class="image-review">
    <!-- 页面标题和标签页 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">图片 Review</h1>
        <div class="header-actions">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="分镜头图片" name="shots" />
            <el-tab-pane label="角色图片" name="characters" />
            <el-tab-pane label="场景图片" name="scenes" />
            <el-tab-pane label="道具图片" name="props" />
          </el-tabs>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="page-content">
      <div class="content-container">
        <!-- 分镜头图片 -->
        <el-card v-if="activeTab === 'shots'" class="content-card">
          <template #header>
            <div class="card-header">
              <h2 class="card-title">分镜头图片</h2>
              <el-button
                type="primary"
                @click="generateShotImages"
                :loading="generating.shots"
                :disabled="!narrationId"
              >
                生成图片
              </el-button>
            </div>
          </template>
          <el-empty v-if="shotImages.length === 0" description="暂无图片" />
          <div v-else class="images-grid">
            <el-card
              v-for="img in shotImages"
              :key="img.id"
              class="image-card"
              shadow="hover"
            >
              <div class="image-wrapper">
                <img
                  v-if="img.image_resource_id"
                  :src="getImageUrl(img.image_resource_id)"
                  :alt="`分镜头 ${img.shot_number}`"
                  @error="handleImageError"
                />
                <el-empty v-else description="图片未生成" :image-size="80" />
              </div>
              <div class="image-info">
                <p><strong>场景:</strong> {{ img.scene_number }}</p>
                <p><strong>分镜头:</strong> {{ img.shot_number }}</p>
                <p><strong>角色:</strong> {{ img.character_name || '-' }}</p>
              </div>
              <div class="image-actions">
                <el-button size="small" @click="regenerateImage('shot', img.id)">
                  重新生成
                </el-button>
              </div>
            </el-card>
          </div>
        </el-card>

        <!-- 角色图片 -->
        <el-card v-if="activeTab === 'characters'" class="content-card">
          <template #header>
            <div class="card-header">
              <h2 class="card-title">角色图片</h2>
              <el-button
                type="primary"
                @click="generateCharacterImages"
                :loading="generating.characters"
                :disabled="!novelId"
              >
                生成图片
              </el-button>
            </div>
          </template>
          <el-empty v-if="characters.length === 0" description="暂无角色" />
          <div v-else class="images-grid">
            <el-card
              v-for="char in characters"
              :key="char.id"
              class="image-card"
              shadow="hover"
            >
              <div class="image-wrapper">
                <img
                  v-if="char.image_resource_id"
                  :src="getImageUrl(char.image_resource_id)"
                  :alt="char.name"
                  @error="handleImageError"
                />
                <el-empty v-else description="图片未生成" :image-size="80" />
              </div>
              <div class="image-info">
                <p><strong>名称:</strong> {{ char.name }}</p>
                <p><strong>性别:</strong> {{ char.gender || '-' }}</p>
                <p><strong>年龄段:</strong> {{ char.age_group || '-' }}</p>
              </div>
              <div class="image-actions">
                <el-button size="small" @click="regenerateImage('character', char.id)">
                  重新生成
                </el-button>
              </div>
            </el-card>
          </div>
        </el-card>

        <!-- 场景图片 -->
        <el-card v-if="activeTab === 'scenes'" class="content-card">
          <template #header>
            <div class="card-header">
              <h2 class="card-title">场景图片</h2>
              <el-button
                type="primary"
                @click="generateSceneImages"
                :loading="generating.scenes"
                :disabled="!narrationId"
              >
                生成图片
              </el-button>
            </div>
          </template>
          <el-empty v-if="scenes.length === 0" description="暂无场景" />
          <div v-else class="images-grid">
            <el-card
              v-for="scene in scenes"
              :key="scene.id"
              class="image-card"
              shadow="hover"
            >
              <div class="image-wrapper">
                <img
                  v-if="scene.image_resource_id"
                  :src="getImageUrl(scene.image_resource_id)"
                  :alt="`场景 ${scene.scene_number}`"
                  @error="handleImageError"
                />
                <el-empty v-else description="图片未生成" :image-size="80" />
              </div>
              <div class="image-info">
                <p><strong>场景编号:</strong> {{ scene.scene_number }}</p>
                <p><strong>描述:</strong> {{ scene.description || '-' }}</p>
              </div>
              <div class="image-actions">
                <el-button size="small" @click="regenerateImage('scene', scene.id)">
                  重新生成
                </el-button>
              </div>
            </el-card>
          </div>
        </el-card>

        <!-- 道具图片 -->
        <el-card v-if="activeTab === 'props'" class="content-card">
          <template #header>
            <div class="card-header">
              <h2 class="card-title">道具图片</h2>
              <el-button
                type="primary"
                @click="generatePropImages"
                :loading="generating.props"
                :disabled="!novelId"
              >
                生成图片
              </el-button>
            </div>
          </template>
          <el-empty v-if="props.length === 0" description="暂无道具" />
          <div v-else class="images-grid">
            <el-card
              v-for="prop in props"
              :key="prop.id"
              class="image-card"
              shadow="hover"
            >
              <div class="image-wrapper">
                <img
                  v-if="prop.image_resource_id"
                  :src="getImageUrl(prop.image_resource_id)"
                  :alt="prop.name"
                  @error="handleImageError"
                />
                <el-empty v-else description="图片未生成" :image-size="80" />
              </div>
              <div class="image-info">
                <p><strong>名称:</strong> {{ prop.name }}</p>
                <p><strong>类别:</strong> {{ prop.category || '-' }}</p>
                <p><strong>描述:</strong> {{ prop.description || '-' }}</p>
              </div>
              <div class="image-actions">
                <el-button size="small" @click="regenerateImage('prop', prop.id)">
                  重新生成
                </el-button>
              </div>
            </el-card>
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
import { resourceApi } from '@/api/resource'
import type { Image, Character, Prop, SceneInfo } from '@/types/novel'

const route = useRoute()
const router = useRouter()
const activeTab = ref('shots')
const generating = ref({
  shots: false,
  characters: false,
  scenes: false,
  props: false
})

const narrationId = computed(() => route.query.narrationId as string)
const novelId = computed(() => route.query.novelId as string)

const shotImages = ref<Image[]>([])
const characters = ref<Character[]>([])
const scenes = ref<SceneInfo[]>([])
const props = ref<Prop[]>([])

const fetchShotImages = async () => {
  if (!narrationId.value) return
  try {
    const res = await novelApi.listImages(narrationId.value)
    shotImages.value = res.data.images || []
  } catch (error) {
    console.error('获取分镜头图片失败', error)
  }
}

const fetchCharacters = async () => {
  if (!novelId.value) return
  try {
    const res = await novelApi.getCharacters(novelId.value)
    characters.value = res.data.characters || []
  } catch (error) {
    console.error('获取角色列表失败', error)
  }
}

const fetchScenes = async () => {
  if (!narrationId.value) return
  try {
    const res = await novelApi.getScenes(narrationId.value)
    scenes.value = res.data.scenes || []
  } catch (error) {
    console.error('获取场景列表失败', error)
  }
}

const fetchProps = async () => {
  if (!novelId.value) return
  try {
    const res = await novelApi.getProps(novelId.value)
    props.value = res.data.props || []
  } catch (error) {
    console.error('获取道具列表失败', error)
  }
}

const generateShotImages = async () => {
  if (!narrationId.value) {
    ElMessage.warning('缺少 narrationId')
    return
  }
  try {
    generating.value.shots = true
    await novelApi.generateImages(narrationId.value)
    ElMessage.success('图片生成任务已提交')
    setTimeout(() => fetchShotImages(), 2000)
  } catch (error) {
    ElMessage.error('生成图片失败')
    console.error(error)
  } finally {
    generating.value.shots = false
  }
}

const generateCharacterImages = async () => {
  if (!novelId.value) {
    ElMessage.warning('缺少 novelId')
    return
  }
  try {
    generating.value.characters = true
    await novelApi.generateCharacterImages(novelId.value)
    ElMessage.success('角色图片生成任务已提交')
    setTimeout(() => fetchCharacters(), 2000)
  } catch (error) {
    ElMessage.error('生成角色图片失败')
    console.error(error)
  } finally {
    generating.value.characters = false
  }
}

const generateSceneImages = async () => {
  if (!narrationId.value) {
    ElMessage.warning('缺少 narrationId')
    return
  }
  try {
    generating.value.scenes = true
    await novelApi.generateSceneImages(narrationId.value)
    ElMessage.success('场景图片生成任务已提交')
    setTimeout(() => fetchScenes(), 2000)
  } catch (error) {
    ElMessage.error('生成场景图片失败')
    console.error(error)
  } finally {
    generating.value.scenes = false
  }
}

const generatePropImages = async () => {
  if (!novelId.value) {
    ElMessage.warning('缺少 novelId')
    return
  }
  try {
    generating.value.props = true
    await novelApi.generatePropImages(novelId.value)
    ElMessage.success('道具图片生成任务已提交')
    setTimeout(() => fetchProps(), 2000)
  } catch (error) {
    ElMessage.error('生成道具图片失败')
    console.error(error)
  } finally {
    generating.value.props = false
  }
}

const regenerateImage = async (type: string, id: string) => {
  ElMessage.info('重新生成功能待实现')
  // TODO: 实现重新生成单个图片的逻辑
}

const getImageUrl = (resourceId: string) => {
  return `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/resources/${resourceId}/download-url`
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

const handleTabChange = (tab: string) => {
  if (tab === 'shots') fetchShotImages()
  else if (tab === 'characters') fetchCharacters()
  else if (tab === 'scenes') fetchScenes()
  else if (tab === 'props') fetchProps()
}


onMounted(() => {
  if (!narrationId.value && !novelId.value) {
    ElMessage.warning('缺少必要参数，请从工作流详情页面进入')
    return
  }
  handleTabChange(activeTab.value)
})
</script>

<style scoped>
.image-review {
  height: 100%;
}

.page-header {
  margin-bottom: 24px;
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

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.image-card {
  overflow: hidden;
}

.image-wrapper {
  width: 100%;
  height: 200px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-info {
  padding: 12px;
  font-size: 14px;
}

.image-info p {
  margin: 4px 0;
  color: #606266;
}

.image-actions {
  padding: 12px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}
</style>

