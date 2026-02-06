<template>
  <div class="novel-upload">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">上传小说</h1>
    </div>

    <!-- 主要内容 -->
    <div class="page-content">
      <div class="upload-container">
        <el-card class="upload-card glass">
          <!-- 步骤指示器 -->
          <el-steps :active="currentStep" finish-status="success" class="steps-indicator">
            <el-step title="上传文件" description="选择并上传小说文件" />
            <el-step title="创建小说" description="从文件创建小说记录" />
            <el-step title="切分章节" description="将小说切分为多个章节" />
          </el-steps>

          <!-- 步骤内容 -->
          <div class="step-content">
            <!-- 步骤 1: 上传文件 -->
            <div v-if="currentStep === 0" class="step-panel">
              <h2 class="step-title">上传小说文件</h2>
              <p class="step-description">请选择或拖拽小说文件到此区域上传</p>

              <el-upload
                ref="uploadRef"
                class="file-upload"
                drag
                :auto-upload="false"
                :on-change="handleFileChange"
                :on-remove="handleFileRemove"
                :limit="1"
                accept=".txt,.doc,.docx,.pdf"
                :disabled="uploading"
              >
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">
                  <p class="upload-title">点击或拖拽文件到此区域上传</p>
                  <p class="upload-tip">支持 TXT、DOC、DOCX、PDF 文件，最大 100MB</p>
                </div>
                <template #tip>
                  <div class="upload-tip-text">
                    <el-icon><InfoFilled /></el-icon>
                    请上传符合要求的文件格式
                  </div>
                </template>
              </el-upload>

              <!-- 文件信息预览 -->
              <div v-if="selectedFile" class="file-preview">
                <el-card class="file-info-card">
                  <div class="file-info">
                    <el-icon class="file-icon"><Document /></el-icon>
                    <div class="file-details">
                      <p class="file-name">{{ selectedFile.name }}</p>
                      <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
                    </div>
                  </div>
                </el-card>
              </div>

              <!-- 上传进度 -->
              <div v-if="uploading" class="upload-progress">
                <el-progress
                  :percentage="uploadProgress"
                  :status="uploadProgress === 100 ? 'success' : undefined"
                />
                <p class="progress-text">上传中... {{ uploadProgress }}%</p>
              </div>

              <!-- 上传成功信息 -->
              <div v-if="uploadResult" class="upload-result">
                <el-card class="result-card success">
                  <div class="result-content">
                    <el-icon class="result-icon"><Check /></el-icon>
                    <div class="result-details">
                      <p class="result-title">文件上传成功</p>
                      <div class="result-info">
                        <p><span class="label">文件名：</span>{{ uploadResult.file_name }}</p>
                        <p><span class="label">文件大小：</span>{{ formatFileSize(uploadResult.file_size) }}</p>
                        <p><span class="label">资源ID：</span>
                          <el-button
                            text
                            type="primary"
                            @click="copyToClipboard(uploadResult.resource_id)"
                          >
                            {{ uploadResult.resource_id }}
                            <el-icon><CopyDocument /></el-icon>
                          </el-button>
                        </p>
                      </div>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>

            <!-- 步骤 2: 创建小说 -->
            <div v-if="currentStep === 1" class="step-panel">
              <h2 class="step-title">创建小说</h2>
              <p class="step-description">基于上传的文件创建小说记录</p>

              <el-form
                :model="novelForm"
                :rules="novelRules"
                ref="novelFormRef"
                label-position="top"
                class="novel-form"
              >
                <el-form-item label="小说名称" prop="name">
                  <el-input
                    v-model="novelForm.name"
                    placeholder="请输入小说名称（可选，默认使用文件名）"
                    size="large"
                    clearable
                  >
                    <template #prefix>
                      <el-icon><Edit /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item label="工作流ID" prop="workflow_id">
                  <el-input
                    v-model="novelForm.workflow_id"
                    placeholder="请输入工作流ID（从路由参数获取或手动输入）"
                    size="large"
                    clearable
                  >
                    <template #prefix>
                      <el-icon><Connection /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </el-form>

              <!-- 创建进度 -->
              <div v-if="creating" class="create-progress">
                <el-loading :loading="creating" text="正在创建小说..." />
              </div>

              <!-- 创建成功信息 -->
              <div v-if="novelResult" class="novel-result">
                <el-card class="result-card success">
                  <div class="result-content">
                    <el-icon class="result-icon"><Check /></el-icon>
                    <div class="result-details">
                      <p class="result-title">小说创建成功</p>
                      <div class="result-info">
                        <p><span class="label">小说ID：</span>
                          <el-button
                            text
                            type="primary"
                            @click="copyToClipboard(novelResult.novel_id)"
                          >
                            {{ novelResult.novel_id }}
                            <el-icon><CopyDocument /></el-icon>
                          </el-button>
                        </p>
                        <p v-if="novelForm.name"><span class="label">小说名称：</span>{{ novelForm.name }}</p>
                      </div>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>

            <!-- 步骤 3: 切分章节 -->
            <div v-if="currentStep === 2" class="step-panel">
              <h2 class="step-title">切分章节</h2>
              <p class="step-description">将小说内容切分为多个章节</p>

              <el-form
                :model="splitForm"
                :rules="splitRules"
                ref="splitFormRef"
                label-position="top"
                class="split-form"
              >
                <el-form-item label="目标章节数" prop="target_chapters">
                  <el-input-number
                    v-model="splitForm.target_chapters"
                    :min="1"
                    :max="100"
                    :step="1"
                    size="large"
                    class="full-width"
                  />
                  <p class="form-tip">建议章节数：10-20 章</p>
                </el-form-item>
              </el-form>

              <!-- 切分进度 -->
              <div v-if="splitting" class="split-progress">
                <el-loading :loading="splitting" text="正在切分章节..." />
              </div>

              <!-- 切分成功信息 -->
              <div v-if="chaptersResult" class="chapters-result">
                <el-card class="result-card success">
                  <div class="result-content">
                    <el-icon class="result-icon"><Check /></el-icon>
                    <div class="result-details">
                      <p class="result-title">章节切分成功</p>
                      <p class="result-message">{{ chaptersResult.message }}</p>
                    </div>
                  </div>
                </el-card>

                <!-- 章节列表预览 -->
                <el-card class="chapters-preview" v-loading="loadingChapters">
                  <template #header>
                    <div class="chapters-header">
                      <span>章节列表预览（共 {{ chapters.length }} 章）</span>
                    </div>
                  </template>
                  <el-table :data="chapters" stripe style="width: 100%">
                    <el-table-column prop="sequence" label="序号" width="80" />
                    <el-table-column prop="title" label="章节标题" />
                    <el-table-column prop="word_count" label="字数" width="100" />
                    <el-table-column prop="line_count" label="行数" width="100" />
                  </el-table>
                </el-card>
              </div>
            </div>
          </div>

          <!-- 底部操作按钮 -->
          <div class="step-actions">
            <el-button
              v-if="currentStep > 0"
              size="large"
              @click="goToPreviousStep"
              :disabled="uploading || creating || splitting"
            >
              上一步
            </el-button>
            <el-button
              v-if="currentStep === 0"
              type="primary"
              size="large"
              @click="handleUpload"
              :loading="uploading"
              :disabled="!selectedFile || !!uploadResult"
            >
              {{ uploading ? '上传中...' : '开始上传' }}
            </el-button>
            <el-button
              v-if="currentStep === 1"
              type="primary"
              size="large"
              @click="handleCreateNovel"
              :loading="creating"
              :disabled="!uploadResult || !!novelResult"
            >
              {{ creating ? '创建中...' : '创建小说' }}
            </el-button>
            <el-button
              v-if="currentStep === 2"
              type="primary"
              size="large"
              @click="handleSplitChapters"
              :loading="splitting"
              :disabled="!novelResult || !!chaptersResult"
            >
              {{ splitting ? '切分中...' : '开始切分' }}
            </el-button>
            <el-button
              v-if="currentStep === 2 && chaptersResult"
              type="success"
              size="large"
              @click="handleComplete"
            >
              完成
            </el-button>
            <el-button size="large" @click="handleCancel">取消</el-button>
          </div>
        </el-card>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  UploadFilled,
  InfoFilled,
  Check,
  Document,
  Edit,
  Connection,
  CopyDocument
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { resourceApi, type UploadProgressEvent } from '@/api/resource'
import { novelApi } from '@/api/novel'
import type {
  UploadFileResponse,
  CreateNovelResponse,
  SplitChaptersResponse,
  Chapter,
  Novel
} from '@/types/novel'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 步骤控制
const currentStep = ref(0)

