<template>
  <div class="workflow-create">
    <!-- 顶部导航栏 -->
    <header class="page-header glass">
      <div class="header-content">
        <div class="header-left">
          <el-button
            text
            @click="goBack"
            class="back-button"
          >
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <h1 class="page-title">创建工作流</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="page-main">
      <div class="form-container">
        <el-card class="form-card glass">
          <template #header>
            <div class="card-header">
              <h2 class="card-title">工作流配置</h2>
              <p class="card-subtitle">填写以下信息以创建新的AI视频生成工作流</p>
            </div>
          </template>

          <el-form
            :model="form"
            :rules="rules"
            ref="formRef"
            label-position="top"
            class="workflow-form"
          >
            <!-- 工作流名称 -->
            <el-form-item label="工作流名称" prop="name">
              <el-input
                v-model="form.name"
                placeholder="例如：我的第一个视频项目"
                size="large"
                clearable
              >
                <template #prefix>
                  <el-icon><Edit /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <!-- 输入类型 -->
            <el-form-item label="输入类型" prop="input_type">
              <el-select
                v-model="form.input_type"
                placeholder="请选择输入类型"
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

            <!-- 文本输入 -->
            <el-form-item
              v-if="form.input_type === 'text'"
              label="输入内容"
              prop="input_content"
            >
              <el-input
                v-model="form.input_content"
                type="textarea"
                :rows="12"
                placeholder="请输入文本内容..."
                class="textarea-input"
                show-word-limit
                maxlength="10000"
              />
            </el-form-item>

            <!-- 文件上传 -->
            <el-form-item
              v-if="form.input_type !== 'text'"
              label="上传文件"
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
                  <p class="upload-title">点击或拖拽文件到此区域上传</p>
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

            <!-- 高级选项 -->
            <el-collapse v-model="activeCollapse" class="advanced-options">
              <el-collapse-item name="advanced" title="高级选项">
                <el-form-item label="AI服务提供商">
                  <el-select
                    v-model="form.options.ai_provider"
                    placeholder="选择AI服务"
                    size="large"
                    class="full-width"
                  >
                    <el-option label="Gemini" value="gemini" />
                    <el-option label="OpenAI" value="openai" />
                    <el-option label="豆包" value="doubao" />
                  </el-select>
                </el-form-item>
              </el-collapse-item>
            </el-collapse>

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
                {{ submitting ? '创建中...' : '创建工作流' }}
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
  Files
} from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { workflowApi } from '@/api/workflow'

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const selectedFile = ref<File | null>(null)
const activeCollapse = ref<string[]>([])

const inputTypes = [
  { value: 'text', label: '文本', icon: Document },
  { value: 'novel', label: '小说', icon: Files },
  { value: 'document', label: '文档', icon: Document },
  { value: 'image', label: '图片', icon: Picture }
]

const form = reactive({
  name: '',
  input_type: 'text' as 'novel' | 'document' | 'image' | 'text',
  input_content: '',
  options: {
    ai_provider: 'gemini'
  }
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入工作流名称', trigger: 'blur' }],
  input_type: [{ required: true, message: '请选择输入类型', trigger: 'change' }],
  input_content: [
    {
      validator: (rule, value, callback) => {
        if (form.input_type === 'text' && !value) {
          callback(new Error('请输入输入内容'))
        } else if (form.input_type !== 'text' && !selectedFile.value) {
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
  const map: Record<string, string> = {
    novel: '.txt,.doc,.docx,.pdf',
    document: '.doc,.docx,.pdf',
    image: '.jpg,.jpeg,.png,.gif,.webp'
  }
  return map[form.input_type] || '*'
}

const getFileTypesText = () => {
  const map: Record<string, string> = {
    novel: 'TXT、DOC、DOCX、PDF',
    document: 'DOC、DOCX、PDF',
    image: 'JPG、PNG、GIF、WEBP'
  }
  return map[form.input_type] || '所有'
}

const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
  if (formRef.value) {
    formRef.value.validateField('input_content')
  }
}

const handleFileRemove = () => {
  selectedFile.value = null
  if (formRef.value) {
    formRef.value.validateField('input_content')
  }
}

const submit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const data: any = {
        name: form.name,
        input_type: form.input_type,
        options: form.options
      }

      if (form.input_type === 'text') {
        data.input_content = form.input_content
      } else if (selectedFile.value) {
        // TODO: 上传文件
        ElMessage.info('文件上传功能开发中...')
        return
      }

      const res = await workflowApi.create(data)
      ElMessage.success('工作流创建成功')
      router.push(`/workflow/${res.data.workflow_id}`)
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '创建工作流失败')
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
.page-main {
  padding: var(--spacing-xl) 0;
}

.form-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.form-card {
  border-radius: var(--border-radius-xl);
  overflow: hidden;
}

.card-header {
  text-align: center;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.card-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

/* 表单 */
.workflow-form {
  padding: var(--spacing-xl) 0;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
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
}

.cancel-button {
  min-width: 200px;
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1rem;
  height: auto;
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
