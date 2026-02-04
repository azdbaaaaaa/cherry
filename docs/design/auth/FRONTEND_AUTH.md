# 前端认证与权限系统设计文档

## 1. 认证流程

### 1.1 登录流程

```
用户输入用户名密码
    ↓
调用登录API
    ↓
获取Access Token和Refresh Token
    ↓
存储Token（Access Token在内存，Refresh Token在localStorage）
    ↓
跳转到首页
```

### 1.2 Token刷新流程

```
API请求返回401
    ↓
使用Refresh Token刷新Access Token
    ↓
更新Access Token
    ↓
重试原请求
```

### 1.3 退出流程

```
调用退出API
    ↓
清除本地Token
    ↓
清除用户状态
    ↓
跳转到登录页
```

## 2. 状态管理

### 2.1 用户状态Store

```typescript
// src/stores/user.ts
import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import type { User, LoginRequest, LoginResponse } from '@/types/auth'

interface UserState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false
  }),
  
  getters: {
    isAdmin: (state) => state.user?.role === 'admin',
    isEditor: (state) => state.user?.role === 'editor',
    isReviewer: (state) => state.user?.role === 'reviewer',
    hasRole: (state) => (role: string) => state.user?.role === role,
    hasPermission: (state) => (permission: string) => {
      // 根据角色判断权限
      const role = state.user?.role
      if (role === 'admin') return true
      // 其他权限检查逻辑
      return false
    }
  },
  
  actions: {
    async login(data: LoginRequest) {
      try {
        const res = await authApi.login(data)
        this.accessToken = res.data.access_token
        this.refreshToken = res.data.refresh_token
        this.user = res.data.user
        this.isAuthenticated = true
        
        // 保存Refresh Token到localStorage
        localStorage.setItem('refresh_token', res.data.refresh_token)
        
        return res.data
      } catch (error) {
        throw error
      }
    },
    
    async logout() {
      try {
        if (this.accessToken) {
          await authApi.logout()
        }
      } catch (error) {
        console.error('退出失败', error)
      } finally {
        this.clearAuth()
      }
    },
    
    async refreshAccessToken() {
      if (!this.refreshToken) {
        const stored = localStorage.getItem('refresh_token')
        if (!stored) {
          throw new Error('No refresh token')
        }
        this.refreshToken = stored
      }
      
      try {
        const res = await authApi.refresh({ refresh_token: this.refreshToken })
        this.accessToken = res.data.access_token
        return res.data.access_token
      } catch (error) {
        this.clearAuth()
        throw error
      }
    },
    
    async fetchUserInfo() {
      try {
        const res = await authApi.getMe()
        this.user = res.data
        return res.data
      } catch (error) {
        this.clearAuth()
        throw error
      }
    },
    
    clearAuth() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.isAuthenticated = false
      localStorage.removeItem('refresh_token')
    },
    
    initAuth() {
      // 从localStorage恢复Refresh Token
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        this.refreshToken = refreshToken
        // 尝试获取用户信息
        this.fetchUserInfo().catch(() => {
          this.clearAuth()
        })
      }
    }
  }
})
```

## 3. API集成

### 3.1 认证API

```typescript
// src/api/auth.ts
import request from './client'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: User
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  nickname?: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface RefreshTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

export const authApi = {
  // 注册
  register(data: RegisterRequest) {
    return request.post('/api/v1/auth/register', data)
  },
  
  // 登录
  login(data: LoginRequest) {
    return request.post<LoginResponse>('/api/v1/auth/login', data)
  },
  
  // 刷新Token
  refresh(data: RefreshTokenRequest) {
    return request.post<RefreshTokenResponse>('/api/v1/auth/refresh', data)
  },
  
  // 退出
  logout() {
    return request.post('/api/v1/auth/logout')
  },
  
  // 获取当前用户信息
  getMe() {
    return request.get<User>('/api/v1/auth/me')
  }
}
```

### 3.2 请求拦截器更新

```typescript
// src/api/client.ts
import { useUserStore } from '@/stores/user'

// 请求拦截器 - 添加Token
request.interceptors.request.use(
  async (config) => {
    const userStore = useUserStore()
    
    // 如果有Access Token，添加到Header
    if (userStore.accessToken) {
      config.headers.Authorization = `Bearer ${userStore.accessToken}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理401和Token刷新
