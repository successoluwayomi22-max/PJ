export type VerificationTier = 'standard' | 'verified_citizen' | 'journalist' | 'news_organization';
export type UserRole = 'user' | 'moderator' | 'admin';
export type AccountStatus = 'active' | 'warned' | 'suspended' | 'banned';

export type PostCategory =
  | 'breaking'
  | 'local'
  | 'politics'
  | 'tech'
  | 'science'
  | 'business'
  | 'weather_disaster'
  | 'culture';

export type PostStatus = 'draft' | 'published' | 'pinned_breaking' | 'disputed' | 'removed';
export type MediaType = 'image' | 'video' | 'panorama_360';
export type NoteStatus = 'under_review' | 'rated_helpful' | 'rated_misleading';

export type ThemeMode = 'dark' | 'light';
export type LanguageCode = 'en' | 'es' | 'fr' | 'ar' | 'zh' | 'ja';

export type ActivePage =
  | 'feed'
  | 'gallery'
  | 'local_globe'
  | 'dashboard'
  | 'admin'
  | 'login';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  bio: string;
  location: string;
  role: UserRole;
  status: AccountStatus;
  verificationTier: VerificationTier;
  trustScore: number; // 0.00 to 1.00
  joinedAt: string;
  followersCount: number;
  reportsCount: number;
}

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  durationSeconds?: number;
  aspectRatio?: string;
}

export interface CommentItem {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId?: string | null;
  content: string;
  upvotes: number;
  createdAt: string;
}

export interface CommunityNote {
  id: string;
  postId: string;
  authorId: string;
  noteText: string;
  sourcesCited: string[];
  status: NoteStatus;
  helpfulVotes: number;
  unhelpfulVotes: number;
  createdAt: string;
}

export interface AIForensicsReport {
  authenticityScore: number; // 0 to 100
  exifVerified: boolean;
  gpsWeatherMatch: boolean;
  deepfakeProbability: number; // 0 to 100
  recycledFootageCheck: 'Original Capture' | 'Previously Indexed' | 'Unverified Source';
  deviceSignature: string;
}

export interface NewsPost {
  id: string;
  authorId: string;
  headline: string;
  bodyText: string;
  aiSummary: string[];
  translations?: Partial<Record<LanguageCode, { headline: string; bodyText: string }>>;
  category: PostCategory;
  status: PostStatus;
  tags: string[];
  isEyewitness: boolean;
  isBreakingPinned: boolean;
  externalSourceUrl?: string;
  locationName: string;
  latitude: number;
  longitude: number;
  privacyLevel: 'exact' | 'city';
  media: MediaItem[];
  upvotes: number;
  downvotes: number;
  commentCount: number;
  viewCount: number;
  shareCount: number;
  velocityPer15m: number; // recent views/comments surge
  createdAt: string; // ISO string
  forensics: AIForensicsReport;
}

export interface AlgorithmWeights {
  eyewitnessBoost: number; // default 1.5
  trustMultiplierWeight: number; // default 2.0
  velocityWeight: number; // default 1.2
  timeDecayGravity: number; // default 1.8
}

export interface ThemeConfig {
  mode: ThemeMode;
  presetId: string;
  primaryColor: string;
  secondaryAiColor: string;
  breakingAlertColor: string;
  darkBgCanvas: string;
  darkBgCard: string;
  lightBgCanvas: string;
  lightBgCard: string;
  glassBlurPx: number;
  tilt3DIntensity: number;
  enable3DGlobe: boolean;
  enable3DTiltCards: boolean;
  fontStyle: 'editorial' | 'modern' | 'tech';
}

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  logoEmblem: 'globe' | 'atom' | 'pulse' | 'shield';
  breakingBannerText: string;
  theme: ThemeConfig;
  algorithm: AlgorithmWeights;
  features: {
    maintenanceLockdown: boolean;
    aiAutoSummary: boolean;
    aiMediaForensics: boolean;
    godModeInlineEdit: boolean;
    autoTranslateForeign: boolean;
  };
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  actionType: 'BRANDING_EDIT' | 'THEME_CHANGE' | 'POST_INLINE_EDIT' | 'ALGORITHM_TUNE' | 'USER_TRUST_UPDATE' | 'MODERATION_ACTION';
  description: string;
  timestamp: string;
  previousSettings?: Partial<SiteSettings>;
  previousPostState?: NewsPost;
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'AI' | 'WARN' | 'HEAP' | 'SECURITY';
  message: string;
  latencyMs?: number;
}

export interface TelemetrySnapshot {
  nodeVersion: string;
  platform: string;
  cpuModel: string;
  cpuCores: number;
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  externalMb: number;
  arrayBuffersMb: number;
  systemTotalMb: number;
  systemFreeMb: number;
  uptimeSeconds: number;
  eventLoopLagMs: number;
  apiP95LatencyMs: number;
  cacheHitRatio: number;
  loadAvg: number;
  logs: TelemetryLog[];
  timestamp: string;
}

