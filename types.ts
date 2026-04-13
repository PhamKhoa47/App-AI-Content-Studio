
export interface StoryPage {
  id: number;
  text: string;
}

export interface StoryFormState {
  theme: string;
  genre: string[];
  style: string[];
  age: string;
  chapters: number;
}

export interface CharacterProfile {
  id: string;
  name: string;
  role: 'Chính' | 'Phụ' | 'Dẫn chuyện (Narrator)';
  description: string;
  voice: string;
  referenceImage?: {
    base64: string;
    mimeType: string;
  };
}

export interface ScriptFormState {
  theme: string;
  script_style: string;
  script_cameraShots: string[];
  characters: CharacterProfile[];
  scene_type: string[];
  scene_description: string;
  scene_colorPalette: string;
  audio_voice: string;
  audio_music: string;
  audio_sfx_description: string;
  publish_format: string;
  publish_quality: string;
  includeEnglish: boolean;
}

export interface AffiliateFormState {
  productName: string;
  platform: 'TikTok' | 'Reels' | 'Shorts';
  scriptType: 'Review' | 'Unboxing' | 'Drama' | 'Problem/Solution';
  targetAudience: string;
  tone: string;
  productFeatures: string;
}

export interface AffiliateScriptResult {
  scriptText: string;
  masterFlowPrompt: string;
  scenes: ScenePrompt[];
}

export interface VoiceProfile {
  description: string;
  gender: 'male' | 'female' | 'neutral';
  tone: 'low' | 'medium' | 'high';
  speed: 'slow' | 'normal' | 'fast';
  readingNotes: string;
}

export interface StoryData {
  synopsis: string;
  storyText: string;
  voiceProfile: VoiceProfile;
}

export interface ArticleData {
  vietnameseTitle: string;
  englishTitle: string;
  vietnameseArticle: string;
  englishArticle: string;
  socialMediaSummaryVI: string;
  socialMediaSummaryEN: string;
  imagePrompt: string;
}

export interface StoryGenerationResponse {
  story: StoryData;
}

export interface SavedStory {
  id: string;
  createdAt: string;
  formState: StoryFormState;
  synopsis: string;
  storyText: string;
  voiceProfile: VoiceProfile;
}

export interface ScenePrompt {
  scene: number;
  description: string;
  prompt: string;
  action: string;
  dialogue: string;
}

export interface ImageGenerationStatus {
  status: 'idle' | 'generating' | 'completed' | 'failed';
  imageUrl?: string;
  error?: string;
}

export interface VideoGenerationStatus {
  status: 'idle' | 'generating' | 'polling' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  operation?: any;
}

export type AdImageRole = 'product' | 'model' | 'logo' | 'background' | 'none';

export interface AdImageFile {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
  role: AdImageRole;
  isProcessing?: boolean;
}

export interface AdImageFormState {
  files: AdImageFile[];
  prompt: string;
  variations: 1 | 3 | 5;
}

export interface AdSuggestion {
  title: string;
  description: string;
  prompt: string;
}

export interface AdImageResult {
  id: string;
  base64: string;
}

export interface AdImageGenerationStatus {
  status: 'idle' | 'generating' | 'completed' | 'failed';
  results: AdImageResult[];
  error?: string;
}

export interface TetConcept {
  id: string;
  title: string;
  category: string;
  tag: string;
  description: string;
  prompt: string;
  previewColor: string;
}

export type AppMode = 'story' | 'article' | 'script' | 'ad' | 'affiliate' | 'tet_2026' | 'history';
