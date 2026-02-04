# Mock 调试指南

## 常见问题排查

### 1. Mock 不工作，提示网络错误

**可能原因**：
- Mock插件未正确加载
- 环境变量未正确读取
- Mock文件路径不正确
- 请求URL不匹配

**排查步骤**：

1. **检查环境变量**
   ```bash
   # 确认 .env.development 文件存在且内容正确
   cat .env.development
   # 应该看到：VITE_USE_MOCK=true
   ```

2. **检查依赖是否安装**
   ```bash
   npm list vite-plugin-mock mockjs
   ```

3. **检查浏览器控制台**
   - 打开开发者工具 (F12)
   - 查看 Console 标签，应该看到 Mock 相关的日志
   - 查看 Network 标签，检查请求是否被拦截

4. **检查 Vite 启动日志**
   - 启动 `npm run dev` 时，应该看到 Mock 相关的日志输出
   - 如果看到 "Mock server started" 或类似信息，说明 Mock 已启用

5. **验证 Mock 文件格式**
   - 确认 `src/mock/index.ts` 正确导出了所有Mock配置
   - 确认Mock接口的URL和方法与API调用一致

### 2. 登录接口返回网络错误

**检查清单**：
- [ ] Mock文件 `src/mock/auth.ts` 中的登录接口URL是否正确：`/api/v1/auth/login`
- [ ] 请求方法是否为 `POST`
- [ ] Mock响应格式是否正确（包含 `code`, `message`, `data`）
- [ ] 浏览器Network标签中，请求是否显示为被Mock拦截

### 3. Mock 响应格式问题

Mock响应必须符合以下格式：
```typescript
{
  code: 0,        // 0表示成功，非0表示错误
  message: 'success',
  data: { ... }   // 实际数据
}
```

### 4. 重启开发服务器

修改Mock配置后，必须重启开发服务器：
```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

## 调试技巧

### 在Mock文件中添加日志

```typescript
response: ({ body }: { body: any }) => {
  console.log('Mock收到请求:', body)  // 添加这行来调试
  // ... 处理逻辑
}
```

### 检查请求是否被Mock拦截

在浏览器Network标签中：
- 如果请求显示为 `(from disk cache)` 或状态码为200但响应是Mock数据，说明Mock工作正常
- 如果请求显示为 `ERR_CONNECTION_REFUSED` 或 `ERR_NETWORK`，说明Mock未拦截，请求发送到了后端

### 临时禁用代理

如果Mock不工作，可以临时注释掉 `vite.config.ts` 中的代理配置，强制使用Mock：

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:7080',
    changeOrigin: true,
    // 临时注释掉bypass，强制使用Mock
    // bypass: enableMock ? (req) => null : undefined
  }
}
```