request.interceptors.response.use(
  (response) => {
    // ... 原有逻辑
  },
  async (error) => {
    const originalRequest = error.config
    
    // 如果是401错误且未重试过
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const userStore = useUserStore()
      
      try {
        // 刷新Token
        const newToken = await userStore.refreshAccessToken()
        
        // 更新请求Header
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        
        // 重试原请求
        return request(originalRequest)
      } catch (refreshError) {
        // 刷新失败，跳转到登录页
        userStore.clearAuth()
        router.push('/login')
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)
```

## 4. 路由守卫

### 4.1 路由配置

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Auth/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Auth/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue')
      },
      {
        path: '/workflow',
        children: [
          {
            path: '',
            name: 'WorkflowList',
            component: () => import('@/views/Workflow/List.vue'),
            meta: { permission: 'workflow:view' }
          },
          {
            path: 'create',
            name: 'WorkflowCreate',
            component: () => import('@/views/Workflow/Create.vue'),
            meta: { permission: 'workflow:create' }
          }
        ]
      },
      {
        path: '/users',
        meta: { requiresRole: ['admin'] },
        children: [
          {
            path: '',
            name: 'UserList',
            component: () => import('@/views/User/List.vue')
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 初始化认证状态
  if (!userStore.isAuthenticated && userStore.refreshToken) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      // 获取用户信息失败，清除认证状态
      userStore.clearAuth()
    }
  }
  
  // 检查是否需要认证
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  // 如果已登录，访问登录页则跳转到首页
  if (to.name === 'Login' && userStore.isAuthenticated) {
    next({ name: 'Home' })
    return
  }
  
  // 检查角色权限
  if (to.meta.requiresRole) {
    const roles = to.meta.requiresRole as string[]
    if (!roles.includes(userStore.user?.role || '')) {
      next({ name: 'Forbidden' })
      return
    }
  }
  
  // 检查功能权限
  if (to.meta.permission) {
    const permission = to.meta.permission as string
    if (!userStore.hasPermission(permission)) {
      next({ name: 'Forbidden' })
      return
    }
  }
  
  next()
})

export default router
```

## 5. 页面组件

### 5.1 登录页面

```vue
<!-- src/views/Auth/Login.vue -->
<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>登录</h2>
      </template>
      
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleLogin"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
        
        <el-form-item>
          <div class="login-footer">
            <el-link type="primary" @click="goToRegister">还没有账号？立即注册</el-link>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
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
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
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
      const redirect = route.query.redirect as string || '/'
      router.push(redirect)
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '登录失败')
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
}

.login-footer {
  width: 100%;
  text-align: center;
}
</style>
```

### 5.2 注册页面

```vue
<!-- src/views/Auth/Register.vue -->
<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <h2>注册</h2>
      </template>
      
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="请输入邮箱"
            prefix-icon="Message"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="form.nickname"
            placeholder="请输入昵称（可选）"
            prefix-icon="UserFilled"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleRegister"
            style="width: 100%"
          >
            注册
          </el-button>
        </el-form-item>
        
        <el-form-item>
          <div class="register-footer">
            <el-link type="primary" @click="goToLogin">已有账号？立即登录</el-link>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { authApi } from '@/api/auth'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  nickname: ''
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      await authApi.register({
        username: form.username,
        email: form.email,
        password: form.password,
        nickname: form.nickname
      })
      
      ElMessage.success('注册成功，等待管理员审核')
      router.push('/login')
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '注册失败')
    } finally {
      loading.value = false
    }
  })
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-card {
  width: 500px;
}

.register-footer {
  width: 100%;
  text-align: center;
}
</style>
```

## 6. 权限控制组件

### 6.1 权限指令

```typescript
// src/directives/permission.ts
import { App } from 'vue'
import { useUserStore } from '@/stores/user'

export default {
  install(app: App) {
    // v-permission指令
    app.directive('permission', {
      mounted(el, binding) {
        const userStore = useUserStore()
        const permission = binding.value
        
        if (!userStore.hasPermission(permission)) {
          el.style.display = 'none'
        }
      },
      updated(el, binding) {
        const userStore = useUserStore()
        const permission = binding.value
        
        if (!userStore.hasPermission(permission)) {
          el.style.display = 'none'
        } else {
          el.style.display = ''
        }
      }
    })
    
    // v-role指令
    app.directive('role', {
      mounted(el, binding) {
        const userStore = useUserStore()
        const roles = Array.isArray(binding.value) ? binding.value : [binding.value]
        
        if (!roles.includes(userStore.user?.role || '')) {
          el.style.display = 'none'
        }
      }
    })
  }
}
```

### 6.2 使用示例

```vue
<template>
  <!-- 基于权限显示 -->
  <el-button v-permission="'workflow:create'">创建工作流</el-button>
  
  <!-- 基于角色显示 -->
  <el-button v-role="['admin']">用户管理</el-button>
  
  <!-- 使用组件 -->
  <Permission :permission="'workflow:delete'">
    <el-button>删除</el-button>
  </Permission>
</template>
```

## 7. 类型定义

```typescript
// src/types/auth.ts
export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'editor' | 'reviewer'
  status: 'active' | 'inactive' | 'banned'
  profile?: {
    nickname?: string
    avatar?: string
    phone?: string
  }
  last_login_at?: string
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: User
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  nickname?: string
}
```

## 8. 布局组件

### 8.1 主布局（带导航）

```vue
<!-- src/layouts/MainLayout.vue -->
<template>
  <el-container class="main-layout">
    <el-header class="header">
      <div class="header-content">
        <h1>Cherry</h1>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :src="userStore.user?.profile?.avatar" />
              <span>{{ userStore.user?.profile?.nickname || userStore.user?.username }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>
    
    <el-container>
      <el-aside width="200px" class="sidebar">
        <el-menu router>
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/workflow">
            <el-icon><Document /></el-icon>
            <span>工作流</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.isAdmin" index="/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}
</script>
```

## 9. 初始化

```typescript
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 初始化用户状态
const userStore = useUserStore()
userStore.initAuth()

app.mount('#app')
```
