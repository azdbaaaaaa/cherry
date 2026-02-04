# Cherry - AI视频生成工作流系统前端

基于 Vue3 + TypeScript + Vite 构建的前端应用。

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

**注意**: 后端API默认端口为 `7080`，确保后端服务运行在 `http://localhost:7080`。

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
cherry/
├── docs/                    # 项目文档
├── src/
│   ├── api/                 # API接口封装
│   ├── components/         # 公共组件
│   ├── views/              # 页面视图
│   ├── stores/             # 状态管理
│   ├── router/             # 路由配置
│   ├── utils/              # 工具函数
│   └── types/              # 类型定义
├── public/                 # 公共资源
└── package.json
```

## 技术栈

- Vue 3.4+
- TypeScript 5+
- Vite 5+
- Pinia 2+
- Vue Router 4+
- Element Plus 2.6+
- Axios 1.6+

## 环境变量

创建 `.env.development` 和 `.env.production` 文件配置API地址。

### Mock 模式

项目支持Mock模式，可以在后端接口未就绪时进行前端开发。

**启用Mock**（默认）:
```env
VITE_USE_MOCK=true
```

**禁用Mock**（使用真实后端）:
```env
VITE_USE_MOCK=false
```

**Mock 测试账号**:
- 管理员: 用户名 `admin`，密码任意
- 编辑: 用户名 `editor001`，密码任意

更多Mock使用说明请查看 [src/mock/README.md](./src/mock/README.md)

## 开发文档

详见 [docs/README.md](./docs/README.md)
