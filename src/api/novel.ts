import request from './client'
import type {
  Novel,
  Chapter,
  CreateNovelRequest,
  CreateNovelResponse,
  SplitChaptersRequest,
  SplitChaptersResponse,
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
    return request.get<{ novel: Novel }>(`/api/v1/novels/${novelId}`)
  },

  /**
   * 切分章节
   * @param novelId 小说ID
   * @param targetChapters 目标章节数
   * @returns Promise<SplitChaptersResponse>
   */
  splitChapters(novelId: string, targetChapters: number) {
    const data: SplitChaptersRequest = {
      novel_id: novelId,
      target_chapters: targetChapters
    }
    return request.post<SplitChaptersResponse>(
      `/api/v1/novels/${novelId}/chapters/split`,
      data
    )
  },

  /**
   * 获取章节列表
   * @param novelId 小说ID
   * @returns Promise<GetChaptersResponse>
   */
  getChapters(novelId: string) {
    return request.get<GetChaptersResponse>(`/api/v1/novels/${novelId}/chapters`)
  },

  // ========== 解说相关 ==========

  /**
   * 为章节生成解说
   * @param chapterId 章节ID
   * @returns Promise<GenerateNarrationResponse>
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
   * 获取解说的场景列表
   */
  getScenes(narrationId: string) {
    return request.get<GetScenesResponse>(`/api/v1/narrations/${narrationId}/scenes`)
  },

  /**
   * 获取解说的镜头列表
   */
  getShots(narrationId: string) {
    return request.get<GetShotsResponse>(`/api/v1/narrations/${narrationId}/shots`)
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
   * 为章节生成 narration 视频
   * @param chapterId 章节ID
   * @returns Promise<GenerateNarrationVideosResponse>
   */
  generateNarrationVideos(chapterId: string) {
    return request.post<GenerateNarrationVideosResponse>(
      `/api/v1/novels/chapters/${chapterId}/videos/narration`
    )
  },

  /**
   * 生成章节的最终完整视频
   * @param chapterId 章节ID
   * @returns Promise<GenerateFinalVideoResponse>
   */
  generateFinalVideo(chapterId: string) {
    return request.post<GenerateFinalVideoResponse>(
      `/api/v1/novels/chapters/${chapterId}/videos/final`
    )
  },

  generateFinalVideoWithVersion(chapterId: string, version: number) {
    return request.post<GenerateFinalVideoResponse>(
      `/api/v1/novels/chapters/${chapterId}/videos/final`,
      undefined,
      { params: { version } }
    )
  },

  /**
   * 获取章节的视频版本列表
   * @param chapterId 章节ID
   * @returns Promise<GetVideoVersionsResponse>
   */
  getVideoVersions(chapterId: string) {
    return request.get<GetVideoVersionsResponse>(
      `/api/v1/novels/chapters/${chapterId}/videos/versions`
    )
  },

  listVideos(chapterId: string, version?: number) {
    return request.get<ListVideosResponse>(`/api/v1/novels/chapters/${chapterId}/videos`, {
      params: version ? { version } : {}
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
    return request.put(`/api/v1/shots/${shotId}`, data)
  },

  /**
   * 重新生成分镜头脚本
   */
  regenerateShotScript(shotId: string) {
    return request.post(`/api/v1/shots/${shotId}/regenerate`)
  },

  // ========== 图片生成（角色、场景、道具）==========

  /**
   * 生成角色图片
   */
  generateCharacterImages(novelId: string) {
    return request.post<{ novel_id: string; image_ids: string[]; count: number }>(
      `/api/v1/novels/${novelId}/characters/images`
    )
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
   * 生成道具图片
   */
  generatePropImages(novelId: string) {
    return request.post<{ novel_id: string; image_ids: string[]; count: number }>(
      `/api/v1/novels/${novelId}/props/images`
    )
  },

  /**
   * 获取小说的角色列表
   */
  getCharacters(novelId: string) {
    return request.get<{ characters: import('@/types/novel').Character[] }>(
      `/api/v1/novels/${novelId}/characters`
    )
  },

  /**
   * 获取小说的道具列表
   */
  getProps(novelId: string) {
    return request.get<{ props: import('@/types/novel').Prop[] }>(
      `/api/v1/novels/${novelId}/props`
    )
  }
}

