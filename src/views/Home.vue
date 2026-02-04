<template>
  <div class="home">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <!-- 主要内容 -->
    <div class="home-content">
      <!-- Hero Section -->
      <section class="hero-section fade-in">
        <div class="hero-content">
          <h1 class="hero-title">
            <span class="gradient-text">Cherry</span>
            <br />
            AI视频生成工作流
          </h1>
          <p class="hero-subtitle">
            从创意到视频，一键生成。基于AI的智能工作流系统，让视频创作变得简单高效。
          </p>
          <div class="hero-actions">
            <el-button
              type="primary"
              size="large"
              @click="goToWorkflowList"
              class="hero-button"
            >
              <el-icon><VideoPlay /></el-icon>
              开始创作
            </el-button>
            <el-button
              size="large"
              @click="goToWorkflowList"
              class="hero-button-secondary"
            >
              <el-icon><Document /></el-icon>
              查看工作流
            </el-button>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section">
        <div class="container">
          <h2 class="section-title">核心功能</h2>
          <div class="features-grid">
            <div
              v-for="(feature, index) in features"
              :key="index"
              class="feature-card glass slide-in"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div class="feature-icon">
                <el-icon :size="40">
                  <component :is="feature.icon" />
                </el-icon>
              </div>
              <h3 class="feature-title">{{ feature.title }}</h3>
              <p class="feature-description">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="stats-section">
        <div class="container">
          <div class="stats-grid">
            <div
              v-for="(stat, index) in stats"
              :key="index"
              class="stat-item glass"
            >
              <div class="stat-value gradient-text">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  VideoPlay,
  Document,
  MagicStick,
  Picture,
  Film,
  Setting
} from '@element-plus/icons-vue'

const router = useRouter()

const features = [
  {
    icon: MagicStick,
    title: '智能剧本生成',
    description: '基于AI技术，自动将小说、文档转换为专业剧本和分镜脚本'
  },
  {
    icon: Picture,
    title: '资产设计',
    description: '自动提取角色、道具、场景，生成高质量设计图和提示词'
  },
  {
    icon: Film,
    title: '视频生成',
    description: '支持多种AI视频生成服务，一键生成专业级视频内容'
  },
  {
    icon: Setting,
    title: '工作流管理',
    description: '可视化工作流管理，实时查看进度，支持暂停、恢复、重试'
  }
]

const stats = [
  { value: '100+', label: '工作流模板' },
  { value: '10+', label: 'AI服务集成' },
  { value: '99.9%', label: '系统可用性' },
  { value: '24/7', label: '技术支持' }
]

const goToWorkflowList = () => {
  router.push('/workflow')
}
</script>

<style scoped>
.home {
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* 背景装饰 */
.background-decoration {
  position: fixed;
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
  filter: blur(80px);
  opacity: 0.3;
  animation: float 20s infinite ease-in-out;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: -200px;
  left: -200px;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -150px;
  right: -150px;
  animation-delay: 5s;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  top: 50%;
  right: 10%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.home-content {
  position: relative;
  z-index: 1;
}

/* Hero Section */
.hero-section {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl) var(--spacing-lg);
  text-align: center;
}

.hero-content {
  max-width: 800px;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-2xl);
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}

.hero-button {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1.1rem;
  height: auto;
}

.hero-button-secondary {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1.1rem;
  height: auto;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
}

/* Features Section */
.features-section {
  padding: var(--spacing-3xl) var(--spacing-lg);
  background: var(--bg-secondary);
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  color: var(--text-primary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-xl);
  margin-top: var(--spacing-2xl);
}

.feature-card {
  padding: var(--spacing-xl);
  text-align: center;
  transition: all var(--transition-base);
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-8px) scale(1.02);
}

.feature-icon {
  margin-bottom: var(--spacing-lg);
  color: var(--primary-color);
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.feature-description {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Stats Section */
.stats-section {
  padding: var(--spacing-3xl) var(--spacing-lg);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-xl);
}

.stat-item {
  padding: var(--spacing-xl);
  text-align: center;
  border-radius: var(--border-radius-lg);
}

.stat-value {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: var(--spacing-sm);
}

.stat-label {
  font-size: 1.1rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