// 文件上传相关
const uploadRef = ref()
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadResult = ref<UploadFileResponse | null>(null)

// 创建小说相关
const novelFormRef = ref<FormInstance>()
const novelForm = reactive({
  name: '',
  workflow_id: ''
})
const novelRules: FormRules = {
  workflow_id: [{ required: true, message: '请输入工作流ID', trigger: 'blur' }]
}
const creating = ref(false)
const novelResult = ref<CreateNovelResponse | null>(null)

// 切分章节相关
const splitFormRef = ref<FormInstance>()
const splitForm = reactive({
  target_chapters: 10
})
const splitRules: FormRules = {
  target_chapters: [
    { required: true, message: '请输入目标章节数', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '章节数必须在 1-100 之间', trigger: 'blur' }
  ]
}
const splitting = ref(false)
const chaptersResult = ref<SplitChaptersResponse | null>(null)
const loadingChapters = ref(false)
const chapters = ref<Chapter[]>([])

// 从 sessionStorage 恢复状态
onMounted(() => {
  const savedState = sessionStorage.getItem('novel_upload_state')
  if (savedState) {
    try {
      const state = JSON.parse(savedState)
      if (state.uploadResult) {
        uploadResult.value = state.uploadResult
        currentStep.value = 1
      }
      if (state.novelResult) {
        novelResult.value = state.novelResult
        novelForm.workflow_id = state.workflow_id || ''
        novelForm.name = state.novel_name || ''
        currentStep.value = 2
      }
      if (state.chaptersResult) {
        chaptersResult.value = state.chaptersResult
        splitForm.target_chapters = state.target_chapters || 10
      }
    } catch (error) {
      console.error('恢复状态失败:', error)
    }
  }

  // 从路由参数获取 workflow_id
  if (route.query.workflow_id) {
    novelForm.workflow_id = route.query.workflow_id as string
  }

  // 如果没有文件名，使用上传的文件名
  if (uploadResult.value && !novelForm.name) {
    novelForm.name = uploadResult.value.file_name.replace(/\.[^/.]+$/, '')
  }
})

