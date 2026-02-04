# Cherry 前端项目文档

Cherry 是 AI视频生成工作流系统的前端项目，基于 Vue3 + TypeScript + Vite 构建。

## 📚 文档导航

### 快速开始
- **[开发规范](./guide/DEVELOPMENT_RULES.md)** - ⚠️ **开发前必读** - 开发流程和规范

### API文档
- **[API参考](./api/API_REFERENCE.md)** - 基于后端Swagger的API接口参考文档

### 设计文档
- **[架构设计](./design/ARCHITECTURE.md)** - 前端架构设计
- **[API集成](./design/API_INTEGRATION.md)** - 后端API集成指南
- **[认证系统](./design/auth/FRONTEND_AUTH.md)** - 前端认证与权限系统设计

### 部署文档
- **[部署文档](./deploy/README.md)** - 构建、部署、环境配置

## 📁 文档结构

```
docs/
├── README.md              # 本文档（文档导航）
├── guide/                 # 开发指南
│   └── DEVELOPMENT_RULES.md  # 开发规范
├── api/                   # API文档
│   └── API_REFERENCE.md   # API接口参考（基于后端Swagger）
├── design/                # 设计文档
│   ├── ARCHITECTURE.md    # 架构设计
│   ├── API_INTEGRATION.md # API集成
│   └── auth/              # 认证模块
│       └── FRONTEND_AUTH.md
└── deploy/                # 部署文档
    ├── README.md
    └── DEBUG.md
```

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

## ⚠️ 重要提醒

**开发前必读**：在进行任何模块开发前，请先阅读 [开发规范](./guide/DEVELOPMENT_RULES.md)。
