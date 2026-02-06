# 前端页面实现总结

## 已完成的页面

### 1. 分镜头脚本编辑页面 (`/workflow/shots`)

**文件**: `src/views/Workflow/ShotEditor.vue`

**功能**:
- 显示分镜头列表
- 支持编辑分镜头信息（解说、图片提示词、视频提示词、运镜方式、时长）
- 支持保存修改
- 支持单个或批量重新生成分镜头脚本

**参数**:
- `narrationId` (query): 解说ID

**API 调用**:
- `GET /api/v1/narrations/:narrationId/shots` - 获取分镜头列表
- `PUT /api/v1/shots/:shotId` - 更新分镜头信息
- `POST /api/v1/shots/:shotId/regenerate` - 重新生成分镜头脚本

---

### 2. 图片 Review 页面 (`/workflow/images`)

**文件**: `src/views/Workflow/ImageReview.vue`

**功能**:
- 分标签页显示：分镜头图片、角色图片、场景图片、道具图片
- 支持生成各类图片
- 支持查看图片预览
- 支持重新生成单个图片

**参数**:
- `narrationId` (query): 解说ID（用于分镜头和场景图片）
- `novelId` (query): 小说ID（用于角色和道具图片）

**API 调用**:
- `GET /api/v1/narrations/:narrationId/images` - 获取分镜头图片列表
- `GET /api/v1/novels/:novelId/characters` - 获取角色列表
- `GET /api/v1/narrations/:narrationId/scenes` - 获取场景列表
- `GET /api/v1/novels/:novelId/props` - 获取道具列表
- `POST /api/v1/narrations/:narrationId/images` - 生成分镜头图片
- `POST /api/v1/novels/:novelId/characters/images` - 生成角色图片
- `POST /api/v1/narrations/:narrationId/scenes/images` - 生成场景图片
- `POST /api/v1/novels/:novelId/props/images` - 生成道具图片

---

### 3. 音频 Review 页面 (`/workflow/audios`)

**文件**: `src/views/Workflow/AudioReview.vue`

**功能**:
- 显示音频列表（支持版本选择）
- 支持音频播放预览
- 支持生成音频
- 支持重新生成单个音频

**参数**:
- `narrationId` (query): 解说ID

**API 调用**:
- `GET /api/v1/narrations/:narrationId/audios/versions` - 获取音频版本列表
- `GET /api/v1/narrations/:narrationId/audios` - 获取音频列表
- `POST /api/v1/narrations/:narrationId/audios` - 生成音频

---

### 4. 视频 Review 页面 (`/workflow/videos`)

**文件**: `src/views/Workflow/VideoReview.vue`

**功能**:
- 显示分镜视频列表（支持版本选择）
- 显示最终视频
- 支持视频播放预览
- 支持生成分镜视频和最终视频
- 支持重新生成单个视频

**参数**:
- `chapterId` (query): 章节ID

**API 调用**:
- `GET /api/v1/novels/chapters/:chapterId/videos/versions` - 获取视频版本列表
- `GET /api/v1/novels/chapters/:chapterId/videos` - 获取视频列表
- `POST /api/v1/novels/chapters/:chapterId/videos/narration` - 生成分镜视频
- `POST /api/v1/novels/chapters/:chapterId/videos/final` - 生成最终视频

---

### 5. 工作流详情页面更新

**文件**: `src/views/Workflow/Detail.vue`

**更新内容**:
- 在阶段详情中添加操作按钮
- 根据阶段状态显示相应的操作入口：
  - **分镜生成阶段**: 编辑分镜头按钮
  - **资产设计阶段**: 查看图片、查看音频按钮
  - **视频生成阶段**: 查看视频按钮

---

## 路由配置

**文件**: `src/router/index.ts`

新增路由：
- `/workflow/shots` - 分镜头脚本编辑
- `/workflow/images` - 图片 Review
- `/workflow/audios` - 音频 Review
- `/workflow/videos` - 视频 Review

---

## API 接口更新

**文件**: `src/api/novel.ts`

新增接口：
- `updateShot(shotId, data)` - 更新分镜头信息
- `regenerateShotScript(shotId)` - 重新生成分镜头脚本
- `generateCharacterImages(novelId)` - 生成角色图片
- `generateSceneImages(narrationId)` - 生成场景图片
- `generatePropImages(novelId)` - 生成道具图片
- `getCharacters(novelId)` - 获取角色列表
- `getProps(novelId)` - 获取道具列表

---

## 类型定义更新

**文件**: `src/types/novel.ts`

新增类型：
- `UpdateShotRequest` - 更新分镜头请求
- `Character` - 角色信息
- `Prop` - 道具信息
- 更新 `ShotInfo` - 添加了更多字段（image_prompt, video_prompt, camera_movement, duration等）
- 更新 `Image` - 添加了 scene_number, shot_number, character_name 字段

---

## 使用说明

### 从工作流详情页面进入

1. 访问工作流详情页面：`/workflow/:id`
2. 在阶段详情中，点击相应阶段的操作按钮
3. 系统会自动传递必要的参数（workflowId）

### 直接访问（需要手动提供参数）

- 分镜头编辑：`/workflow/shots?narrationId=xxx`
- 图片 Review：`/workflow/images?narrationId=xxx&novelId=xxx`
- 音频 Review：`/workflow/audios?narrationId=xxx`
- 视频 Review：`/workflow/videos?chapterId=xxx`

---

## 待完善功能

1. ⚠️ 重新生成单个图片/音频/视频的功能（目前显示提示，待后端实现）
2. ⚠️ 通过 workflowId 自动查询关联的 novelId、narrationId、chapterId（需要后端支持）
3. ⚠️ 图片/音频/视频的版本对比功能
4. ⚠️ 批量操作功能（批量重新生成、批量删除等）

---

## 设计特点

1. **统一的视觉风格**: 所有页面使用相同的 header 和 card 样式
2. **友好的错误提示**: 缺少参数时显示清晰的提示信息
3. **响应式设计**: 适配不同屏幕尺寸
4. **加载状态**: 所有异步操作都有 loading 状态
5. **操作反馈**: 使用 ElMessage 提供操作成功/失败的反馈