// 保存状态到 sessionStorage
const saveState = () => {
  const state = {
    uploadResult: uploadResult.value,
    novelResult: novelResult.value,
    workflow_id: novelForm.workflow_id,
    novel_name: novelForm.name,
    chaptersResult: chaptersResult.value,
    target_chapters: splitForm.target_chapters
  }
  sessionStorage.setItem('novel_upload_state', JSON.stringify(state))
}

// 文件选择
const handleFileChange = (file: any) => {
  // 验证文件类型
  const allowedTypes = ['.txt', '.doc', '.docx', '.pdf']
  const fileName = file.name.toLowerCase()
  const isValidType = allowedTypes.some(type => fileName.endsWith(type))

  if (!isValidType) {
    ElMessage.error('不支持的文件类型，请上传 TXT、DOC、DOCX 或 PDF 文件')
    uploadRef.value?.clearFiles()
    selectedFile.value = null
    return
  }

  // 验证文件大小（100MB）
  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 100MB')
    uploadRef.value?.clearFiles()
    selectedFile.value = null
    return
  }

  selectedFile.value = file.raw
  uploadResult.value = null
  uploadProgress.value = 0
}

// 文件移除
const handleFileRemove = () => {
  selectedFile.value = null
  uploadResult.value = null
  uploadProgress.value = 0
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 复制到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 上传文件
const handleUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  uploading.value = true
  uploadProgress.value = 0

  try {
    const result = await resourceApi.uploadFile(selectedFile.value, (event: UploadProgressEvent) => {
      uploadProgress.value = event.percent
    })

    uploadResult.value = result
    ElMessage.success('文件上传成功')
    saveState()

    // 自动进入下一步
    setTimeout(() => {
      currentStep.value = 1
    }, 1000)
  } catch (error: any) {
    ElMessage.error(error.message || '文件上传失败')
    console.error('上传失败:', error)
  } finally {
    uploading.value = false
  }
}

// 创建小说
const handleCreateNovel = async () => {
  if (!novelFormRef.value) return

  await novelFormRef.value.validate(async (valid) => {
    if (!valid) return

    if (!uploadResult.value) {
      ElMessage.warning('请先上传文件')
      return
    }

    if (!userStore.user?.id) {
      ElMessage.error('用户未登录')
      return
    }

    creating.value = true

    try {
      const result = await novelApi.createNovel({
        resource_id: uploadResult.value.resource_id,
        user_id: userStore.user.id,
        workflow_id: novelForm.workflow_id
      })

      novelResult.value = result
      ElMessage.success('小说创建成功')
      saveState()

      // 自动进入下一步
      setTimeout(() => {
        currentStep.value = 2
      }, 1000)
    } catch (error: any) {
      ElMessage.error(error.message || '创建小说失败')
      console.error('创建失败:', error)
    } finally {
      creating.value = false
    }
  })
}

// 切分章节
const handleSplitChapters = async () => {
  if (!splitFormRef.value) return

  await splitFormRef.value.validate(async (valid) => {
    if (!valid) return

    if (!novelResult.value) {
      ElMessage.warning('请先创建小说')
      return
    }

    splitting.value = true

    try {
      const result = await novelApi.splitChapters(
        novelResult.value.novel_id,
        splitForm.target_chapters
      )

      chaptersResult.value = result
      ElMessage.success('章节切分成功')
      saveState()

      // 获取章节列表
      loadingChapters.value = true
      try {
        const chaptersData = await novelApi.getChapters(novelResult.value.novel_id)
        chapters.value = chaptersData.chapters || []
      } catch (error) {
        console.error('获取章节列表失败:', error)
      } finally {
        loadingChapters.value = false
      }
    } catch (error: any) {
      ElMessage.error(error.message || '切分章节失败')
      console.error('切分失败:', error)
    } finally {
      splitting.value = false
    }
  })
}

