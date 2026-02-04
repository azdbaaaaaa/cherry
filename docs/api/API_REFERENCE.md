# API 接口参考

本文档基于后端 Lemon 项目的 Swagger 文档生成，确保前端 API 调用与后端接口定义一致。

## 认证接口

### 1. 用户注册

**接口**: `POST /api/v1/auth/register`

**请求体** (与 `model.RegisterRequest` 一致):
```typescript
{
  username: string  // 用户名（必填）
  email: string     // 邮箱（必填，需符合邮箱格式）
  password: string  // 密码（必填，至少6位）
  nickname?: string // 昵称（可选）
}
```

**响应** (与 `model.RegisterResponse` 一致):
```typescript
{
  code: number      // 0表示成功
  message: string   // 响应消息
  data: {
    user_id: string   // 用户ID
    username: string  // 用户名
    status: string    // 状态：inactive（新注册用户需要管理员审核）
  }
}
```

### 2. 用户登录

**接口**: `POST /api/v1/auth/login`

**请求体** (与 `model.LoginRequest` 一致):
```typescript
{
  username: string  // 用户名（必填）
  password: string  // 密码（必填）
}
```

**响应** (与 `model.LoginResponse` 一致):
```typescript
{
  code: number      // 0表示成功
  message: string   // 响应消息
  data: {
    access_token: string   // Access Token
    refresh_token: string // Refresh Token
    expires_in: number    // 过期时间（秒）
    token_type: string    // Token类型：Bearer
    user: {              // 用户信息（与 model.UserInfo 一致）
      id: string
      username: string
      email: string
      role: string       // admin/editor/reviewer
      status: string     // active/inactive/banned
      profile?: {        // 用户资料（可选）
        nickname?: string
        avatar?: string
        phone?: string
      }
      last_login_at?: string
      created_at?: string
    }
  }
}
```

### 3. 刷新Token

**接口**: `POST /api/v1/auth/refresh`

**请求体** (与 `model.RefreshTokenRequest` 一致):
```typescript
{
  refresh_token: string  // Refresh Token（必填）
}
```

**响应** (与 `model.RefreshTokenResponse` 一致):
```typescript
{
  code: number      // 0表示成功
  message: string   // 响应消息
  data: {
    access_token: string  // 新的 Access Token
    expires_in: number    // 过期时间（秒）
    token_type: string    // Token类型：Bearer
  }
}
```

### 4. 退出登录

**接口**: `POST /api/v1/auth/logout`

**请求头**:
```
Authorization: Bearer {access_token}
```

**响应**:
```typescript
{
  code: number      // 0表示成功
  message: string  // 响应消息
}
```

### 5. 获取当前用户信息

**接口**: `GET /api/v1/auth/me`

**请求头**:
```
Authorization: Bearer {access_token}
```

**响应** (与 `model.GetMeResponse` 一致):
```typescript
{
  code: number      // 0表示成功
  message: string   // 响应消息
  data: {           // 用户信息（与 model.UserInfo 一致）
    id: string
    username: string
    email: string
    role: string
    status: string
    profile?: {
      nickname?: string
      avatar?: string
      phone?: string
    }
    last_login_at?: string
    created_at?: string
  }
}
```

## 错误响应格式

所有接口的错误响应都遵循统一格式 (与 `model.ErrorResponse` 一致):

```typescript
{
  code: number      // 错误码（非0）
  message: string   // 错误消息
  detail?: string   // 错误详情（可选）
}
```

常见错误码：
- `40001`: 请求参数错误
- `40101`: 未登录或Token无效
- `40102`: Refresh Token无效
- `40301`: 权限不足
- `40401`: 资源不存在
- `50001`: 服务器内部错误

## 注意事项

1. **字段命名**: 后端使用 `snake_case`（如 `access_token`），前端 TypeScript 接口也使用 `snake_case` 以保持一致。

2. **响应结构**: 所有接口响应都包含 `code`、`message` 和 `data` 字段。前端响应拦截器会自动处理 `code !== 0` 的情况。

3. **Token 使用**: 
   - Access Token 用于所有需要认证的接口，放在请求头的 `Authorization: Bearer {token}` 中
   - Refresh Token 用于刷新 Access Token，放在请求体中

4. **状态码**: 
   - 注册接口返回 HTTP 201 (Created)
   - 其他成功接口返回 HTTP 200 (OK)
   - 错误情况返回对应的 HTTP 状态码（400, 401, 403, 404, 500等）

## 参考文档

- 后端 Swagger 文档: `lemon/docs/swagger/swagger.json`
- 后端模型定义: `lemon/internal/model/request.go` 和 `lemon/internal/model/response.go`
- 后端 Handler 实现: `lemon/internal/handler/auth.go`
