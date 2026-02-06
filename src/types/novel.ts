// 小说相关类型定义

export interface Novel {
  id: string
  workflow_id: string
  user_id: string
  resource_id: string
  title?: string
  author?: string
  description?: string
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
  total_chars: number
  word_count: number
  line_count: number
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface CreateNovelRequest {
  resource_id: string
  user_id: string
  workflow_id: string
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
  narration_id: string
  chapter_id: string
  user_id: string
  scene_number: string
  narration?: string
  sequence: number
  version: number
  status: string
  created_at: string
  updated_at: string
}

export interface ShotInfo {
  id: string
  scene_id: string
  scene_number: string
  narration_id: string
  chapter_id: string
  user_id: string
  shot_number: string
  character?: string
  image?: string
  narration: string
  sound_effect?: string
  duration?: number
  image_prompt: string
  video_prompt?: string
  camera_movement?: string
  sequence: number
  index: number
  version: number
  status: string
  error_message?: string
  created_at: string
  updated_at: string
}

export interface UpdateShotRequest {
  narration?: string
  image_prompt?: string
  video_prompt?: string
  camera_movement?: string
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
  image_resource_id?: string
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
  image_resource_id?: string
  category?: string
  status: string
  created_at: string
  updated_at: string
}

export interface SceneInfo {
  id: string
  narration_id: string
  chapter_id: string
  user_id: string
  scene_number: string
  description: string
  image_prompt: string
  image_resource_id?: string
  narration?: string
  sequence: number
  version: number
  status: string
  created_at: string
  updated_at: string
}

export interface GetScenesResponse {
  narration_id: string
  scenes: SceneInfo[]
  count: number
}

export interface GetShotsResponse {
  narration_id: string
  shots: ShotInfo[]
  count: number
}

// 音频相关类型
export interface Audio {
  id: string
  narration_id: string
  chapter_id: string
  user_id: string
  sequence: number
  audio_resource_id: string
  duration: number
  text: string
  prompt: string
  version: number
  status: 'pending' | 'completed' | 'failed'
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
  narration_id: string
  user_id: string
  sequence: number
  subtitle_resource_id: string
  format: string
  prompt: string
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
  image_resource_id: string
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
  user_id: string
  sequence: number
  video_resource_id: string
  duration: number
  video_type: 'narration_video' | 'final_video'
  prompt?: string
  version: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  created_at: string
  updated_at: string
}

export interface GenerateNarrationVideosResponse {
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

