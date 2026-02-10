// 小说相关类型定义

export interface Novel {
  id: string
  workflow_id?: string // 已废弃，保留用于向后兼容
  user_id: string
  resource_id: string
  title?: string
  author?: string
  description?: string
  narration_type: 'narration' | 'dialogue' // 旁白类型：narration（旁白/解说）或 dialogue（真人对话）
  style: 'anime' | 'live' | 'mixed' // 风格：anime（漫剧）、live（真人剧）、mixed（混合）
  episode_count: number // 集数（章节数量）
  episode_duration: 'auto' | '3-5min' | '5-10min' | '10-20min' | '20-30min' // 每集时长：auto（自动）、3-5min、5-10min、10-20min、20-30min
  generation_status?: '' | 'pending' | 'processing' | 'completed' | 'failed' // 内容生成状态
  generation_progress?: number // 生成进度：0-100
  generation_message?: string // 当前步骤说明
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Chapter {
  id: string
  novel_id: string
  workflow_id: string
  user_id: string
  sequence: number
  title: string
  chapter_text: string
  narration_text?: string
  word_count: number
  active_scene_version?: number // 当前生效的场景版本号
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface CreateNovelRequest {
  resource_id: string
  user_id: string
  narration_type: 'narration' | 'dialogue' // 旁白类型：narration（旁白/解说）或 dialogue（真人对话）
  style: 'anime' | 'live' | 'mixed' // 风格：anime（漫剧）、live（真人剧）、mixed（混合）
  // 注意：格式和每集时长在切分章节时自动确定
}

export interface CreateNovelResponse {
  novel_id: string
}

export interface SplitChaptersRequest {
  novel_id: string
  target_chapters: number
}

export interface SplitChaptersResponse {
  novel_id: string
  target_chapters: number
  message: string
}

export interface UploadFileResponse {
  resource_id: string
  resource_url: string
  file_size: number
  file_name: string
}

export interface GetChaptersResponse {
  novel_id: string
  chapters: Chapter[]
  count: number
}

// 解说相关类型
export interface Narration {
  id: string
  chapter_id: string
  user_id: string
  prompt: string
  version: number
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface GenerateNarrationResponse {
  narration_text: string
  narration_id: string
  version: number
  chapter_id: string
}

export interface GetNarrationVersionsResponse {
  chapter_id: string
  versions: number[]
}

export interface ListNarrationsResponse {
  chapter_id: string
  narrations: Narration[]
  count: number
}

export interface ManualNarrationRequest {
  user_id: string
  prompt?: string
  narration_text: string
}

export interface ManualNarrationResponse {
  chapter_id: string
  narration_id: string
  version: number
}

export interface SceneInfo {
  id: string
  chapter_id: string
  user_id: string
  description: string // 场景描述
  sequence: number // 序号
  version: number // 版本号
  status: string // 状态
  created_at: string
  updated_at: string
}

export interface ShotInfo {
  id: string
  scene_id: string
  chapter_id: string
  user_id: string
  narration: string // 旁白（镜头解说内容）
  duration?: number // 时长（秒）
  first_image_prompt: string // 首图提示词（第一帧图片）
  last_image_prompt: string // 末图提示词（最后一帧图片）
  video_prompt: string // 视频提示词（动态视频）
  sequence: number // 序号（在场景中的顺序）
  version: number // 版本号
  status: string
  error_message?: string // 错误信息（失败时）
  created_at: string
  updated_at: string
}

export interface UpdateShotRequest {
  narration?: string
  first_image_prompt?: string
  last_image_prompt?: string
  video_prompt?: string
  duration?: number
}

export interface Character {
  id: string
  novel_id: string
  workflow_id: string
  name: string
  gender?: string
  age_group?: string
  role_number?: string
  description: string
  image_prompt: string
  image_url?: string
  status: string
  created_at: string
  updated_at: string
}

export interface Prop {
  id: string
  novel_id: string
  workflow_id: string
  name: string
  description: string
  image_prompt: string
  image_url?: string
  category?: string
  status: string
  created_at: string
  updated_at: string
}

export interface GetScenesResponse {
  chapter_id: string
  scenes: SceneInfo[]
  count: number
}

export interface GetShotsResponse {
  chapter_id: string
  shots: ShotInfo[]
  count: number
}

// 音频相关类型
export interface Audio {
  id: string
  narration_id?: string
  chapter_id: string
  shot_id?: string
  user_id: string
  sequence?: number
  audio_resource_id: string
  audio_url?: string // 音频直接访问URL
  duration: number
  text: string
  prompt?: string
  version: number
  status: 'pending' | 'completed' | 'failed'
  error_message?: string
  created_at: string
  updated_at: string
}

export interface GenerateAudiosResponse {
  audio_ids: string[]
  count: number
  narration_id: string
}

export interface GetAudioVersionsResponse {
  narration_id: string
  versions: number[]
}

export interface ListAudiosResponse {
  narration_id: string
  version: number
  audios: Audio[]
  count: number
}

// 字幕相关类型
export interface Subtitle {
  id: string
  chapter_id: string
  narration_id?: string
  shot_id?: string
  user_id: string
  sequence: number
  subtitle_resource_id: string
  subtitle_url?: string // 字幕的直接访问URL
  format: string
  prompt?: string
  version: number
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface GenerateSubtitlesResponse {
  subtitle_ids: string[]
  count: number
  narration_id: string
}

export interface GetSubtitleVersionsResponse {
  chapter_id: string
  versions: number[]
}

export interface ListSubtitlesResponse {
  narration_id: string
  version: number
  subtitles: Subtitle[]
  count: number
}

// 图片相关类型
export interface Image {
  id: string
  chapter_id: string
  narration_id: string
  scene_number: string
  shot_number: string
  character_name?: string
  image_resource_id?: string // 已废弃，保留用于向后兼容
  image_url?: string // 图片的直接访问URL（优先使用此字段）
  character_image_subtype?: string // 角色图片细分类：front（正视图）、three_view（三视图）、detail（细节图）
  prompt: string
  version: number
  sequence: number
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface GenerateImagesResponse {
  image_ids: string[]
  count: number
  narration_id: string
}

export interface GetImageVersionsResponse {
  chapter_id: string
  versions: number[]
}

export interface ListImagesResponse {
  narration_id: string
  version: number
  images: Image[]
  count: number
}

// 视频相关类型
export interface Video {
  id: string
  chapter_id: string
  narration_id?: string
  shot_id?: string
  user_id: string
  sequence?: number
  video_resource_id: string
  video_url?: string // 视频直接访问URL
  duration: number
  video_type: 'narration_video' | 'final_video' | 'shot'
  prompt?: string
  version: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  created_at: string
  updated_at: string
}

export interface GenerateShotVideosResponse {
  video_ids: string[]
  count: number
  chapter_id: string
}

export interface GenerateFinalVideoResponse {
  video_id: string
  chapter_id: string
}

export interface GetVideoVersionsResponse {
  chapter_id: string
  versions: number[]
  count: number
}

export interface GetVideosByStatusResponse {
  videos: Video[]
  count: number
  status: string
}

export interface ListVideosResponse {
  chapter_id: string
  version: number
  videos: Video[]
  count: number
}

