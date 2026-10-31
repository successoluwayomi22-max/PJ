export type VerificationTier = 'standard' | 'verified_citizen' | 'journalist' | 'news_organization';
export type SystemRole =
  | 'super_admin'
  | 'admin'
  | 'managing_editor'
  | 'editor'
  | 'author'
  | 'contributor'
  | 'reader'
  | 'guest'
  | 'user'
  | 'moderator';

export type UserRole = SystemRole | string;
export type AccountStatus = 'active' | 'warned' | 'suspended' | 'banned';

export type PermissionIdentifier =
  // User Management
  | 'users.view'
  | 'users.view_any'
  | 'users.create'
  | 'users.update'
  | 'users.update_own'
  | 'users.update_any'
  | 'users.suspend'
  | 'users.restore'
  | 'users.delete'
  | 'users.export'
  | 'users.manage_roles'
  // Role Management
  | 'roles.view'
  | 'roles.create'
  | 'roles.update'
  | 'roles.delete'
  | 'roles.assign'
  | 'permissions.view'
  | 'permissions.assign'
  // Article Management
  | 'articles.view'
  | 'articles.view_any'
  | 'articles.create'
  | 'articles.update'
  | 'articles.update_own'
  | 'articles.update_any'
  | 'articles.delete'
  | 'articles.delete_own'
  | 'articles.delete_any'
  | 'articles.submit'
  | 'articles.review'
  | 'articles.approve'
  | 'articles.reject'
  | 'articles.publish'
  | 'articles.unpublish'
  | 'articles.schedule'
  | 'articles.archive'
  | 'articles.restore'
  // Category Management
  | 'categories.view'
  | 'categories.create'
  | 'categories.update'
  | 'categories.delete'
  // Media Management
  | 'media.view'
  | 'media.upload'
  | 'media.update'
  | 'media.delete'
  | 'media.manage_all'
  // Comment Management
  | 'comments.view'
  | 'comments.create'
  | 'comments.update_own'
  | 'comments.delete_own'
  | 'comments.moderate'
  | 'comments.approve'
  | 'comments.reject'
  | 'comments.report'
  // Advertising
  | 'ads.view'
  | 'ads.create'
  | 'ads.update'
  | 'ads.delete'
  | 'ads.publish'
  | 'ads.analytics'
  // Analytics
  | 'analytics.view'
  | 'analytics.view_editorial'
  | 'analytics.view_financial'
  | 'analytics.export'
  // System Settings
  | 'settings.view'
  | 'settings.update'
  | 'settings.security.manage'
  | 'settings.integrations.manage'
  | 'settings.backups.manage'
  // Audit Logs
  | 'audit.view'
  | 'audit.export'
  // Newsletter
  | 'newsletter.view'
  | 'newsletter.manage'
  | 'newsletter.send'
  | 'newsletter.export';

export interface RoleDefinition {
  id: string;
  name: string;
  label: string;
  description: string;
  isSystem: boolean;
  priority: number;
  permissions: PermissionIdentifier[];
  createdAt: string;
  updatedAt: string;
}

export type PostCategory =
  | 'breaking'
  | 'local'
  | 'politics'
  | 'tech'
  | 'science'
  | 'business'
  | 'weather_disaster'
  | 'culture';

export type PostStatus =
  | 'draft'
  | 'pending_review'
  | 'under_review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'rejected'
  | 'revision_requested'
  | 'archived'
  | 'unpublished'
  | 'pinned_breaking'
  | 'disputed'
  | 'removed';

export interface ArticleRevision {
  id: string;
  articleId: string;
  actorId: string;
  previousStatus: PostStatus;
  newStatus: PostStatus;
  transitionNote?: string;
  timestamp: string;
  editorialComments?: string[];
}

export interface EditorialReview {
  id: string;
  articleId: string;
  reviewerId: string;
  decision: 'approve' | 'reject' | 'request_revision';
  feedback: string;
  reviewStartedAt: string;
  reviewCompletedAt: string;
}

export interface AuthorizationResult {
  allowed: boolean;
  statusCode: 200 | 401 | 403 | 404 | 422;
  reason?: string;
  code?: string;
}
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
  password?: string;
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
  logoUrl?: string;
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

export type AuditLogActionType =
  | 'BRANDING_EDIT'
  | 'THEME_CHANGE'
  | 'POST_INLINE_EDIT'
  | 'ALGORITHM_TUNE'
  | 'USER_TRUST_UPDATE'
  | 'MODERATION_ACTION'
  | 'ROLE_CREATED'
  | 'ROLE_UPDATED'
  | 'ROLE_DELETED'
  | 'ROLE_ASSIGNED'
  | 'PERMISSIONS_MODIFIED'
  | 'WORKFLOW_TRANSITION'
  | 'SECURITY_EVENT';

export interface AuditLogEntry {
  id: string;
  adminId: string;
  actionType: AuditLogActionType;
  description: string;
  timestamp: string;
  previousSettings?: Partial<SiteSettings>;
  previousPostState?: NewsPost;
  targetUserId?: string;
  targetResourceId?: string;
  resourceType?: string;
  outcome?: 'SUCCESS' | 'DENIED';
  metadata?: Record<string, unknown>;
  correlationId?: string;
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

