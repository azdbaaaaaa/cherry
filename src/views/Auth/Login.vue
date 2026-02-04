<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card glass fade-in">
      <div class="card-header">
        <div class="logo-section">
          <div class="logo-icon">
            <el-icon :size="48"><VideoPlay /></el-icon>
          </div>
          <h1 class="logo-title">
            <span class="gradient-text">Cherry</span>
          </h1>
          <p class="logo-subtitle">AI视频生成工作流系统</p>
        </div>
      </div>

      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        @submit.prevent="handleLogin"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
            clearable
            class="form-input"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
            clearable
            class="form-input"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleLogin"
            class="login-button"
            size="large"
          >
            <span v-if="!loading">登录</span>
            <span v-else>登录中...</span>
          </el-button>
        </el-form-item>

        <div class="login-footer">
          <el-link
            type="primary"
            @click="goToRegister"
            class="register-link"
          >
            还没有账号？立即注册
          </el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, VideoPlay } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      await userStore.login({
        username: form.username,
        password: form.password
      })

      ElMessage.success('登录成功')

      // 跳转到原页面或首页
      const redirect = (route.query.redirect as string) || '/'
      router.push(redirect)
    } catch (error: any) {
      ElMessage.error(
        error.response?.data?.message || '登录失败，请检查用户名和密码'
      )
    } finally {
      loading.value = false
    }
  })
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: var(--spacing-lg);
  position: relative;
  overflow: hidden;
  background: var(--bg-gradient);
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;
  animation: float 15s infinite ease-in-out;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: -300px;
  left: -300px;
  animation-delay: 0s;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -250px;
  right: -250px;
  animation-delay: 5s;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(50px, -50px) scale(1.1);
  }
}

/* 登录卡片 */
.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  padding: var(--spacing-2xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-xl);
}

.card-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.logo-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-gradient);
  border-radius: 50%;
  color: white;
  margin-bottom: var(--spacing-sm);
  box-shadow: var(--shadow-lg);
}

.logo-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  line-height: 1.2;
}

.logo-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0;
}

/* 表单 */
.login-form {
  margin-top: var(--spacing-xl);
}

.form-input {
  width: 100%;
}

:deep(.el-input__wrapper) {
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
}

.login-button {
  width: 100%;
  padding: var(--spacing-md);
  font-size: 1rem;
  font-weight: 600;
  margin-top: var(--spacing-md);
  border-radius: var(--border-radius);
}

.login-footer {
  text-align: center;
  margin-top: var(--spacing-lg);
}

.register-link {
  font-size: 0.95rem;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    padding: var(--spacing-xl);
  }

  .logo-title {
    font-size: 2rem;
  }

  .logo-icon {
    width: 60px;
    height: 60px;
  }
}
</style>
