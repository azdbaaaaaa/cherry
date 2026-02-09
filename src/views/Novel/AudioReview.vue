<template>
  <div class="audio-review">
    <!-- 页面标题和操作 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">音频 Review</h1>
        <div class="header-actions">
          <el-button
            type="primary"
            @click="generateAudios"
            :loading="generating"
            :disabled="!narrationId"
          >
            生成音频
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="page-content">
      <div class="content-container">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <h2 class="card-title">音频列表</h2>
              <el-select v-model="selectedVersion" @change="fetchAudios" style="width: 150px">
                <el-option
                  v-for="v in versions"
                  :key="v"
                  :label="`版本 ${v}`"
                  :value="v"
                />
              </el-select>
            </div>
          </template>

          <el-empty v-if="audios.length === 0" description="暂无音频" />

          <div v-else class="audios-list">
            <el-card
              v-for="audio in audios"
              :key="audio.id"
              class="audio-card"
              shadow="hover"
            >
              <div class="audio-content">
                <div class="audio-info">
                  <h3>音频 #{{ audio.sequence }}</h3>
                  <p><strong>时长:</strong> {{ formatDuration(audio.duration) }}</p>
                  <p><strong>文本:</strong> {{ audio.text }}</p>
                  <p><strong>版本:</strong> {{ audio.version }}</p>
                  <p><strong>状态:</strong> 
                    <el-tag :type="getStatusType(audio.status)" size="small">
                      {{ getStatusLabel(audio.status) }}
                    </el-tag>
                  </p>
                </div>
                <div class="audio-player">
                  <audio
                    v-if="audio.audio_resource_id"
                    :src="getAudioUrl(audio.audio_resource_id)"
                    controls
                    preload="metadata"
                  />
                  <el-empty v-else description="音频未生成" :image-size="60" />
                </div>
              </div>
              <div class="audio-actions">
                <el-button size="small" @click="regenerateAudio(audio.id)">
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
import type { Audio } from '@/types/novel'

const route = useRoute()
const router = useRouter()
const generating = ref(false)
const audios = ref<Audio[]>([])
const versions = ref<number[]>([])
const selectedVersion = ref<number>(0)

const narrationId = computed(() => route.query.narrationId as string)

const fetchVersions = async () => {
  if (!narrationId.value) return
  try {
    const res = await novelApi.getAudioVersions(narrationId.value)
    versions.value = res.data.versions || []
    if (versions.value.length > 0) {
      selectedVersion.value = Math.max(...versions.value)
    }
  } catch (error) {
    console.error('获取音频版本列表失败', error)
  }
}

const fetchAudios = async () => {
  if (!narrationId.value) return
  try {
    const res = await novelApi.listAudios(
      narrationId.value,
      selectedVersion.value > 0 ? selectedVersion.value : undefined
    )
    audios.value = res.data.audios || []
  } catch (error) {
    ElMessage.error('获取音频列表失败')
    console.error(error)
  }
}

const generateAudios = async () => {
  if (!narrationId.value) {
    ElMessage.warning('缺少 narrationId')
    return
  }
  try {
    generating.value = true
    await novelApi.generateAudios(narrationId.value)
    ElMessage.success('音频生成任务已提交')
    setTimeout(() => {
      fetchVersions()
      fetchAudios()
    }, 2000)
  } catch (error) {
    ElMessage.error('生成音频失败')
    console.error(error)
  } finally {
    generating.value = false
  }
}

const regenerateAudio = async (audioId: string) => {
  ElMessage.info('重新生成功能待实现')
  // TODO: 实现重新生成单个音频的逻辑
}

const getAudioUrl = (resourceId: string) => {
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
    failed: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    completed: '已完成',
    pending: '处理中',
    failed: '失败'
  }
  return map[status] || status
}


onMounted(() => {
  if (!narrationId.value) {
    ElMessage.warning('缺少 narrationId 参数，请从工作流详情页面进入')
    return
  }
  fetchVersions()
  fetchAudios()
})
</script>

<style scoped>
.audio-review {
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
  max-width: 1200px;
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
  max-width: 1200px;
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

.audios-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.audio-card {
  margin-bottom: 0;
}

.audio-content {
  display: flex;
  gap: 24px;
}

.audio-info {
  flex: 1;
}

.audio-info h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
}

.audio-info p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
}

.audio-player {
  width: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-player audio {
  width: 100%;
}

.audio-actions {
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}
</style>

