# Chrome DevTools MCP 调试问题解决方案

## 问题描述

运行 `npx chrome-devtools-mcp` 时出现错误：

```
SyntaxError: Named export 'AgentFocus' not found. The requested module '../../node_modules/chrome-devtools-frontend/front_end/models/ai_assistance/performance/AIContext.js' is a CommonJS module, which may not support all module.exports as named exports.
```

## 问题原因

这是 `chrome-devtools-mcp` 包的一个已知问题，可能是：
1. 包的版本问题
2. 依赖模块的兼容性问题
3. Node.js 版本兼容性问题

## 解决方案

### 方案1: 使用全局安装（推荐）

```bash
# 全局安装
npm install -g chrome-devtools-mcp

# 然后直接运行
chrome-devtools-mcp
```

### 方案2: 使用本地安装

```bash
# 在项目目录下安装
cd /Users/jimmy/go/src/cherry
npm install chrome-devtools-mcp --save-dev

# 使用 npx 运行（从本地 node_modules）
npx chrome-devtools-mcp
```

### 方案3: 清除 npx 缓存

```bash
# 清除 npx 缓存
rm -rf ~/.npm/_npx

# 重新运行
npx chrome-devtools-mcp
```

### 方案4: 使用特定版本

```bash
# 尝试安装特定版本
npx chrome-devtools-mcp@latest

# 或者查看可用版本
npm view chrome-devtools-mcp versions
```

### 方案5: 使用替代方案

如果 `chrome-devtools-mcp` 无法正常工作，可以考虑：

1. **直接使用 Chrome DevTools**
   - 在浏览器中按 F12 打开开发者工具
   - 使用 Performance、Network、Console 等面板

2. **使用 Vue DevTools**
   ```bash
   # 安装 Vue DevTools 浏览器扩展
   # Chrome: https://chrome.google.com/webstore/detail/vuejs-devtools
   ```

3. **使用 VS Code 调试**
   - 配置 launch.json 进行前端调试
   - 配置 Go 调试器进行后端调试

## 针对当前项目的调试建议

### 前端调试（Cherry项目）

1. **使用 Vue DevTools**
   ```bash
   # 在 Chrome 中安装 Vue DevTools 扩展
   # 然后启动开发服务器
   cd /Users/jimmy/go/src/cherry
   npm run dev
   ```

2. **使用 Chrome DevTools**
   - 打开 `http://localhost:3000`
   - 按 F12 打开开发者工具
   - 检查 Network 标签查看 API 请求
   - 检查 Application 标签查看 localStorage

3. **调试登录功能**
   - 打开 Network 标签，查看登录请求
   - 检查响应中的 token
   - 查看 Application → Local Storage 中的 refresh_token

### 后端调试（Lemon项目）

1. **使用 Delve 调试器**
   ```bash
   # 安装 Delve
   go install github.com/go-delve/delve/cmd/dlv@latest
   
   # 使用 Delve 调试
   dlv debug ./main.go
   ```

2. **使用日志调试**
   - 查看控制台输出
   - 检查日志文件

3. **使用 Postman/Insomnia**
   - 测试 API 接口
   - 验证 JWT Token

## 快速测试登录功能

如果只是想测试登录功能，可以：

1. **启动后端服务**
   ```bash
   cd /Users/jimmy/go/src/lemon
   go run main.go serve
   ```

2. **启动前端服务**
   ```bash
   cd /Users/jimmy/go/src/cherry
   npm run dev
   ```

3. **在浏览器中测试**
   - 访问 `http://localhost:3000/login`
   - 打开 Chrome DevTools (F12)
   - 查看 Network 和 Console 标签

## 如果问题仍然存在

如果以上方案都无法解决，可以：

1. 查看 `chrome-devtools-mcp` 的 GitHub Issues
2. 考虑使用其他调试工具
3. 直接使用浏览器内置的 DevTools
