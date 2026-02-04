import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { viteMockServe } from 'vite-plugin-mock'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = mode === 'development'
  // 使用 loadEnv 正确加载环境变量（.env.development）
  const env = loadEnv(mode, process.cwd(), '')
  const useMock = env.VITE_USE_MOCK
  const enableMock = useMock === 'true' || (isDev && useMock !== 'false')

  return {
    plugins: [
      vue(),
      // Mock 插件，仅在开发环境且启用时使用
      viteMockServe({
        mockPath: 'src/mock',
        enable: command === 'serve' && enableMock, // 只在serve命令时启用
        watchFiles: true,
        logger: true,
        localEnabled: command === 'serve' && enableMock, // 本地开发启用
        supportTs: true
      })
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: 3000,
      proxy: enableMock ? {} : {
        // 只有在Mock禁用时才使用代理
        '/api': {
          target: 'http://localhost:7080',
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1000
    }
  }
})
