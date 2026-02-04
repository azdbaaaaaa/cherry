# 部署文档

## 目录说明

本目录包含 Cherry 前端项目的部署相关文档。

## 文档列表

### 构建和打包
- 生产环境构建
- 环境变量配置
- 静态资源优化

### 部署方式
- Nginx 部署
- Docker 部署
- CDN 部署
- 静态托管部署

### 环境配置
- 开发环境配置
- 测试环境配置
- 生产环境配置

### CI/CD
- GitHub Actions 配置
- GitLab CI 配置
- 自动化部署流程

### 调试和问题排查
- **[调试指南](./DEBUG.md)**: 开发调试相关问题解决方案

## 快速开始

### 生产环境构建

```bash
# 安装依赖
npm install

# 构建生产版本
npm run build

# 构建产物在 dist/ 目录
```

### Nginx 部署

```nginx
server {
    listen 80;
    server_name example.com;
    root /path/to/cherry/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Docker 部署

```bash
# 构建镜像
docker build -t cherry:latest .

# 运行容器
docker run -d -p 80:80 cherry:latest
```

## 环境变量

创建 `.env.production` 文件：

```env
VITE_API_BASE_URL=https://api.example.com
VITE_WS_BASE_URL=wss://api.example.com
```

## 相关文件

- `vite.config.ts` - Vite 构建配置
- `Dockerfile` - Docker 镜像构建文件（如有）
- `.env.production` - 生产环境变量配置

## 注意事项

- 构建前确保环境变量已正确配置
- 生产环境建议启用 HTTPS
- 静态资源建议使用 CDN 加速
- 注意 API 地址和 WebSocket 地址的配置
