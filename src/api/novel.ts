import request from './client'
import type {
  Novel,
  Chapter,
  CreateNovelRequest,
  CreateNovelResponse,
  GetChaptersResponse,
  Narration,
  GenerateNarrationResponse,
  GetNarrationVersionsResponse,
  ListNarrationsResponse,
  ManualNarrationRequest,
  ManualNarrationResponse,
  GetScenesResponse,
  GetShotsResponse,
  GenerateAudiosResponse,
  GetAudioVersionsResponse,
  ListAudiosResponse,
  GenerateSubtitlesResponse,
  GetSubtitleVersionsResponse,
  ListSubtitlesResponse,
  GenerateImagesResponse,
  GetImageVersionsResponse,
  ListImagesResponse,
  GenerateNarrationVideosResponse,
  GenerateFinalVideoResponse,
  GetVideoVersionsResponse,
  GetVideosByStatusResponse,
  ListVideosResponse
} from '@/types/novel'

export const novelApi = {
  /**
   * 获取剧本列表
   * @param params 查询参数
   * @returns Promise<{ novels: Novel[], total: number, page: number, page_size: number }>
   */
  list(params?: { page?: number; page_size?: number }) {
    return request.get<{
      novels: Novel[]
      total: number
      page: number
      page_size: number
    }>('/api/v1/novels', { params })
  },

  /**
   * 创建小说
   * @param data 创建小说请求数据
   * @returns Promise<CreateNovelResponse>
   */
  createNovel(data: CreateNovelRequest) {
    return request.post<CreateNovelResponse>('/api/v1/novels', data)
  },

  /**
   * 获取小说信息
   * @param novelId 小说ID
   * @returns Promise<Novel>
   */
  getNovel(novelId: string) {
    return request.get<{ novel: Novel }>('/api/v1/novels/detail', {
      params: { novel_id: novelId }
    })
  },

  /**
   * 一键生成内容（异步，立即返回）
   * @param novelId 小说ID
   * @param targetChapters 目标章节数
   * @returns Promise<{ code: number; message: string; data: { novel_id: string; target_chapters: number; message: string } }>
   */
  generateContent(novelId: string, targetChapters: number) {
    return request.post<{
      code: number
      message: string
      data: {
        novel_id: string
        target_chapters: number
        message: string
      }
    }>('/api/v1/novels/generate-content', {
      novel_id: novelId,
      target_chapters: targetChapters
    })
  },

  /**
   * 获取生成状态
   * @param novelId 小说ID
   * @returns Promise<{ code: number; message: string; data: { status: string; progress: number; message: string } }>
   */
  getGenerationStatus(novelId: string) {
    return request.get<{
      code: number
      message: string
      data: {
        status: string
        progress: number
        message: string
      }
    }>('/api/v1/novels/generation-status', {
      params: { novel_id: novelId }
    })
  },

  /**
   * 获取章节列表
   * @param novelId 小说ID
   * @returns Promise<GetChaptersResponse>
   */
  getChapters(novelId: string) {
    return request.get<GetChaptersResponse>('/api/v1/chapters', {
      params: { novel_id: novelId }
    })
  },

  /**
   * 切分章节
   * @param novelId 小说ID
   * @param targetChapters 目标章节数
   * @returns Promise<{ code: number; message: string; data: { novel_id: string; target_chapters: number; message: string } }>
   */
  splitChapters(novelId: string, targetChapters: number) {
    return request.post<{
      code: number
      message: string
      data: {
        novel_id: string
        target_chapters: number
        message: string
      }
    }>('/api/v1/chapters/split', {
      novel_id: novelId,
      target_chapters: targetChapters
    })
  },

  // ========== 场景和镜头相关 ==========

  /**
   * 为章节生成场景和镜头
   * @param chapterId 章节ID
   * @returns Promise<{ code: number; message: string; data: { chapter_id: string; message: string } }>
   */
  generateScenes(chapterId: string) {
    return request.post<{
      code: number
      message: string
      data: {
        chapter_id: string
        message: string
      }
    }>('/api/v1/scenes/generate', {
      chapter_id: chapterId
    })
  },

  // ========== 解说相关（已废弃） ==========

  /**
   * 为章节生成解说（已废弃，请使用 generateScenes）
   * @param chapterId 章节ID
   * @returns Promise<GenerateNarrationResponse>
   * @deprecated 请使用 generateScenes
   */
  generateNarration(chapterId: string) {
    return request.post<GenerateNarrationResponse>(
      `/api/v1/novels/chapters/${chapterId}/narration`
    )
  },

  /**
   * 人工提交解说 JSON，生成新版本
   */
  createNarrationManual(chapterId: string, data: ManualNarrationRequest) {
    return request.post<ManualNarrationResponse>(
      `/api/v1/novels/chapters/${chapterId}/narration/manual`,
      data
    )
  },

  /**
   * 列出章节的所有解说版本
   */
  listNarrations(chapterId: string) {
    return request.get<ListNarrationsResponse>(`/api/v1/novels/chapters/${chapterId}/narrations`)
  },

  /**
   * 获取场景列表（根据章节ID和版本号）
   */
  getScenes(chapterId: string, version?: number) {
    return request.get<GetScenesResponse>('/api/v1/scenes', {
      params: { chapter_id: chapterId, ...(version ? { version } : {}) }
    })
  },

  /**
   * 获取镜头列表（根据章节ID和版本号）
   */
  getShots(chapterId: string, version?: number) {
    return request.get<GetShotsResponse>('/api/v1/shots', {
      params: { chapter_id: chapterId, ...(version ? { version } : {}) }
    })
  },

  /**
   * 设置章节的生效场景版本号
   * @param chapterId 章节ID
   * @param version 版本号
   * @returns Promise<{ code: number; message: string; data: { chapter_id: string; version: number; message: string } }>
   */
  setActiveSceneVersion(chapterId: string, version: number) {
    return request.put<{
      code: number
      message: string
      data: {
        chapter_id: string
        version: number
        message: string
      }
    }>('/api/v1/scenes/version', {
      chapter_id: chapterId,
      version: version
    })
  },

  /**
   * 为所有章节生成解说
   * @param novelId 小说ID
   * @returns Promise<{ novel_id: string; message: string }>
   */
  generateNarrationsForAllChapters(novelId: string) {
    return request.post<{ novel_id: string; message: string }>(
      `/api/v1/novels/${novelId}/chapters/narration`
    )
  },

  /**
   * 获取章节解说
   * @param chapterId 章节ID
   * @returns Promise<Narration>
   */
  getNarration(chapterId: string) {
    return request.get<Narration>(`/api/v1/novels/chapters/${chapterId}/narration`)
  },

  /**
   * 获取章节解说的版本列表
   * @param chapterId 章节ID
   * @returns Promise<GetNarrationVersionsResponse>
   */
  getNarrationVersions(chapterId: string) {
    return request.get<GetNarrationVersionsResponse>(
      `/api/v1/novels/chapters/${chapterId}/narration/versions`
    )
  },

  // ========== 音频相关 ==========

  /**
   * 为解说生成音频
   * @param narrationId 解说ID
   * @returns Promise<GenerateAudiosResponse>
   */
  generateAudios(narrationId: string) {
    return request.post<GenerateAudiosResponse>(
      `/api/v1/narrations/${narrationId}/audios`
    )
  },

  listAudios(narrationId: string, version?: number) {
    return request.get<ListAudiosResponse>(`/api/v1/narrations/${narrationId}/audios`, {
      params: version ? { version } : {}
    })
  },

  /**
   * 获取解说的音频版本列表
   * @param narrationId 解说ID
   * @returns Promise<GetAudioVersionsResponse>
   */
  getAudioVersions(narrationId: string) {
    return request.get<GetAudioVersionsResponse>(
      `/api/v1/narrations/${narrationId}/audios/versions`
    )
  },

  // ========== 字幕相关 ==========

  /**
   * 为解说生成字幕
   * @param narrationId 解说ID
   * @returns Promise<GenerateSubtitlesResponse>
   */
  generateSubtitles(narrationId: string) {
    return request.post<GenerateSubtitlesResponse>(
      `/api/v1/narrations/${narrationId}/subtitles`
    )
  },

  listSubtitles(narrationId: string, version?: number) {
    return request.get<ListSubtitlesResponse>(`/api/v1/narrations/${narrationId}/subtitles`, {
      params: version ? { version } : {}
    })
  },

  /**
   * 获取章节的字幕版本列表
   * @param chapterId 章节ID
   * @returns Promise<GetSubtitleVersionsResponse>
   */
  getSubtitleVersions(chapterId: string) {
    return request.get<GetSubtitleVersionsResponse>(
      `/api/v1/novels/chapters/${chapterId}/subtitles/versions`
    )
  },

  // ========== 图片相关 ==========

  /**
   * 为解说生成图片
   * @param narrationId 解说ID
   * @returns Promise<GenerateImagesResponse>
   */
  generateImages(narrationId: string) {
    return request.post<GenerateImagesResponse>(
      `/api/v1/narrations/${narrationId}/images`
    )
  },

  listImages(narrationId: string, version?: number) {
    return request.get<ListImagesResponse>(`/api/v1/narrations/${narrationId}/images`, {
      params: version ? { version } : {}
    })
  },

  /**
   * 获取章节的图片版本列表
   * @param chapterId 章节ID
   * @returns Promise<GetImageVersionsResponse>
   */
  getImageVersions(chapterId: string) {
    return request.get<GetImageVersionsResponse>(
      `/api/v1/novels/chapters/${chapterId}/images/versions`
    )
  },

  // ========== 视频相关 ==========

  /**
   * 为章节生成 shot 视频
   * @param chapterId 章节ID
   * @returns Promise<GenerateShotVideosResponse>
   */
  generateShotVideos(chapterId: string) {
    return request.post<GenerateShotVideosResponse>(
      `/api/v1/chapters/videos/shots`,
      { chapter_id: chapterId }
    )
  },

  /**
   * 生成章节的最终完整视频
   * @param chapterId 章节ID
   * @param version 可选：指定要合并的视频版本号
   * @returns Promise<GenerateFinalVideoResponse>
   */
  generateFinalVideo(chapterId: string, version?: number) {
    return request.post<GenerateFinalVideoResponse>(
      `/api/v1/chapters/videos/final`,
      { chapter_id: chapterId, ...(version ? { version } : {}) }
    )
  },

  generateFinalVideoWithVersion(chapterId: string, version: number) {
    return request.post<GenerateFinalVideoResponse>(
      `/api/v1/chapters/videos/final`,
      { chapter_id: chapterId, version }
    )
  },

  /**
   * 获取章节的视频版本列表
   * @param chapterId 章节ID
   * @returns Promise<GetVideoVersionsResponse>
   */
  getVideoVersions(chapterId: string) {
    return request.get<GetVideoVersionsResponse>(
      `/api/v1/novels/chapters/videos/versions`,
      { params: { chapter_id: chapterId } }
    )
  },

  listVideos(chapterId: string, version?: number) {
    return request.get<ListVideosResponse>(`/api/v1/novels/chapters/videos`, {
      params: { chapter_id: chapterId, ...(version ? { version } : {}) }
    })
  },

  /**
   * 根据状态查询视频
   * @param status 视频状态：pending, processing, completed, failed
   * @returns Promise<GetVideosByStatusResponse>
   */
  getVideosByStatus(status: 'pending' | 'processing' | 'completed' | 'failed') {
    return request.get<GetVideosByStatusResponse>('/api/v1/videos', {
      params: { status }
    })
  },

  // ========== 分镜头管理 ==========

  /**
   * 更新分镜头信息
   */
  updateShot(shotId: string, data: import('@/types/novel').UpdateShotRequest) {
    return request.put(`/api/v1/shots`, { shot_id: shotId, ...data })
  },

  /**
   * 重新生成分镜头脚本
   */
  regenerateShotScript(shotId: string) {
    return request.post(`/api/v1/shots/${shotId}/regenerate`)
  },

  /**
   * 获取镜头详情
   */
  getShot(shotId: string) {
    return request.get<{ shot: import('@/types/novel').Shot }>(`/api/v1/shots`, {
      params: { shot_id: shotId }
    })
  },

  /**
   * 生成镜头图片（首图和尾图）
   */
  generateShotImages(shotId: string) {
    return request.post<{ image_ids: string[]; count: number; shot_id: string }>(
      `/api/v1/shots/images`,
      { shot_id: shotId }
    )
  },

  /**
   * 获取镜头图片列表
   */
  getShotImages(shotId: string) {
    return request.get<{ images: import('@/types/novel').Image[]; count: number }>(
      `/api/v1/shots/images`,
      { params: { shot_id: shotId } }
    )
  },

  /**
   * 生成镜头音频
   */
  generateShotAudio(shotId: string) {
    return request.post<{ audio_id: string; shot_id: string }>(`/api/v1/shots/audio`, {
      shot_id: shotId
    })
  },

  /**
   * 获取镜头音频列表
   */
  getShotAudios(shotId: string) {
    return request.get<{ audios: import('@/types/novel').Audio[]; count: number }>(
      `/api/v1/shots/audios`,
      { params: { shot_id: shotId } }
    )
  },

  /**
   * 生成镜头字幕
   */
  generateShotSubtitle(shotId: string) {
    return request.post<{ subtitle_id: string; shot_id: string }>(`/api/v1/shots/subtitle`, {
      shot_id: shotId
    })
  },

  /**
   * 获取镜头字幕列表
   */
  getShotSubtitles(shotId: string) {
    return request.get<{ subtitles: import('@/types/novel').Subtitle[]; count: number }>(
      `/api/v1/shots/subtitles`,
      { params: { shot_id: shotId } }
    )
  },

  /**
   * 生成镜头视频
   */
  generateShotVideo(shotId: string) {
    return request.post<{ video_id: string; shot_id: string }>(`/api/v1/shots/video`, {
      shot_id: shotId
    })
  },

  /**
   * 获取镜头视频列表
   */
  getShotVideos(shotId: string) {
    return request.get<{ videos: import('@/types/novel').Video[]; count: number }>(
      `/api/v1/shots/videos`,
      { params: { shot_id: shotId } }
    )
  },

  // ========== 图片生成（角色、场景、道具）==========

  /**
   * 从小说生成角色和道具（基于整个小说内容）
   */
  generateCharactersFromNovel(novelId: string) {
    return request.post<{ novel_id: string; message: string }>(
      '/api/v1/characters/generate-from-novel',
      { novel_id: novelId }
    )
  },

  /**
   * 生成角色图片（异步）
   */
  generateCharacterImages(novelId: string) {
    return request.post<{ novel_id: string; message: string }>(
      '/api/v1/characters/images',
      { novel_id: novelId }
    )
  },

  /**
   * 获取角色图片生成状态
   */
  getCharacterImageGenerationStatus(novelId: string) {
    return request.get<{
      novel_id: string
      statuses: Array<{
        character_id: string
        character_name: string
        status: string
        error_message?: string
      }>
      summary: {
        total: number
        pending: number
        completed: number
        failed: number
      }
    }>('/api/v1/characters/images/status', {
      params: { novel_id: novelId }
    })
  },

  /**
   * 生成场景图片
   */
  generateSceneImages(narrationId: string) {
    return request.post<{ narration_id: string; image_ids: string[]; count: number }>(
      `/api/v1/narrations/${narrationId}/scenes/images`
    )
  },

  /**
   * 生成道具图片（异步）
   */
  generatePropImages(novelId: string) {
    return request.post<{ novel_id: string; message: string }>(
      '/api/v1/props/images',
      { novel_id: novelId }
    )
  },

  /**
   * 获取道具图片生成状态
   */
  getPropImageGenerationStatus(novelId: string) {
    return request.get<{
      novel_id: string
      statuses: Array<{
        prop_id: string
        prop_name: string
        status: string
        error_message?: string
      }>
      summary: {
        total: number
        pending: number
        completed: number
        failed: number
      }
    }>('/api/v1/props/images/status', {
      params: { novel_id: novelId }
    })
  },

  /**
   * 获取小说的角色列表
   */
  getCharacters(novelId: string) {
    return request.get<{ characters: import('@/types/novel').Character[] }>(
      '/api/v1/characters',
      { params: { novel_id: novelId } }
    )
  },

  /**
   * 获取小说的道具列表
   */
  getProps(novelId: string) {
    return request.get<{ props: import('@/types/novel').Prop[] }>(
      '/api/v1/props',
      { params: { novel_id: novelId } }
    )
  },

  /**
   * 获取角色的所有图片
   */
  getCharacterImages(characterId: string) {
    return request.get<{ character_id: string; images: import('@/types/novel').Image[]; count: number }>(
      '/api/v1/characters/images',
      { params: { character_id: characterId } }
    )
  },

  /**
   * 获取道具的所有图片
   */
  getPropImages(propId: string) {
    return request.get<{ prop_id: string; images: import('@/types/novel').Image[]; count: number }>(
      '/api/v1/props/images',
      { params: { prop_id: propId } }
    )
  },

  /**
   * 为章节生成所有 shot 的音频
   */
  generateAudiosForChapter(chapterId: string) {
    return request.post<{ chapter_id: string; message: string }>(
      `/api/v1/chapters/${chapterId}/audios`
    )
  },

  /**
   * 为章节生成所有 shot 的视频
   */
  generateVideosForChapter(chapterId: string) {
    return request.post<{ chapter_id: string; message: string }>(
      `/api/v1/chapters/videos`,
      { chapter_id: chapterId }
    )
  },

  /**
   * 获取章节的音频列表
   */
  getAudiosByChapter(chapterId: string, version?: number) {
    return request.get<{ audios: import('@/types/novel').Audio[]; version: number }>(
      `/api/v1/chapters/audios`,
      { params: { chapter_id: chapterId, ...(version ? { version } : {}) } }
    )
  },

  /**
   * 获取章节的视频列表
   */
  getVideosByChapter(chapterId: string, version?: number) {
    return request.get<{ videos: import('@/types/novel').Video[]; version: number }>(
      `/api/v1/chapters/videos`,
      { params: { chapter_id: chapterId, ...(version ? { version } : {}) } }
    )
  }
}

