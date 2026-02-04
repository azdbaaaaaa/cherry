import { MockMethod } from 'vite-plugin-mock'

// Mock 用户数据
const mockUsers = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    profile: {
      nickname: '管理员',
      avatar: '',
      phone: ''
    },
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    username: 'editor001',
    email: 'editor@example.com',
    role: 'editor',
    status: 'active',
    profile: {
      nickname: '编辑小王',
      avatar: '',
      phone: ''
    },
    created_at: '2024-01-01T00:00:00Z'
  }
]

// 模拟Token存储
let mockTokens: Record<string, { access_token: string; refresh_token: string; expires_at: number }> = {}

export default [
  // 注册接口
  {
    url: '/api/v1/auth/register',
    method: 'post',
    response: ({ body }: { body: any }) => {
      const { username, email, password, nickname } = body

      // 检查用户名是否已存在
      if (mockUsers.find(u => u.username === username)) {
        return {
          code: 40001,
          message: '用户名已存在',
          data: null
        }
      }

      // 检查邮箱是否已存在
      if (mockUsers.find(u => u.email === email)) {
        return {
          code: 40002,
          message: '邮箱已被注册',
          data: null
        }
      }

      // 创建新用户
      const newUser = {
        id: String(mockUsers.length + 1),
        username,
        email,
        role: 'editor',
        status: 'inactive', // 新注册用户需要审核
        profile: {
          nickname: nickname || username,
          avatar: '',
          phone: ''
        },
        created_at: new Date().toISOString()
      }

      mockUsers.push(newUser)

      // 响应格式与后端 model.RegisterResponse 一致
      return {
        code: 0,
        message: '注册成功，等待管理员审核',
        data: {
          user_id: newUser.id,
          username: newUser.username,
          status: newUser.status
        }
      }
    }
  },

  // 登录接口
  {
    url: '/api/v1/auth/login',
    method: 'post',
    response: ({ body }: { body: any }) => {
      const { username, password } = body

      // 模拟验证（实际应该验证密码）
      const user = mockUsers.find(u => u.username === username && u.status === 'active')
      
      if (!user) {
        return {
          code: 40101,
          message: '用户名或密码错误，或账户未激活',
          data: null
        }
      }

      // 生成Token（模拟）
      const accessToken = `mock_access_token_${user.id}_${Date.now()}`
      const refreshToken = `mock_refresh_token_${user.id}_${Date.now()}`
      const expiresIn = 3600 // 1小时

      mockTokens[user.id] = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: Date.now() + expiresIn * 1000
      }

      // 响应格式与后端 model.LoginResponse 一致
      return {
        code: 0,
        message: '登录成功',
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: expiresIn,
          token_type: 'Bearer',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            profile: user.profile,
            created_at: user.created_at
          }
        }
      }
    }
  },

  // 刷新Token接口
  {
    url: '/api/v1/auth/refresh',
    method: 'post',
    response: ({ body }: { body: any }) => {
      const { refresh_token } = body

      // 查找对应的用户
      const userId = Object.keys(mockTokens).find(
        id => mockTokens[id].refresh_token === refresh_token
      )

      if (!userId) {
        return {
          code: 40102,
          message: 'Refresh Token无效',
          data: null
        }
      }

      // 生成新的Access Token
      const newAccessToken = `mock_access_token_${userId}_${Date.now()}`
      const expiresIn = 3600

      mockTokens[userId].access_token = newAccessToken
      mockTokens[userId].expires_at = Date.now() + expiresIn * 1000

      // 响应格式与后端 model.RefreshTokenResponse 一致
      return {
        code: 0,
        message: '刷新成功',
        data: {
          access_token: newAccessToken,
          expires_in: expiresIn,
          token_type: 'Bearer'
        }
      }
    }
  },

  // 退出登录接口
  {
    url: '/api/v1/auth/logout',
    method: 'post',
    response: ({ headers }: { headers: any }) => {
      const authHeader = headers.authorization
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        // 清除Token（模拟）
        Object.keys(mockTokens).forEach(userId => {
          if (mockTokens[userId].access_token === token) {
            delete mockTokens[userId]
          }
        })
      }

      return {
        code: 0,
        message: '退出成功'
      }
    }
  },

  // 获取当前用户信息
  {
    url: '/api/v1/auth/me',
    method: 'get',
    response: ({ headers }: { headers: any }) => {
      const authHeader = headers.authorization
      
      if (!authHeader) {
        return {
          code: 40101,
          message: '未登录',
          data: null
        }
      }

      const token = authHeader.replace('Bearer ', '')
      const userId = Object.keys(mockTokens).find(
        id => mockTokens[id].access_token === token
      )

      if (!userId) {
        return {
          code: 40101,
          message: 'Token无效',
          data: null
        }
      }

      const user = mockUsers.find(u => u.id === userId)
      if (!user) {
        return {
          code: 40401,
          message: '用户不存在',
          data: null
        }
      }

      // 响应格式与后端 model.GetMeResponse 一致
      return {
        code: 0,
        message: 'success',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          profile: user.profile,
          last_login_at: new Date().toISOString(),
          created_at: user.created_at
        }
      }
    }
  }
] as MockMethod[]
