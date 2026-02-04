# Mock 数据说明

## 使用方式

### 启用Mock

在 `.env.development` 文件中设置：

```env
VITE_USE_MOCK=true
```

### 禁用Mock（使用真实后端）

在 `.env.development` 文件中设置：

```env
VITE_USE_MOCK=false
```

或者直接删除该配置项，默认会尝试连接真实后端。

## 故障排查

### 如果Mock不工作，请检查：

1. **环境变量是否正确**
   - 确认 `.env.development` 文件存在
   - 确认 `VITE_USE_MOCK=true` 已设置
   - **重要**：修改环境变量后必须重启开发服务器（`npm run dev`）

2. **依赖是否已安装**
   ```bash
   npm install -D vite-plugin-mock mockjs @types/mockjs
   ```

3. **浏览器控制台**
   - 打开浏览器开发者工具
   - 查看 Console 是否有 Mock 相关的日志
   - 查看 Network 标签，检查请求是否被拦截

4. **Vite 配置**
   - 确认 `vite.config.ts` 中 Mock 插件已正确配置
   - 确认 `mockPath: 'src/mock'` 路径正确

5. **Mock 文件格式**
   - 确认 `src/mock/index.ts` 正确导出了所有Mock配置
   - 确认Mock接口的URL和方法与API调用一致

## Mock 数据

### 认证相关 (auth.ts)

- **注册**: `POST /api/v1/auth/register`
  - 测试账号：任意用户名和密码
  - 新注册用户状态为 `inactive`（需要管理员审核）

- **登录**: `POST /api/v1/auth/login`
  - 测试账号：
    - 用户名: `admin`, 密码: 任意（角色: admin）
    - 用户名: `editor001`, 密码: 任意（角色: editor）

- **刷新Token**: `POST /api/v1/auth/refresh`
- **退出登录**: `POST /api/v1/auth/logout`
- **获取当前用户**: `GET /api/v1/auth/me`

### 工作流相关 (workflow.ts)

- **创建工作流**: `POST /api/v1/workflow`
- **获取工作流列表**: `GET /api/v1/workflow`
- **获取工作流详情**: `GET /api/v1/workflow/:id`
- **暂停工作流**: `POST /api/v1/workflow/:id/pause`
- **恢复工作流**: `POST /api/v1/workflow/:id/resume`
- **取消工作流**: `POST /api/v1/workflow/:id/cancel`
- **获取工作流进度**: `GET /api/v1/workflow/:id/progress`

## 注意事项

1. Mock 数据仅在开发环境生效，生产环境不会使用
2. Mock 数据存储在内存中，刷新页面会重置
3. 可以根据实际需求修改 `src/mock/` 目录下的文件来调整Mock数据
4. 建议Mock数据结构与后端API保持一致，便于后续切换

## 添加新的Mock接口

1. 在对应的mock文件中添加新的接口配置
2. 在 `src/mock/index.ts` 中导出（如果创建了新文件）
3. 重启开发服务器

## 调试技巧

### 检查Mock是否启用

启动 `npm run dev` 时，查看控制台输出，应该看到：
- Mock相关的日志信息
- 如果看到 "Mock server started" 或类似信息，说明Mock已启用

### 在浏览器中验证

1. 打开浏览器开发者工具 (F12)
2. 查看 Network 标签
3. 发送一个API请求（如登录）
4. 如果Mock工作正常：
   - 请求应该显示为成功（状态码200）
   - 响应数据应该是Mock数据
   - 请求URL应该是 `http://localhost:3000/api/v1/...`（不是7080端口）

### 如果请求还是发送到真实后端

1. **检查环境变量**：确认 `.env.development` 中 `VITE_USE_MOCK=true`
2. **重启开发服务器**：修改环境变量后必须重启
3. **检查代理配置**：如果Mock启用，代理应该被禁用（`proxy: {}`）
4. **检查Mock文件**：确认 `src/mock/index.ts` 正确导出
