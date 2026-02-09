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
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页', requiresAuth: true }
      },
      {
        path: 'novel',
        name: 'NovelList',
        component: () => import('@/views/Novel/NovelList.vue'),
        meta: { title: '剧本列表', requiresAuth: true }
      },
      {
        path: 'novel/create',
        name: 'NovelCreate',
        component: () => import('@/views/Novel/Create.vue'),
        meta: { title: '创建剧本', requiresAuth: true }
      },
      {
        path: 'novel/shots',
        name: 'NovelShotEditor',
        component: () => import('@/views/Novel/ShotEditor.vue'),
        meta: { title: '分镜头编辑', requiresAuth: true }
      },
      {
        path: 'novel/images',
        name: 'NovelImageReview',
        component: () => import('@/views/Novel/ImageReview.vue'),
        meta: { title: '图片 Review', requiresAuth: true }
      },
      {
        path: 'novel/audios',
        name: 'NovelAudioReview',
        component: () => import('@/views/Novel/AudioReview.vue'),
        meta: { title: '音频 Review', requiresAuth: true }
      },
      {
        path: 'novel/videos',
        name: 'NovelVideoReview',
        component: () => import('@/views/Novel/VideoReview.vue'),
        meta: { title: '视频 Review', requiresAuth: true }
      },
      {
        path: 'novel/chapters/:chapterId',
        name: 'ChapterDetail',
        component: () => import('@/views/Novel/ChapterDetail.vue'),
        meta: { title: '章节详情', requiresAuth: true }
      },
      {
        path: 'novel/:id/chapters',
        name: 'NovelChapterList',
        component: () => import('@/views/Novel/Detail.vue'),
        meta: { title: '剧本详情', requiresAuth: true }
      },
      {
        path: 'novel/:id',
        name: 'NovelDetail',
        component: () => import('@/views/Novel/NovelDetail.vue'),
        meta: { title: '剧本详情', requiresAuth: true }
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

  // 如果正在跳转到登录页，直接放行，避免循环
  if (to.name === 'Login' || to.name === 'Register') {
    // 如果已登录，访问登录页则跳转到首页
    if (userStore.isAuthenticated) {
      next({ name: 'Home' })
      return
    }
    next()
    return
  }

  // 初始化认证状态（仅在非登录页时）
  if (!userStore.isAuthenticated && userStore.refreshToken) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      // 获取用户信息失败，清除认证状态
      userStore.clearAuth()
      // 如果需要认证，跳转到登录页
      if (to.meta.requiresAuth) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
        return
      }
    }
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  next()
})

export default router
