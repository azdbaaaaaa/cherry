import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
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
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/workflow',
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'WorkflowList',
        component: () => import('@/views/Workflow/List.vue')
      },
      {
        path: 'create',
        name: 'WorkflowCreate',
        component: () => import('@/views/Workflow/Create.vue')
      },
      {
        path: ':id',
        name: 'WorkflowDetail',
        component: () => import('@/views/Workflow/Detail.vue')
      }
    ]
  },
  {
    path: '/novel',
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'NovelList',
        component: () => import('@/views/Novel/List.vue')
      },
      {
        path: 'upload',
        name: 'NovelUpload',
        component: () => import('@/views/Novel/Upload.vue')
      },
      {
        path: ':id',
        name: 'NovelDetail',
        component: () => import('@/views/Novel/Detail.vue')
      },
      {
        path: 'chapters/:chapterId',
        name: 'ChapterDetail',
        component: () => import('@/views/Novel/ChapterDetail.vue')
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
  if ((to.name === 'Login' || to.name === 'Register') && userStore.isAuthenticated) {
    next({ name: 'Home' })
    return
  }

  next()
})

export default router
