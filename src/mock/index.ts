import { MockMethod } from 'vite-plugin-mock'
import authMock from './auth'
import workflowMock from './workflow'

// 导出所有mock配置
export default [
  ...authMock,
  ...workflowMock
] as MockMethod[]

// 生产环境Mock设置函数（如果需要）
export function setupProdMockServer() {
  // 生产环境通常不使用Mock
  console.log('Mock server setup (production mode)')
}
