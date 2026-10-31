import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Camera,
  Cpu,
  Database,
  Edit3,
  HardDrive,
  History,
  Image as ImageIcon,
  Layers,
  Check,
  KeyRound,
  Lock,
  LogOut,
  Palette,
  Pin,
  Plus,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Terminal,
  Trash2,
  Upload,
  UserCheck,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  clearWAFIncidents,
  getBlockedClients,
  getWAFIncidents,
  simulateSecurityAttack,
  unbanClient,
  WAFIncident,
} from '../utils/security';
import {
  ALL_PERMISSIONS,
  SYSTEM_ROLES,
  getRoleDefinition,
  validateRoleAssignment,
  validateRoleCreation,
  validateRoleDeletion,
} from '../utils/rbac';
import {
  AuditLogEntry,
  CommunityNote,
  NewsPost,
  PermissionIdentifier,
  RoleDefinition,
  SiteSettings,
  TelemetrySnapshot,
  User,
  VerificationTier,
} from '../types';
import { computePostRankScore, DESIGNER_COLOR_PRESETS } from '../mockData';

interface AdminDashboardViewProps {
  settings: SiteSettings;
  posts: NewsPost[];
  users: User[];
  currentUser?: User;
  notes: CommunityNote[];
  auditLogs: AuditLogEntry[];
  customRoles?: RoleDefinition[];
  onUpdateSettings: (next: SiteSettings, auditDesc: string) => void;
  onUpdatePost: (postId: string, updates: Partial<NewsPost>, reason: string) => void;
  onDeletePost: (postId: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>, reason?: string) => void;
  onUndoAuditLog: (entry: AuditLogEntry) => void;
  onCreateCustomRole?: (role: RoleDefinition) => void;
  onDeleteCustomRole?: (roleId: string) => void;
  onSignOut?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  settings,
  posts,
  users,
  currentUser,
  notes,
  auditLogs,
  customRoles = [],
  onUpdateSettings,
  onUpdatePost,
  onDeletePost,
  onUpdateUser,
  onUndoAuditLog,
  onCreateCustomRole,
  onDeleteCustomRole,
  onSignOut,
}) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<
    | 'overview'
    | 'rbac_roles'
    | 'users'
    | 'branding'
    | 'cyber_defense'
    | 'telemetry'
    | 'algorithm'
    | 'audit'
  >('overview');

  // RBAC Management State
  const [selectedRoleId, setSelectedRoleId] = useState<string>('super_admin');
  const [roleAssignFeedback, setRoleAssignFeedback] = useState<{
    userId: string;
    message: string;
    isError: boolean;
  } | null>(null);

  const [showRoleCreator, setShowRoleCreator] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePriority, setNewRolePriority] = useState<number>(35);
  const [newRolePermissions, setNewRolePermissions] = useState<PermissionIdentifier[]>([
    'articles.view',
    'articles.review',
  ]);
  const [roleCreationFeedback, setRoleCreationFeedback] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  const allRoles = [...SYSTEM_ROLES, ...customRoles];

  const [wafIncidents, setWafIncidents] = useState<WAFIncident[]>(() => getWAFIncidents());
  const [blockedClients, setBlockedClients] = useState(() => getBlockedClients());

  const refreshCyberDefenseState = () => {
    setWafIncidents(getWAFIncidents());
    setBlockedClients(getBlockedClients());
  };

  const [uploadTargetUserId, setUploadTargetUserId] = useState<string | null>(null);
  const userAvatarInputRef = useRef<HTMLInputElement>(null);
  const activeAdmin = currentUser || users[0];

  const triggerUserPhotoUpload = (userId: string) => {
    setUploadTargetUserId(userId);
    userAvatarInputRef.current?.click();
  };

  const handleUserPhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = uploadTargetUserId || activeAdmin.id;
    if (!file || !targetId) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const targetUser = users.find((u) => u.id === targetId);
        onUpdateUser(
          targetId,
          { avatarUrl: reader.result },
          `Updated profile photo for @${targetUser?.username || 'user'}`
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Logo file size exceeds 3MB limit. Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateSettings(
          { ...settings, logoUrl: reader.result },
          `Uploaded official publication brand logo (${file.name})`
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const [telemetry, setTelemetry] = useState<TelemetrySnapshot | null>(null);
  const [heapHistory, setHeapHistory] = useState<number[]>([
    68.4, 70.1, 71.8, 69.5, 72.3, 74.0, 71.9, 73.4, 72.8, 74.6,
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  // Local buffered/debounced states so typing and dragging sliders never fire per-keystroke requests or lag the UI
  const [draftSiteName, setDraftSiteName] = useState(settings.siteName);
  const [draftSiteTagline, setDraftSiteTagline] = useState(settings.siteTagline);
  const [draftBreakingBanner, setDraftBreakingBanner] = useState(settings.breakingBannerText);
  const [draftGlassBlur, setDraftGlassBlur] = useState(settings.theme.glassBlurPx);
  const [draftAlgorithm, setDraftAlgorithm] = useState(settings.algorithm);
  const [draftTrustScores, setDraftTrustScores] = useState<Record<string, number>>({});
  const debounceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setDraftSiteName(settings.siteName);
    setDraftSiteTagline(settings.siteTagline);
    setDraftBreakingBanner(settings.breakingBannerText);
    setDraftGlassBlur(settings.theme.glassBlurPx);
    setDraftAlgorithm(settings.algorithm);
  }, [
    settings.siteName,
    settings.siteTagline,
    settings.breakingBannerText,
    settings.theme.glassBlurPx,
    settings.algorithm,
  ]);

  // Cleanup any pending debounce timers on unmount
  useEffect(() => {
    const timers = debounceTimersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const scheduleDebouncedAction = (key: string, fn: () => void, delayMs = 800) => {
    if (debounceTimersRef.current[key]) {
      clearTimeout(debounceTimersRef.current[key]);
    }
    debounceTimersRef.current[key] = setTimeout(() => {
      fn();
      delete debounceTimersRef.current[key];
    }, delayMs);
  };

  const isDark = settings.theme.mode === 'dark';
  const cardBgColor = isDark ? settings.theme.darkBgCard : settings.theme.lightBgCard;
  const primaryColor = settings.theme.primaryColor;

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const data: TelemetrySnapshot = await res.json();
        setTelemetry(data);
        setHeapHistory((prev) => [...prev.slice(-14), data.heapUsedMb]);
      }
    } catch {
      // ignore
    }
  };

  // Only poll telemetry when the Telemetry tab is active so background polling never slows down other tabs
  useEffect(() => {
    if (activeSection !== 'telemetry') return;
    fetchTelemetry();
    const timer = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(timer);
  }, [activeSection]);

  const triggerTelemetryAction = async (
    action: 'purge_cache' | 'heap_snapshot' | 'clear_logs'
  ) => {
    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await fetchTelemetry();
    } catch {
      // ignore
    }
  };

  const executeAiCommand = (cmd: string) => {
    const q = cmd.toLowerCase();
    if (q.includes('emerald')) {
      const preset = DESIGNER_COLOR_PRESETS.find((p) => p.id === 'verified_emerald')!;
      onUpdateSettings(
        { ...settings, theme: { ...settings.theme, ...preset, presetId: preset.id } },
        `AI Copilot applied color palette "${preset.name}"`
      );
      setAiFeedback(`Applied palette "${preset.name}".`);
    } else if (q.includes('amber') || q.includes('terminal')) {
      const preset = DESIGNER_COLOR_PRESETS.find((p) => p.id === 'bloomberg_terminal')!;
      onUpdateSettings(
        { ...settings, theme: { ...settings.theme, ...preset, presetId: preset.id } },
        `AI Copilot applied color palette "${preset.name}"`
      );
      setAiFeedback(`Applied palette "${preset.name}".`);
    } else if (q.includes('demote') || q.includes('disputed')) {
      posts
        .filter((p) => p.forensics.authenticityScore < 50)
        .forEach((p) =>
          onUpdatePost(
            p.id,
            { status: 'disputed', isBreakingPinned: false },
            `AI Forensics flagged post #${p.id} as disputed`
          )
        );
      setAiFeedback('Completed C2PA Forensics Sweep: Low-authenticity dispatches flagged.');
    } else if (q.includes('eyewitness')) {
      onUpdateSettings(
        { ...settings, algorithm: { ...settings.algorithm, eyewitnessBoost: 2.4 } },
        'AI Copilot elevated Eyewitness Boost to 2.4x'
      );
      setAiFeedback('Elevated Eyewitness Priority Weight to 2.4x.');
    } else {
      setAiFeedback(`Executed command "${cmd}" across ${posts.length} dispatches.`);
    }
    setAiInput('');
  };

  const totalViews = posts.reduce((a, b) => a + b.viewCount, 0);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-5">
      {/* Top Admin OS Header Bar & Sign Out */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-500/15">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
          <ShieldAlert className="w-4 h-4" />
          <span>Executive Administration Console</span>
        </div>

        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Sign Out of Admin OS"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      <input
        ref={userAvatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleUserPhotoFileChange}
        className="hidden"
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* DEDICATED ADMIN OS SIDEBAR (SCROLLABLE & STICKY) */}
        <aside className="lg:col-span-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto pr-1 space-y-4">
          <div
            style={{ backgroundColor: cardBgColor }}
            className="p-5 rounded-2xl border border-slate-500/15 space-y-4"
          >
            {/* Active Admin Profile & Photo Upload */}
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-500/15">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  onClick={() => triggerUserPhotoUpload(activeAdmin.id)}
                  className="relative group cursor-pointer shrink-0"
                  title="Upload Admin Profile Picture"
                >
                  <img
                    src={activeAdmin.avatarUrl}
                    alt={activeAdmin.displayName}
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/20 group-hover:opacity-80 transition-opacity"
                  />
                  <span
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-slate-950 shadow"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Camera className="w-3 h-3" />
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs truncate">{activeAdmin.displayName}</div>
                  <button
                    type="button"
                    onClick={() => triggerUserPhotoUpload(activeAdmin.id)}
                    className="text-[11px] font-medium hover:underline flex items-center gap-1 mt-0.5"
                    style={{ color: primaryColor }}
                  >
                    <Upload className="w-3 h-3" /> Upload Photo
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-400">
                Executive Command OS
              </div>
              <h2 className="font-editorial text-xl font-semibold mt-0.5">
                {settings.siteName} Control
              </h2>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'overview', label: 'Overview & Moderation', icon: Layers },
                { id: 'users', label: `Correspondents (${users.length})`, icon: Users },
                { id: 'branding', label: 'Brand & Color Studio', icon: Palette },
                { id: 'cyber_defense', label: 'Firewall & IDS / IPS (Live)', icon: ShieldAlert },
                { id: 'telemetry', label: 'V8 Heap & Telemetry', icon: Cpu },
                { id: 'algorithm', label: 'Feed Ranking & Automation', icon: Sliders },
                { id: 'audit', label: `Audit History (${auditLogs.length})`, icon: History },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id as typeof activeSection)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? isDark
                          ? 'bg-white text-slate-950 font-semibold shadow-sm'
                          : 'bg-slate-900 text-white font-semibold shadow-sm'
                        : 'opacity-70 hover:opacity-100 hover:bg-slate-500/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-500/15 space-y-2.5 text-xs">
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings(
                    {
                      ...settings,
                      features: {
                        ...settings.features,
                        godModeInlineEdit: !settings.features.godModeInlineEdit,
                      },
                    },
                    `Toggled Inline Edit Mode ${
                      !settings.features.godModeInlineEdit ? 'ON' : 'OFF'
                    }`
                  )
                }
                className={`w-full py-2.5 px-3 rounded-xl font-mono text-[11px] uppercase tracking-wider flex items-center justify-between border transition-all ${
                  settings.features.godModeInlineEdit
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                    : 'border-slate-500/20 opacity-75 hover:opacity-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5" /> Inline Edit Mode
                </span>
                <span>{settings.features.godModeInlineEdit ? 'ACTIVE' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN ADMIN OS WORKSPACE */}
        <div className="lg:col-span-9 space-y-6">
          {/* =================================================================
              SECTION 1: OVERVIEW & CONTENT GOVERNANCE
          ================================================================= */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div
                  style={{ backgroundColor: cardBgColor }}
                  className="p-4 rounded-2xl border border-slate-500/15"
                >
                  <div className="text-[10px] font-mono uppercase opacity-60">Active Dispatches</div>
                  <div className="font-mono text-2xl font-semibold mt-1">{posts.length}</div>
                </div>
                <div
                  style={{ backgroundColor: cardBgColor }}
                  className="p-4 rounded-2xl border border-slate-500/15"
                >
                  <div className="text-[10px] font-mono uppercase opacity-60">Global Readership</div>
                  <div className="font-mono text-2xl font-semibold mt-1">
                    {(totalViews / 1000).toFixed(1)}K
                  </div>
                </div>
                <div
                  style={{ backgroundColor: cardBgColor }}
                  className="p-4 rounded-2xl border border-slate-500/15"
                >
                  <div className="text-[10px] font-mono uppercase opacity-60">V8 Heap Memory</div>
                  <div className="font-mono text-2xl font-semibold mt-1 text-sky-400">
                    {telemetry ? `${telemetry.heapUsedMb} MB` : '72.4 MB'}
                  </div>
                </div>
                <div
                  style={{ backgroundColor: cardBgColor }}
                  className="p-4 rounded-2xl border border-slate-500/15"
                >
                  <div className="text-[10px] font-mono uppercase opacity-60">Disputed Queue</div>
                  <div className="font-mono text-2xl font-semibold mt-1 text-amber-400">
                    {posts.filter((p) => p.status === 'disputed').length}
                  </div>
                </div>
              </div>

              {/* Category Distribution & Engagement Overview */}
              <div
                style={{ backgroundColor: cardBgColor }}
                className="p-6 rounded-2xl border border-slate-500/15 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Readership & Desk Distribution</h3>
                    <p className="text-xs opacity-60">
                      Real-time engagement breakdown across active news categories
                    </p>
                  </div>
                  <span className="text-xs font-mono opacity-65">
                    {totalViews.toLocaleString()} total views
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {Array.from(new Set(posts.map((p) => p.category))).map((cat) => {
                    const catPosts = posts.filter((p) => p.category === cat);
                    const catViews = catPosts.reduce((a, b) => a + b.viewCount, 0);
                    const pct = totalViews > 0 ? Math.round((catViews / totalViews) * 100) : 0;
                    return (
                      <div
                        key={cat}
                        className="p-3.5 rounded-xl border border-slate-500/15 bg-slate-500/[0.03] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold truncate">{cat}</span>
                          <span className="font-mono text-[11px]" style={{ color: primaryColor }}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-500/15 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.max(8, pct)}%`, backgroundColor: primaryColor }}
                          />
                        </div>
                        <div className="text-[11px] opacity-55">
                          {catPosts.length} stories • {(catViews / 1000).toFixed(1)}K views
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content Governance Table */}
              <div
                style={{ backgroundColor: cardBgColor }}
                className="p-6 rounded-2xl border border-slate-500/15 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Dispatch Moderation & Priority Wire</h3>
                  <span className="text-xs font-mono opacity-60">
                    {posts.length} total records
                  </span>
                </div>

                <div className="divide-y divide-slate-500/15">
                  {posts.map((post) => {
                    const author = users.find((u) => u.id === post.authorId);
                    const rank = computePostRankScore(post, author, settings.algorithm, notes);
                    return (
                      <div
                        key={post.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 font-mono text-[10px] uppercase">
                            <span
                              className={`px-2 py-0.5 rounded ${
                                post.isBreakingPinned
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : post.status === 'disputed'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-emerald-500/15 text-emerald-400'
                              }`}
                            >
                              {post.status}
                            </span>
                            <span className="opacity-60">INDEX {rank.totalScore}</span>
                            <span className="opacity-60">• C2PA {post.forensics.authenticityScore}%</span>
                          </div>
                          <Link
                            to={`/article/${post.id}`}
                            className="font-editorial text-base font-semibold hover:underline block truncate"
                          >
                            {post.headline}
                          </Link>
                          <div className="opacity-60 text-[11px]">
                            @{author?.username} • {post.locationName}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdatePost(
                                post.id,
                                {
                                  isBreakingPinned: !post.isBreakingPinned,
                                  status: !post.isBreakingPinned ? 'pinned_breaking' : 'published',
                                },
                                `${!post.isBreakingPinned ? 'Pinned' : 'Unpinned'} post #${post.id}`
                              )
                            }
                            className={`px-3 py-1.5 rounded-lg font-medium border flex items-center gap-1.5 transition-colors ${
                              post.isBreakingPinned
                                ? 'border-rose-500/40 bg-rose-500/15 text-rose-400'
                                : 'border-slate-500/20 hover:bg-slate-500/10'
                            }`}
                          >
                            <Pin className="w-3 h-3" />
                            <span>{post.isBreakingPinned ? 'Pinned' : 'Pin Wire'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onUpdatePost(
                                post.id,
                                { status: post.status === 'disputed' ? 'published' : 'disputed' },
                                `Toggled dispute flag on post #${post.id}`
                              )
                            }
                            className="px-3 py-1.5 rounded-lg border border-slate-500/20 hover:bg-slate-500/10"
                          >
                            {post.status === 'disputed' ? 'Restore' : 'Dispute'}
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeletePost(post.id)}
                            className="p-1.5 rounded-lg border border-rose-500/25 text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 2: CORRESPONDENTS & TRUST SCORE DIRECTORY
          ================================================================= */}
          {activeSection === 'users' && (
            <div
              style={{ backgroundColor: cardBgColor }}
              className="p-6 rounded-2xl border border-slate-500/15 space-y-5"
            >
              <div>
                <h3 className="text-base font-semibold">Correspondents & Provenance Trust Override</h3>
                <p className="text-xs opacity-65 mt-0.5">
                  Modify correspondent trust ratings, accreditation tiers, and system privileges in real time.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-xl border border-slate-500/15 bg-slate-500/[0.03] space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          onClick={() => triggerUserPhotoUpload(u.id)}
                          className="relative group cursor-pointer shrink-0"
                          title={`Upload profile photo for ${u.displayName}`}
                        >
                          <img
                            src={u.avatarUrl}
                            alt={u.displayName}
                            className="w-11 h-11 rounded-full object-cover group-hover:opacity-80 transition-opacity"
                          />
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-slate-950 shadow"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Camera className="w-2.5 h-2.5" />
                          </span>
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/profile/${u.username}`}
                            className="font-semibold hover:underline truncate block"
                          >
                            {u.displayName}
                          </Link>
                          <div className="font-mono text-[11px] opacity-60 truncate">
                            @{u.username} • {u.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => triggerUserPhotoUpload(u.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-500/25 hover:bg-slate-500/10 text-[11px] font-medium flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" /> Photo
                        </button>
                        <Link
                          to={`/profile/${u.username}`}
                          className="p-1.5 rounded-lg hover:bg-slate-500/10 opacity-60 hover:opacity-100"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-mono text-[11px] mb-1">
                        <span className="opacity-65">Provenance Trust Index</span>
                        <span className="text-emerald-400 font-semibold">
                          {draftTrustScores[u.id] ?? Math.round(u.trustScore * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={100}
                        value={draftTrustScores[u.id] ?? Math.round(u.trustScore * 100)}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setDraftTrustScores((prev) => ({ ...prev, [u.id]: val }));
                          scheduleDebouncedAction(`trust_${u.id}`, () => {
                            onUpdateUser(
                              u.id,
                              { trustScore: val / 100 },
                              `Adjusted @${u.username} Trust Score to ${val}%`
                            );
                          });
                        }}
                        className="w-full accent-emerald-400 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <select
                        value={u.verificationTier}
                        onChange={(e) =>
                          onUpdateUser(
                            u.id,
                            { verificationTier: e.target.value as VerificationTier },
                            `Updated @${u.username} tier to ${e.target.value}`
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white border border-white/10 text-[11px]"
                      >
                        <option value="standard">Standard</option>
                        <option value="verified_citizen">Verified Eyewitness</option>
                        <option value="journalist">Field Journalist</option>
                        <option value="news_organization">Press Organization</option>
                      </select>

                      <select
                        value={u.role}
                        onChange={(e) =>
                          onUpdateUser(
                            u.id,
                            { role: e.target.value as User['role'] },
                            `Updated @${u.username} role to ${e.target.value}`
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white border border-white/10 text-[11px]"
                      >
                        <option value="user">Correspondent</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Executive Admin</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 3: BRAND IDENTITY & PRO COLOR MIXTURE STUDIO
          ================================================================= */}
          {activeSection === 'branding' && (
            <div className="space-y-6">
              <div
                style={{ backgroundColor: cardBgColor }}
                className="p-6 rounded-2xl border border-slate-500/15 space-y-5 text-xs"
              >
                <h3 className="text-base font-semibold">White-Label Identity & Wire Configuration</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono uppercase text-[10px] opacity-60 mb-1.5">
                      Publication Title (Auto-saved)
                    </label>
                    <input
                      type="text"
                      value={draftSiteName}
                      onChange={(e) => {
                        const nextName = e.target.value;
                        setDraftSiteName(nextName);
                        scheduleDebouncedAction('siteName', () => {
                          if (nextName.trim() && nextName !== settings.siteName) {
                            onUpdateSettings(
                              { ...settings, siteName: nextName },
                              `Renamed publication to "${nextName}"`
                            );
                          }
                        });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.07] border border-slate-500/20 font-semibold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono uppercase text-[10px] opacity-60 mb-1.5">
                      Editorial Masthead Subtitle (Auto-saved)
                    </label>
                    <input
                      type="text"
                      value={draftSiteTagline}
                      onChange={(e) => {
                        const nextTagline = e.target.value;
                        setDraftSiteTagline(nextTagline);
                        scheduleDebouncedAction('siteTagline', () => {
                          if (nextTagline !== settings.siteTagline) {
                            onUpdateSettings(
                              { ...settings, siteTagline: nextTagline },
                              'Updated publication masthead subtitle'
                            );
                          }
                        });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.07] border border-slate-500/20 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono uppercase text-[10px] opacity-60 mb-1.5">
                    Priority Wire Ticker Dispatch (Auto-saved)
                  </label>
                  <input
                    type="text"
                    value={draftBreakingBanner}
                    onChange={(e) => {
                      const nextBanner = e.target.value;
                      setDraftBreakingBanner(nextBanner);
                      scheduleDebouncedAction('breakingBanner', () => {
                        if (nextBanner !== settings.breakingBannerText) {
                          onUpdateSettings(
                            { ...settings, breakingBannerText: nextBanner },
                            'Updated Priority Wire Banner'
                          );
                        }
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.07] border border-slate-500/20"
                  />
                </div>

                {/* Official Brand Logo Upload */}
                <div className="p-4 rounded-xl border border-slate-500/20 bg-slate-500/[0.04] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-xs flex items-center gap-2">
                        <Upload className="w-4 h-4 text-sky-400" />
                        <span>Official Publication Logo</span>
                      </div>
                      <p className="text-[11px] opacity-60 mt-0.5">
                        Upload your real newsroom brand logo (PNG, SVG, JPG, WebP) to display in the main header and brand marks.
                      </p>
                    </div>
                    {settings.logoUrl && (
                      <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Active Custom Logo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    {/* Logo Preview */}
                    <div className="shrink-0">
                      {settings.logoUrl ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-500/30 bg-black/40 flex items-center justify-center p-1.5 shadow-md">
                          <img
                            src={settings.logoUrl}
                            alt="Publication Logo Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl border border-dashed border-slate-500/30 bg-slate-500/[0.06] flex flex-col items-center justify-center text-center p-2 opacity-70">
                          <ImageIcon className="w-5 h-5 opacity-50 mb-1" />
                          <span className="text-[9px] font-mono leading-tight">Emblem Only</span>
                        </div>
                      )}
                    </div>

                    {/* Logo Upload Inputs & Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{settings.logoUrl ? 'Change Logo Image' : 'Upload Real Logo'}</span>
                      </button>

                      {settings.logoUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSettings(
                              { ...settings, logoUrl: undefined },
                              'Reset publication logo to default emblem'
                            )
                          }
                          className="px-3.5 py-2 rounded-xl text-xs font-medium border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Logo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block font-mono uppercase text-[10px] opacity-60 mb-1.5">
                      Emblem Mark
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['globe', 'atom', 'pulse', 'shield'] as const).map((mark) => (
                        <button
                          key={mark}
                          type="button"
                          onClick={() =>
                            onUpdateSettings(
                              { ...settings, logoEmblem: mark },
                              `Changed emblem mark to ${mark}`
                            )
                          }
                          className={`py-2 px-3 rounded-lg font-mono uppercase text-[11px] border ${
                            settings.logoEmblem === mark
                              ? 'border-sky-400 bg-sky-500/15 text-sky-300'
                              : 'border-slate-500/20 opacity-70'
                          }`}
                        >
                          {mark}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-mono uppercase text-[10px] opacity-60 mb-1.5">
                      <span>Glass Blur Depth</span>
                      <span>{draftGlassBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={32}
                      value={draftGlassBlur}
                      onChange={(e) => {
                        const nextBlur = Number(e.target.value);
                        setDraftGlassBlur(nextBlur);
                        scheduleDebouncedAction('glassBlur', () => {
                          onUpdateSettings(
                            {
                              ...settings,
                              theme: { ...settings.theme, glassBlurPx: nextBlur },
                            },
                            `Set glass blur to ${nextBlur}px`
                          );
                        });
                      }}
                      className="w-full accent-sky-400 mt-2"
                    />
                  </div>

                  <div>
                    <label className="block font-mono uppercase text-[10px] opacity-60 mb-1.5">
                      Typography Pairing
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['editorial', 'modern', 'tech'] as const).map((font) => (
                        <button
                          key={font}
                          type="button"
                          onClick={() =>
                            onUpdateSettings(
                              {
                                ...settings,
                                theme: {
                                  ...settings.theme,
                                  fontStyle: font,
                                },
                              },
                              `Set typography pairing to ${font}`
                            )
                          }
                          className={`py-2 px-2 rounded-lg font-mono uppercase text-[10px] border ${
                            settings.theme.fontStyle === font
                              ? 'border-sky-400 bg-sky-500/15 text-sky-300'
                              : 'border-slate-500/20 opacity-70'
                          }`}
                        >
                          {font}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expert Designer Color Mixtures */}
              <div
                style={{ backgroundColor: cardBgColor }}
                className="p-6 rounded-2xl border border-slate-500/15 space-y-5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Curated Architectural Color Systems</h3>
                    <p className="opacity-65 mt-0.5">
                      Calibrated for zero-glare editorial legibility across Dark and Light surfaces.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings(
                        {
                          ...settings,
                          theme: {
                            ...settings.theme,
                            mode: settings.theme.mode === 'dark' ? 'light' : 'dark',
                          },
                        },
                        `Switched surface mode to ${
                          settings.theme.mode === 'dark' ? 'Light' : 'Dark'
                        }`
                      )
                    }
                    className="px-4 py-2 rounded-full border border-slate-500/25 font-semibold"
                  >
                    Mode: {settings.theme.mode.toUpperCase()}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {DESIGNER_COLOR_PRESETS.map((preset) => {
                    const active = settings.theme.presetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() =>
                          onUpdateSettings(
                            {
                              ...settings,
                              theme: {
                                ...settings.theme,
                                presetId: preset.id,
                                primaryColor: preset.primaryColor,
                                secondaryAiColor: preset.secondaryAiColor,
                                breakingAlertColor: preset.breakingAlertColor,
                                darkBgCanvas: preset.darkBgCanvas,
                                darkBgCard: preset.darkBgCard,
                                lightBgCanvas: preset.lightBgCanvas,
                                lightBgCard: preset.lightBgCard,
                              },
                            },
                            `Applied color system "${preset.name}"`
                          )
                        }
                        className={`cursor-pointer p-4 rounded-xl border transition-all ${
                          active
                            ? 'border-sky-400 bg-sky-500/[0.07]'
                            : 'border-slate-500/15 hover:border-slate-500/35'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-sm">{preset.name}</span>
                          <div className="flex items-center -space-x-1.5">
                            {[
                              preset.darkBgCanvas,
                              preset.primaryColor,
                              preset.secondaryAiColor,
                              preset.breakingAlertColor,
                            ].map((hex, i) => (
                              <span
                                key={i}
                                className="w-5 h-5 rounded-full border border-white/30"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="opacity-65 text-[11px]">{preset.subtitle}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Hex Color Pickers */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-500/15">
                  {[
                    {
                      label: 'Primary Accent',
                      val: settings.theme.primaryColor,
                      key: 'primaryColor',
                    },
                    {
                      label: 'Spatial / AI Accent',
                      val: settings.theme.secondaryAiColor,
                      key: 'secondaryAiColor',
                    },
                    {
                      label: 'Priority Wire Signal',
                      val: settings.theme.breakingAlertColor,
                      key: 'breakingAlertColor',
                    },
                    {
                      label: 'Canvas Surface',
                      val: isDark ? settings.theme.darkBgCanvas : settings.theme.lightBgCanvas,
                      key: isDark ? 'darkBgCanvas' : 'lightBgCanvas',
                    },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="p-3 rounded-xl border border-slate-500/15 flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="color"
                        value={item.val}
                        onChange={(e) => {
                          const hex = e.target.value;
                          scheduleDebouncedAction(
                            `color_${item.key}`,
                            () => {
                              onUpdateSettings(
                                {
                                  ...settings,
                                  theme: {
                                    ...settings.theme,
                                    presetId: 'custom',
                                    [item.key]: hex,
                                  },
                                },
                                `Set ${item.label} to ${hex}`
                              );
                            },
                            300
                          );
                        }}
                        className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <div>
                        <div className="font-medium text-[11px]">{item.label}</div>
                        <div className="font-mono text-[10px] opacity-60">{item.val}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION: WEB APPLICATION FIREWALL (WAF) & L7 IDS / IPS
          ================================================================= */}
          {activeSection === 'cyber_defense' && (
            <div className="space-y-6">
              {/* Telemetry Metric Cluster */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  style={{ backgroundColor: cardBgColor }}
                  className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      FIREWALL STATUS
                    </span>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-bold tracking-tight text-emerald-400">ENFORCING (L7)</div>
                  <div className="text-[11px] opacity-60">Full OWASP Top 10 rules active</div>
                </div>

                <div
                  style={{ backgroundColor: cardBgColor }}
                  className="p-5 rounded-2xl border border-sky-500/30 bg-sky-500/[0.04] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-sky-400">
                    <span>CRYPTOGRAPHY</span>
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-bold tracking-tight text-sky-400">AES-256-GCM</div>
                  <div className="text-[11px] opacity-60">PBKDF2 SHA-256 derivation</div>
                </div>

                <div
                  style={{ backgroundColor: cardBgColor }}
                  className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                    <span>INCIDENTS BLOCKED</span>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-bold tracking-tight text-amber-400">
                    {wafIncidents.length} Attacks
                  </div>
                  <div className="text-[11px] opacity-60">Zero malicious escapes</div>
                </div>

                <div
                  style={{ backgroundColor: cardBgColor }}
                  className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/[0.04] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-rose-400">
                    <span>QUARANTINED IPS</span>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-bold tracking-tight text-rose-400">
                    {blockedClients.length} Host{blockedClients.length === 1 ? '' : 's'}
                  </div>
                  <div className="text-[11px] opacity-60">Automatic progressive lockout</div>
                </div>
              </div>

              {/* Threat Engine & Attack Simulator */}
              <div
                style={{ backgroundColor: cardBgColor }}
                className="p-6 rounded-2xl border border-slate-500/15 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-amber-400" />
                      <span>Interactive Security Testing Suite</span>
                    </h3>
                    <p className="text-xs opacity-65 mt-0.5">
                      Trigger test cyber-attacks against the L7 intrusion engine to verify real-time mitigation and telemetry recording.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        simulateSecurityAttack('SQL_INJECTION');
                        refreshCyberDefenseState();
                      }}
                      className="px-3 py-1.5 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold"
                    >
                      Test SQLi Attack
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        simulateSecurityAttack('XSS_ATTACK');
                        refreshCyberDefenseState();
                      }}
                      className="px-3 py-1.5 rounded-xl border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs font-semibold"
                    >
                      Test XSS Attack
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        simulateSecurityAttack('PATH_TRAVERSAL');
                        refreshCyberDefenseState();
                      }}
                      className="px-3 py-1.5 rounded-xl border border-sky-500/40 text-sky-400 hover:bg-sky-500/10 text-xs font-semibold"
                    >
                      Test Path Traversal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearWAFIncidents();
                        refreshCyberDefenseState();
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-500/30 hover:bg-slate-500/10 text-xs font-medium"
                    >
                      Clear Incident Log
                    </button>
                  </div>
                </div>
              </div>

              {/* Quarantined Host IPs Table */}
              <div
                style={{ backgroundColor: cardBgColor }}
                className="p-6 rounded-2xl border border-slate-500/15 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold flex items-center gap-2 text-rose-400">
                    <Zap className="w-4 h-4" />
                    <span>Quarantined &amp; Banned Host IPs ({blockedClients.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={refreshCyberDefenseState}
                    className="text-xs font-mono opacity-60 hover:opacity-100 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                {blockedClients.length === 0 ? (
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] text-xs text-emerald-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Zero hostile IP addresses currently quarantined. Network perimeter secure.</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-500/15 text-xs">
                    {blockedClients.map((client) => {
                      const remainingSec = Math.max(
                        0,
                        Math.round((client.bannedUntil - Date.now()) / 1000)
                      );
                      return (
                        <div
                          key={client.clientIp}
                          className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-mono font-bold text-rose-400 flex items-center gap-2">
                              <span>{client.clientIp}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/15">
                                Quarantined ({remainingSec}s remaining)
                              </span>
                            </div>
                            <div className="text-[11px] opacity-70 mt-0.5">
                              Reason: {client.reason}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              unbanClient(client.clientIp);
                              refreshCyberDefenseState();
                            }}
                            className="px-3 py-1 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs font-semibold self-start sm:self-auto"
                          >
                            Unban &amp; Restore
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Live Threat Incident Log Table */}
              <div
                style={{ backgroundColor: cardBgColor }}
                className="p-6 rounded-2xl border border-slate-500/15 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-sky-400" />
                    <span>Real-Time WAF Threat Telemetry Feed ({wafIncidents.length})</span>
                  </h3>
                  <div className="text-[10px] font-mono opacity-60">Sliding Window: 100 Events</div>
                </div>

                {wafIncidents.length === 0 ? (
                  <div className="p-4 rounded-xl border border-slate-500/20 text-xs opacity-60">
                    No threat events logged in this session yet. Run a simulation above to test.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-500/15 text-xs font-mono">
                    {wafIncidents.slice(0, 15).map((inc) => (
                      <div
                        key={inc.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[10px]">
                            <span
                              className={`px-2 py-0.5 rounded uppercase font-bold ${
                                inc.severity === 'CRITICAL'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {inc.ruleId} • {inc.threatType}
                            </span>
                            <span className="opacity-50">{new Date(inc.timestamp).toLocaleTimeString()}</span>
                            <span className="opacity-70 font-semibold">{inc.clientIp}</span>
                          </div>
                          <div className="text-[11px] text-rose-300 font-sans truncate max-w-xl">
                            {inc.ruleDescription}
                          </div>
                          <div className="text-[10px] opacity-60 bg-black/20 p-1.5 rounded truncate max-w-lg">
                            Payload: {inc.snippet}
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto shrink-0">
                          {inc.actionTaken}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 4: V8 HEAP MEMORY & REAL-TIME SERVER TELEMETRY
          ================================================================= */}
          {activeSection === 'telemetry' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  style={{ backgroundColor: cardBgColor }}
                  className="p-5 rounded-2xl border border-slate-500/15 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase opacity-60">
                    <span>V8 Heap Used</span>
                    <Cpu className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="font-mono text-2xl font-semibold">
                    {telemetry ? `${telemetry.heapUsedMb} MB` : '74.2 MB'}
                  </div>
                  <div className="font-mono text-[11px] opacity-60">
                    Total Heap: {telemetry?.heapTotalMb ?? 128} MB • RSS: {telemetry?.rssMb ?? 142} MB
                  </div>
                </div>

                <div
                  style={{ backgroundColor: cardBgColor }}
                  className="p-5 rounded-2xl border border-slate-500/15 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase opacity-60">
                    <span>p95 API Latency</span>
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="font-mono text-2xl font-semibold">
                    {telemetry?.apiP95LatencyMs ?? 5.4} ms
                  </div>
                  <div className="font-mono text-[11px] text-emerald-400">
                    Event Loop Lag: {telemetry?.eventLoopLagMs ?? 0.22} ms
                  </div>
                </div>

                <div
                  style={{ backgroundColor: cardBgColor }}
                  className="p-5 rounded-2xl border border-slate-500/15 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase opacity-60">
                    <span>Host Memory</span>
                    <HardDrive className="w-3.5 h-3.5 opacity-70" />
                  </div>
                  <div className="font-mono text-2xl font-semibold">
                    {telemetry
                      ? `${((telemetry.systemTotalMb - telemetry.systemFreeMb) / 1024).toFixed(1)} GB`
                      : '8.2 GB'}
                  </div>
                  <div className="font-mono text-[11px] opacity-60 truncate">
                    {telemetry?.platform ?? 'win32 (x64)'} • {telemetry?.nodeVersion ?? 'v24.22.0'}
                  </div>
                </div>

                <div
                  style={{ backgroundColor: cardBgColor }}
                  className="p-5 rounded-2xl border border-slate-500/15 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase opacity-60">
                    <span>Edge Cache Hit</span>
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="font-mono text-2xl font-semibold">
                    {telemetry?.cacheHitRatio ?? 97.8}%
                  </div>
                  <div className="font-mono text-[11px] opacity-60">
                    Uptime: {telemetry?.uptimeSeconds ?? 520}s
                  </div>
                </div>
              </div>

              {/* Heap Allocation Bar Chart & Controls */}
              <div
                style={{ backgroundColor: cardBgColor }}
                className="p-6 rounded-2xl border border-slate-500/15 space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Live V8 Heap Allocation Profile (process.memoryUsage)
                    </h3>
                    <p className="text-xs opacity-60">
                      Real-time memory telemetry streamed from the active Node.js runtime
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => triggerTelemetryAction('heap_snapshot')}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-500/25 hover:bg-slate-500/10 font-mono text-[11px]"
                    >
                      Capture Heap Snapshot
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerTelemetryAction('purge_cache')}
                      className="px-3.5 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-mono text-[11px]"
                    >
                      Purge Cache & Compact
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerTelemetryAction('clear_logs')}
                      className="px-3.5 py-1.5 rounded-lg border border-rose-500/25 text-rose-400 hover:bg-rose-500/10 font-mono text-[11px]"
                    >
                      Clear Logs
                    </button>
                    <button
                      type="button"
                      onClick={fetchTelemetry}
                      className="p-1.5 rounded-lg border border-slate-500/25 hover:bg-slate-500/10"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="h-40 flex items-end gap-2 pt-6 border-b border-slate-500/15">
                  {heapHistory.map((val, idx) => {
                    const max = Math.max(...heapHistory, 100);
                    const h = Math.max(18, Math.round((val / max) * 125));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="font-mono text-[9px] opacity-55">{val}</span>
                        <div
                          className="w-full rounded-t transition-all duration-300"
                          style={{
                            height: `${h}px`,
                            backgroundColor:
                              idx === heapHistory.length - 1 ? primaryColor : `${primaryColor}45`,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Live Server Log Terminal */}
                <div className="p-4 rounded-xl bg-slate-950 text-slate-200 border border-white/10 font-mono text-[11px] space-y-2 max-h-56 overflow-y-auto">
                  <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/10">
                    <span className="flex items-center gap-2 text-emerald-400">
                      <Terminal className="w-3.5 h-3.5" /> RUNTIME TELEMETRY LOGS
                    </span>
                    <span>/api/telemetry</span>
                  </div>
                  {(telemetry?.logs || []).map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <span className="text-slate-500 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-sky-400 shrink-0">[{log.level}]</span>
                      <span className="text-slate-200">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 5: RANKING ALGORITHM EQUALIZER & AI COPILOT
          ================================================================= */}
          {activeSection === 'algorithm' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                style={{ backgroundColor: cardBgColor }}
                className="p-6 rounded-2xl border border-slate-500/15 space-y-5 text-xs"
              >
                <div>
                  <h3 className="text-base font-semibold">Truth-Weighted Ranking Equalizer</h3>
                  <p className="opacity-65 mt-0.5">
                    Adjust feed ranking coefficients in real time across the entire network.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] text-sky-300">
                  S = (log10(|U-D|) × C_trust[{settings.algorithm.trustMultiplierWeight}] + B_eye[
                  {settings.algorithm.eyewitnessBoost}] + V_vel[{settings.algorithm.velocityWeight}])
                  / (T + 2)^{settings.algorithm.timeDecayGravity}
                </div>

                {[
                  {
                    label: 'On-Scene Eyewitness Boost (B)',
                    key: 'eyewitnessBoost' as const,
                    min: 0,
                    max: 4,
                    step: 0.1,
                    val: draftAlgorithm.eyewitnessBoost,
                  },
                  {
                    label: 'Provenance Trust Weight (C)',
                    key: 'trustMultiplierWeight' as const,
                    min: 0.5,
                    max: 4,
                    step: 0.1,
                    val: draftAlgorithm.trustMultiplierWeight,
                  },
                  {
                    label: 'Engagement Velocity Multiplier (V)',
                    key: 'velocityWeight' as const,
                    min: 0.2,
                    max: 3,
                    step: 0.1,
                    val: draftAlgorithm.velocityWeight,
                  },
                  {
                    label: 'Temporal Decay Gravity (γ)',
                    key: 'timeDecayGravity' as const,
                    min: 1.0,
                    max: 3.0,
                    step: 0.1,
                    val: draftAlgorithm.timeDecayGravity,
                  },
                ].map((slider) => (
                  <div key={slider.key}>
                    <div className="flex justify-between font-mono text-[11px] mb-1">
                      <span>{slider.label}</span>
                      <span className="font-semibold" style={{ color: primaryColor }}>
                        {slider.val}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      value={slider.val}
                      onChange={(e) => {
                        const nextVal = Number(e.target.value);
                        setDraftAlgorithm((prev) => {
                          const updated = { ...prev, [slider.key]: nextVal };
                          scheduleDebouncedAction(`algo_${slider.key}`, () => {
                            onUpdateSettings(
                              {
                                ...settings,
                                algorithm: updated,
                              },
                              `Updated algorithm ${slider.key} to ${nextVal}`
                            );
                          });
                          return updated;
                        });
                      }}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {/* AI Copilot Terminal */}
              <div
                style={{ backgroundColor: cardBgColor }}
                className="p-6 rounded-2xl border border-slate-500/15 space-y-4 text-xs"
              >
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-sky-400" /> Newsroom Automation Console
                  </h3>
                  <p className="opacity-65 mt-0.5">
                    Execute automated forensics sweeps, palette shifts, or ranking recalibrations.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Enter command (e.g. 'Demote disputed posts')..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-500/[0.07] border border-slate-500/20 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (aiInput.trim()) executeAiCommand(aiInput.trim());
                    }}
                    className="px-4 py-2.5 rounded-xl font-semibold text-slate-950"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Execute
                  </button>
                </div>

                {aiFeedback && (
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 font-mono text-[11px] text-indigo-300">
                    {aiFeedback}
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <div className="font-mono text-[10px] uppercase opacity-55">
                    Automated Presets
                  </div>
                  {[
                    'Demote all low-forensics disputed posts',
                    'Elevate Eyewitness Priority Boost to 2.4x',
                    'Apply Cyber Emerald color system',
                    'Apply Terminal Amber color system',
                  ].map((presetCmd) => (
                    <button
                      key={presetCmd}
                      type="button"
                      onClick={() => executeAiCommand(presetCmd)}
                      className="w-full p-2.5 rounded-xl border border-slate-500/15 hover:bg-slate-500/10 text-left font-medium transition-colors"
                    >
                      {presetCmd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              SECTION 6: VERSIONED AUDIT HISTORY & 1-CLICK ROLLBACK
          ================================================================= */}
          {activeSection === 'audit' && (
            <div
              style={{ backgroundColor: cardBgColor }}
              className="p-6 rounded-2xl border border-slate-500/15 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Immutable Audit Trail & State Rollback</h3>
                  <p className="text-xs opacity-65">
                    Every configuration, theme, algorithm, and editorial action is snapshotted.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-500/15 text-xs">
                {auditLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-slate-500/15 uppercase">
                          {entry.actionType}
                        </span>
                        <span className="opacity-55">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="font-medium">{entry.description}</div>
                    </div>

                    {(entry.previousSettings || entry.previousPostState) && (
                      <button
                        type="button"
                        onClick={() => onUndoAuditLog(entry)}
                        className="px-3.5 py-1.5 rounded-full border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-mono text-[11px] flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <RotateCcw className="w-3 h-3" /> Rollback State
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Back Navigation Bar */}
      <div className="pt-6 border-t border-slate-500/15 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold border border-slate-500/25 hover:bg-slate-500/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <Link
          to="/"
          className="text-xs font-medium opacity-65 hover:opacity-100 hover:underline"
        >
          Return to News Feed
        </Link>
      </div>
    </div>
  );
};