// 完成
const handleComplete = async () => {
  if (!novelResult.value) return

  // 获取完整的小说信息并保存到本地存储（供列表页使用）
  try {
    const novelInfo = await novelApi.getNovel(novelResult.value.novel_id)
    
    // 保存到本地存储
    try {
      const saved = localStorage.getItem('novels_list')
      let novels: Novel[] = saved ? JSON.parse(saved) : []
      
      // 检查是否已存在
      const existingIndex = novels.findIndex((n: Novel) => n.id === novelInfo.novel.id)
      if (existingIndex >= 0) {
        novels[existingIndex] = novelInfo.novel
      } else {
        novels.push(novelInfo.novel)
      }
      
      localStorage.setItem('novels_list', JSON.stringify(novels))
      
      // 触发存储事件，通知列表页更新
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'novel_created',
        newValue: novelResult.value.novel_id
      }))
    } catch (error) {
      console.error('保存小说到本地存储失败:', error)
    }
  } catch (error) {
    console.error('获取小说信息失败:', error)
  }

  // 清除保存的状态
  sessionStorage.removeItem('novel_upload_state')

  // 跳转到小说详情页
  router.push(`/novel/${novelResult.value.novel_id}`)
}

// 取消
const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('确定要取消吗？未保存的进度将丢失', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 清除保存的状态
    sessionStorage.removeItem('novel_upload_state')

    // 返回上一页
    router.back()
  } catch {
    // 用户取消
  }
}

// 上一步
const goToPreviousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 返回
</script>

<style scoped>
.novel-upload {
  height: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  max-width: 1000px;
  margin: 0 auto;
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
}

/* 主要内容 */
.page-content {
  /* 内容区域样式已由布局组件处理 */
}

.upload-container {
  max-width: 1000px;
  margin: 0 auto;
}

.upload-card {
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  padding: var(--spacing-xl);
}

/* 步骤指示器 */
.steps-indicator {
  margin-bottom: var(--spacing-2xl);
}

/* 步骤内容 */
.step-content {
  min-height: 400px;
  padding: var(--spacing-xl) 0;
}

.step-panel {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.step-description {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
}

/* 文件上传 */
.file-upload {
  width: 100%;
  margin-bottom: var(--spacing-xl);
}

:deep(.el-upload) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  padding: var(--spacing-2xl);
  background: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-base);
}

:deep(.el-upload-dragger:hover) {
  border-color: var(--primary-color);
  background: rgba(99, 102, 241, 0.05);
}

.upload-icon {
  font-size: 4rem;
  color: var(--primary-color);
  margin-bottom: var(--spacing-lg);
}

.upload-text {
  text-align: center;
}

.upload-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.upload-tip {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.upload-tip-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-md);
  color: var(--text-tertiary);
  font-size: 0.85rem;
}

/* 文件预览 */
.file-preview {
  margin-bottom: var(--spacing-xl);
}

.file-info-card {
  background: var(--bg-secondary);
}

.file-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.file-icon {
  font-size: 2rem;
  color: var(--primary-color);
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.file-size {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* 上传进度 */
.upload-progress {
  margin-bottom: var(--spacing-xl);
}

.progress-text {
  text-align: center;
  margin-top: var(--spacing-sm);
  color: var(--text-secondary);
}

/* 结果卡片 */
.upload-result,
.novel-result,
.chapters-result {
  margin-bottom: var(--spacing-xl);
}

.result-card {
  background: var(--bg-secondary);
}

.result-card.success {
  border-left: 4px solid var(--success-color, #67c23a);
}

.result-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.result-icon {
  font-size: 2rem;
  color: var(--success-color, #67c23a);
  margin-top: var(--spacing-xs);
}

.result-details {
  flex: 1;
}

.result-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.result-message {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.result-info {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.result-info p {
  margin-bottom: var(--spacing-xs);
}

.result-info .label {
  font-weight: 600;
  color: var(--text-primary);
}

/* 表单 */
.novel-form,
.split-form {
  margin-bottom: var(--spacing-xl);
}

.full-width {
  width: 100%;
}

.form-tip {
  font-size: 0.85rem;
  color: var(--text-tertiary);
  margin-top: var(--spacing-xs);
}

/* 章节预览 */
.chapters-preview {
  margin-top: var(--spacing-xl);
}

.chapters-header {
  font-weight: 600;
  color: var(--text-primary);
}

/* 底部操作按钮 */
.step-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--border-color);
  margin-top: var(--spacing-xl);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .step-actions {
    flex-direction: column;
  }

  .step-actions .el-button {
    width: 100%;
  }
}
</style>

