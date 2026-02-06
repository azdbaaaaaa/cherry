<template>
  <div class="shot-editor">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">分镜头脚本编辑</h1>
    </div>

    <!-- 主要内容 -->
    <div class="page-content">
      <div class="content-container">
        <el-card v-if="loading" class="content-card">
          <el-skeleton :rows="5" animated />
        </el-card>

        <template v-else>
          <el-card class="content-card">
            <template #header>
              <div class="card-header">
                <h2 class="card-title">分镜头列表</h2>
                <el-button
                  v-if="shots.length > 0"
                  type="primary"
                  @click="regenerateAll"
                  :loading="regenerating"
                >
                  批量重新生成
                </el-button>
              </div>
            </template>

            <el-empty v-if="shots.length === 0" description="暂无分镜头数据" />

            <div v-else class="shots-list">
              <el-card
                v-for="(shot, index) in shots"
                :key="shot.id"
                class="shot-card"
                shadow="hover"
              >
                <template #header>
                  <div class="shot-header">
                    <span class="shot-number">分镜头 {{ shot.shot_number }}</span>
                    <span class="scene-number">场景 {{ shot.scene_number }}</span>
                    <el-tag v-if="shot.character" size="small">{{ shot.character }}</el-tag>
                  </div>
                </template>

                <div class="shot-content">
                  <el-form :model="shot" label-width="120px">
                    <el-form-item label="解说内容">
                      <el-input
                        v-model="shot.narration"
                        type="textarea"
                        :rows="3"
                        placeholder="请输入解说内容"
                      />
                    </el-form-item>

                    <el-form-item label="图片提示词">
                      <el-input
                        v-model="shot.image_prompt"
                        type="textarea"
                        :rows="2"
                        placeholder="请输入图片提示词"
                      />
                    </el-form-item>

                    <el-form-item label="视频提示词">
                      <el-input
                        v-model="shot.video_prompt"
                        type="textarea"
                        :rows="2"
                        placeholder="请输入视频提示词"
                      />
                    </el-form-item>

                    <el-row :gutter="20">
                      <el-col :span="12">
                        <el-form-item label="运镜方式">
                          <el-input
                            v-model="shot.camera_movement"
                            placeholder="如：推、拉、摇、移等"
                          />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="时长（秒）">
                          <el-input-number
                            v-model="shot.duration"
                            :min="0"
                            :precision="1"
                            :step="0.5"
                            placeholder="时长"
                          />
                        </el-form-item>
                      </el-col>
                    </el-row>

                    <el-form-item>
                      <el-button
                        type="primary"
                        @click="updateShot(shot)"
                        :loading="updating[shot.id]"
                      >
                        保存修改
                      </el-button>
                      <el-button
                        @click="regenerateShot(shot)"
                        :loading="regeneratingShots[shot.id]"
                      >
                        重新生成
                      </el-button>
                    </el-form-item>
                  </el-form>
                </div>
              </el-card>
            </div>
          </el-card>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { novelApi } from '@/api/novel'
import type { ShotInfo, UpdateShotRequest } from '@/types/novel'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const regenerating = ref(false)
const updating = ref<Record<string, boolean>>({})
const regeneratingShots = ref<Record<string, boolean>>({})
const shots = ref<ShotInfo[]>([])

const narrationId = computed(() => {
  const id = (route.params.narrationId || route.query.narrationId) as string
  if (!id && route.query.workflowId) {
    // 如果有 workflowId，提示用户需要 narrationId
    ElMessage.warning('请提供 narrationId 参数。可以通过工作流ID查询获取。')
  }
  return id
})

const fetchShots = async () => {
  try {
    loading.value = true
    const res = await novelApi.getShots(narrationId.value)
    shots.value = res.data.shots || []
  } catch (error) {
    ElMessage.error('获取分镜头列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const updateShot = async (shot: ShotInfo) => {
  try {
    updating.value[shot.id] = true
    const data: UpdateShotRequest = {
      narration: shot.narration,
      image_prompt: shot.image_prompt,
      video_prompt: shot.video_prompt,
      camera_movement: shot.camera_movement,
      duration: shot.duration
    }
    await novelApi.updateShot(shot.id, data)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  } finally {
    updating.value[shot.id] = false
  }
}

const regenerateShot = async (shot: ShotInfo) => {
  try {
    regeneratingShots.value[shot.id] = true
    await novelApi.regenerateShotScript(shot.id)
    ElMessage.success('重新生成成功，请刷新查看')
    await fetchShots()
  } catch (error) {
    ElMessage.error('重新生成失败')
    console.error(error)
  } finally {
    regeneratingShots.value[shot.id] = false
  }
}

const regenerateAll = async () => {
  try {
    await ElMessageBox.confirm('确定要批量重新生成所有分镜头脚本吗？', '提示', {
      type: 'warning'
    })
    regenerating.value = true
    for (const shot of shots.value) {
      await regenerateShot(shot)
    }
    ElMessage.success('批量重新生成完成')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量重新生成失败')
      console.error(error)
    }
  } finally {
    regenerating.value = false
  }
}


onMounted(() => {
  if (!narrationId.value) {
    ElMessage.warning('缺少 narrationId 参数，请从工作流详情页面进入')
    return
  }
  fetchShots()
})
</script>

<style scoped>
.shot-editor {
  height: 100%;
}

.page-header {
  margin-bottom: 24px;
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

.shots-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shot-card {
  margin-bottom: 0;
}

.shot-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shot-number {
  font-weight: 600;
  color: #303133;
}

.scene-number {
  color: #909399;
  font-size: 14px;
}

.shot-content {
  padding: 0;
}
</style>

