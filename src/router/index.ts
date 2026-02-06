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
        path: 'workflow',
        name: 'WorkflowList',
        component: () => import('@/views/Workflow/List.vue'),
        meta: { title: '工作流管理', requiresAuth: true }
      },
      {
        path: 'workflow/create',
        name: 'WorkflowCreate',
        component: () => import('@/views/Workflow/Create.vue'),
        meta: { title: '创建工作流', requiresAuth: true }
      },
      {
        path: 'workflow/:id',
        name: 'WorkflowDetail',
        component: () => import('@/views/Workflow/Detail.vue'),
        meta: { title: '工作流详情', requiresAuth: true }
      },
      {
        path: 'workflow/shots',
        name: 'WorkflowShotEditor',
        component: () => import('@/views/Workflow/ShotEditor.vue'),
        meta: { title: '分镜头编辑', requiresAuth: true }
      },
      {
        path: 'workflow/images',
        name: 'WorkflowImageReview',
        component: () => import('@/views/Workflow/ImageReview.vue'),
        meta: { title: '图片 Review', requiresAuth: true }
      },
      {
        path: 'workflow/audios',
        name: 'WorkflowAudioReview',
        component: () => import('@/views/Workflow/AudioReview.vue'),
        meta: { title: '音频 Review', requiresAuth: true }
      },
      {
        path: 'workflow/videos',
        name: 'WorkflowVideoReview',
        component: () => import('@/views/Workflow/VideoReview.vue'),
        meta: { title: '视频 Review', requiresAuth: true }
      },
      {
        path: 'novel',
        name: 'NovelList',
        component: () => import('@/views/Novel/List.vue'),
        meta: { title: '小说管理', requiresAuth: true }
      },
      {
        path: 'novel/upload',
        name: 'NovelUpload',
        component: () => import('@/views/Novel/Upload.vue'),
        meta: { title: '上传小说', requiresAuth: true }
      },
      {
        path: 'novel/:id',
        name: 'NovelDetail',
        component: () => import('@/views/Novel/Detail.vue'),
        meta: { title: '小说详情', requiresAuth: true }
      },
      {
        path: 'novel/chapters/:chapterId',
        name: 'ChapterDetail',
        component: () => import('@/views/Novel/ChapterDetail.vue'),
        meta: { title: '章节详情', requiresAuth: true }
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
