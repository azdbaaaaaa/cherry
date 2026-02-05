# 浏览器 MCP 服务安装指南

## 安装步骤

### 1. 安装依赖包

在终端中执行以下命令（需要网络权限）：

```bash
cd /Users/dzhou/go/src/cherry
npm install --save-dev @modelcontextprotocol/server-playwright playwright
```

### 2. 安装 Playwright 浏览器

```bash
npx playwright install chromium
```

### 3. 配置 Cursor MCP

配置文件位置：`~/.cursor/mcp.json`

将以下内容添加到配置文件中：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-playwright"
      ],
      "env": {
        "BROWSER": "chromium"
      }
    }
  }
}
```

### 4. 重启 Cursor

配置完成后，重启 Cursor 编辑器以使配置生效。

## 使用方法

安装完成后，我就可以通过 MCP 协议控制浏览器进行前端调试了，包括：

- 打开网页
- 点击元素
- 填写表单
- 截图
- 检查元素
- 执行 JavaScript
- 查看控制台日志
- 检查网络请求

## 故障排除

如果遇到权限问题，可以尝试：

1. **使用本地安装**（推荐）：
   ```bash
   cd /Users/dzhou/go/src/cherry
   npm install --save-dev @modelcontextprotocol/server-playwright playwright
   ```

2. **检查 npm 权限**：
   ```bash
   npm config get prefix
   ```

3. **如果仍有问题**，可以手动编辑 `~/.cursor/mcp.json` 文件

