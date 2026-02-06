<template>
  <div class="workflow-create">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">创建剧本</h1>
    </div>

    <!-- 主要内容 -->
    <div class="page-content">
      <div class="form-container">
        <el-card class="form-card">
          <template #header>
            <div class="card-header">
              <h2 class="card-title">剧本内容与配置</h2>
              <p class="card-subtitle">上传剧本文件并配置视频生成参数</p>
            </div>
          </template>

          <el-form
            :model="form"
            :rules="rules"
            ref="formRef"
            label-position="top"
            class="workflow-form"
          >
            <!-- 输入方式 -->
            <el-form-item label="输入方式" prop="input_type">
              <el-select
                v-model="form.input_type"
                placeholder="请选择输入方式"
                size="large"
                class="full-width"
              >
                <el-option
                  v-for="type in inputTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                >
                  <div class="option-item">
                    <el-icon><component :is="type.icon" /></el-icon>
                    <span>{{ type.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <!-- 文件上传 -->
            <el-form-item
              v-if="form.input_type === 'file'"
              label="上传剧本文件"
              prop="file"
            >
              <el-upload
                class="file-upload"
                drag
                :auto-upload="false"
                :on-change="handleFileChange"
                :on-remove="handleFileRemove"
                :limit="1"
                :accept="getAcceptTypes()"
              >
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">
                  <p class="upload-title">点击或拖拽剧本文件到此区域上传</p>
                  <p class="upload-tip">
                    支持 {{ getFileTypesText() }} 文件，最大 100MB
                  </p>
                </div>
                <template #tip>
                  <div class="upload-tip-text">
                    <el-icon><InfoFilled /></el-icon>
                    请上传符合要求的文件格式
                  </div>
                </template>
              </el-upload>
            </el-form-item>

            <!-- 文本输入 -->
            <el-form-item
              v-if="form.input_type === 'text'"
              label="输入剧本内容"
              prop="text_content"
            >
              <el-input
                v-model="form.text_content"
                type="textarea"
                :rows="12"
                placeholder="请输入剧本文本内容..."
                class="textarea-input"
                show-word-limit
                maxlength="10000"
              />
            </el-form-item>

            <!-- 剧本名称 -->
            <el-form-item label="剧本名称" prop="name">
              <el-input
                v-model="form.name"
                placeholder="从文件名自动提取，也可手动修改"
                size="large"
                clearable
              >
                <template #prefix>
                  <el-icon><Edit /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <!-- 旁白类型 -->
            <el-form-item label="旁白类型" prop="narration_type">
              <el-select
                v-model="form.narration_type"
                placeholder="请选择旁白类型"
                size="large"
                class="full-width"
              >
                <el-option
                  v-for="type in narrationTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                >
                  <div class="option-item">
                    <el-icon><component :is="type.icon" /></el-icon>
                    <span>{{ type.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <!-- 风格选择 -->
            <el-form-item label="风格" prop="style">
              <el-select
                v-model="form.style"
                placeholder="请选择视频风格"
                size="large"
                class="full-width"
              >
                <el-option
                  v-for="style in styles"
                  :key="style.value"
                  :label="style.label"
                  :value="style.value"
                >
                  <div class="option-item">
                    <el-icon><component :is="style.icon" /></el-icon>
                    <span>{{ style.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>



            <!-- 提交按钮 -->
            <el-form-item class="form-actions">
              <el-button
                type="primary"
                size="large"
                @click="submit"
                :loading="submitting"
                class="submit-button"
              >
                <el-icon v-if="!submitting"><Check /></el-icon>
                {{ submitting ? '创建中...' : '创建剧本' }}
              </el-button>
              <el-button
                size="large"
                @click="goBack"
                class="cancel-button"
              >
                取消
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  Edit,
  UploadFilled,
  InfoFilled,
  Check,
  Document,
  Picture,
  Files,
  Microphone,
  ChatLineRound,
  VideoCamera,
  UserFilled
} from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { workflowApi, type CreateWorkflowRequest } from '@/api/workflow'
import { resourceApi } from '@/api/resource'

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const selectedFile = ref<File | null>(null)
const activeCollapse = ref<string[]>([])

const inputTypes = [
  { value: 'text', label: '文本', icon: Document },
  { value: 'file', label: '文件', icon: Files }
]

const narrationTypes = [
  { value: 'narration', label: '旁白（解说）', icon: Microphone },
  { value: 'dialogue', label: '真人对话', icon: ChatLineRound }
]

const styles = [
  { value: 'anime', label: '漫剧（动画风格）', icon: VideoCamera },
  { value: 'live', label: '真人剧（真人风格）', icon: UserFilled },
  { value: 'mixed', label: '混合风格', icon: Picture }
]

const form = reactive({
  name: '',
  input_type: 'file' as 'text' | 'file', // 默认选择文件上传
  text_content: '',
  resource_id: '',
  narration_type: 'narration' as 'narration' | 'dialogue',
  style: 'anime' as 'anime' | 'live' | 'mixed' // 默认选择漫剧
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入工作流名称', trigger: 'blur' }],
  input_type: [{ required: true, message: '请选择输入类型', trigger: 'change' }],
  narration_type: [{ required: true, message: '请选择旁白类型', trigger: 'change' }],
  style: [{ required: true, message: '请选择风格', trigger: 'change' }],
  text_content: [
    {
      validator: (rule, value, callback) => {
        if (form.input_type === 'text' && !value) {
          callback(new Error('请输入输入内容'))
        } else if (form.input_type === 'file' && !selectedFile.value) {
          callback(new Error('请上传文件'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const getAcceptTypes = () => {
  return '.txt,.doc,.docx,.pdf'
}

const getFileTypesText = () => {
  return 'TXT、DOC、DOCX、PDF'
}

// 从文件名提取剧本名称（去除扩展名）
const extractNovelName = (fileName: string): string => {
  // 去除扩展名
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')
  // 去除常见的括号内容，如 "大道主(飘荡的云)" -> "大道主"
  const nameWithoutBrackets = nameWithoutExt.replace(/\([^)]*\)/g, '').trim()
  return nameWithoutBrackets || nameWithoutExt
}

const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
  // 如果名称为空，从文件名提取剧本名称
  if (!form.name && file.name) {
    form.name = extractNovelName(file.name)
  }
  if (formRef.value) {
    formRef.value.validateField('text_content')
  }
}

const handleFileRemove = () => {
  selectedFile.value = null
  form.resource_id = ''
  if (formRef.value) {
    formRef.value.validateField('text_content')
  }
}

const submit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      let resourceId = form.resource_id

      // 如果是 file 模式，需要先上传文件
      if (form.input_type === 'file') {
        if (!selectedFile.value) {
          ElMessage.warning('请先上传文件')
          submitting.value = false
          return
        }

        // 上传文件获取 resource_id
        const uploadResult = await resourceApi.uploadFile(selectedFile.value)
        if (!uploadResult?.resource_id) {
          ElMessage.error('文件上传失败：未获取到资源ID')
          submitting.value = false
          return
        }
        resourceId = uploadResult.resource_id
      }

      // 构建请求数据
      const data: CreateWorkflowRequest = {
        name: form.name,
        input_type: form.input_type,
        narration_type: form.narration_type,
        style: form.style
      }

      if (form.input_type === 'text') {
        data.text_content = form.text_content
      } else if (form.input_type === 'file') {
        data.resource_id = resourceId
      }

      const res = await workflowApi.create(data)
      ElMessage.success('工作流创建成功')
      router.push(`/workflow/${res.data.workflow_id}`)
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || error.message || '创建工作流失败')
      console.error(error)
    } finally {
      submitting.value = false
    }
  })
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.workflow-create {
  width: 100%;
  min-height: 100vh;
  background: var(--bg-secondary);
  /* 创作平台风格：简洁、专业 */
}

/* 顶部导航栏 - 创作平台风格 */
.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-xl);
  background: var(--bg-primary);
  /* 使用纯色背景，更专业 */
}

.header-content {
  max-width: 900px;
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

.form-container {
  max-width: 900px;
  margin: 0 auto;
}

.form-card {
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  /* 移除 glass 效果，使用更专业的纯色背景 */
}

.card-header {
  text-align: center;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  /* 更专业的字体间距 */
}

.card-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 400;
  /* 更清晰的层级 */
}

/* 表单 - 创作平台风格 */
.workflow-form {
  padding: var(--spacing-xl) 0;
}

/* 输入框样式优化 */
:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-primary);
}

:deep(.el-select .el-input__wrapper) {
  cursor: pointer;
}

/* 移除所有 hover 时的 transform 效果 */
:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  /* 只改变边框颜色，不改变位置 */
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  font-size: 0.95rem;
  /* 更清晰的标签样式 */
}

.full-width {
  width: 100%;
}

.textarea-input {
  font-family: var(--font-mono);
  font-size: 0.95rem;
}

/* 文件上传 */
.file-upload {
  width: 100%;
}

:deep(.el-upload) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  padding: var(--spacing-2xl);
  background: var(--bg-primary);
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius-lg);
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
  /* 移除 transform，保持稳定 */
}

:deep(.el-upload-dragger:hover) {
  border-color: var(--primary-color);
  background: rgba(99, 102, 241, 0.03);
  /* 只改变颜色，不改变位置 */
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

/* 选项样式 */
.option-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* 高级选项 */
.advanced-options {
  margin: var(--spacing-xl) 0;
}

:deep(.el-collapse-item__header) {
  font-weight: 600;
  color: var(--text-primary);
}

/* 表单操作 */
.form-actions {
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.submit-button {
  min-width: 200px;
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1rem;
  height: auto;
  font-weight: 600;
  /* 更明确的按钮样式 */
}

.cancel-button {
  min-width: 200px;
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1rem;
  height: auto;
  font-weight: 500;
  /* 次要按钮样式 */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }

  .submit-button,
  .cancel-button {
    width: 100%;
  }
}
</style>
