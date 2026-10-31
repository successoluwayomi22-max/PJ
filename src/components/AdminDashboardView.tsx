import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  Cpu,
  Database,
  Edit3,
  HardDrive,
  History,
  Layers,
  Lock,
  Palette,
  Pin,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Trash2,
  Users,
} from 'lucide-react';
import {
  AuditLogEntry,
  CommunityNote,
  NewsPost,
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
  notes: CommunityNote[];
  auditLogs: AuditLogEntry[];
  onUpdateSettings: (next: SiteSettings, auditDesc: string) => void;
  onUpdatePost: (postId: string, updates: Partial<NewsPost>, reason: string) => void;
  onDeletePost: (postId: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>, reason?: string) => void;
  onUndoAuditLog: (entry: AuditLogEntry) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  settings,
  posts,
  users,
  notes,
  auditLogs,
  onUpdateSettings,
  onUpdatePost,
  onDeletePost,
  onUpdateUser,
  onUndoAuditLog,
}) => {
  const [activeSection, setActiveSection] = useState<
    'overview' | 'users' | 'branding' | 'telemetry' | 'algorithm' | 'audit'
  >('overview');

  const [telemetry, setTelemetry] = useState<TelemetrySnapshot | null>(null);
  const [heapHistory, setHeapHistory] = useState<number[]>([
    68.4, 70.1, 71.8, 69.5, 72.3, 74.0, 71.9, 73.4, 72.8, 74.6,
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

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

  useEffect(() => {
    fetchTelemetry();
    const timer = setInterval(fetchTelemetry, 2800);
    return () => clearInterval(timer);
  }, []);

  const triggerTelemetryAction = async (action: 'purge_cache' | 'heap_snapshot') => {
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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* DEDICATED ADMIN OS SIDEBAR */}
        <aside className="lg:col-span-3 lg:sticky lg:top-20 space-y-4">
          <div
            style={{ backgroundColor: cardBgColor }}
            className="p-5 rounded-2xl border border-slate-500/15 space-y-4"
          >
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
                { id: 'telemetry', label: 'V8 Heap & Telemetry', icon: Cpu },
                { id: 'algorithm', label: 'Algorithm & AI Copilot', icon: Sliders },
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
                        <img
                          src={u.avatarUrl}
                          alt={u.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
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
                      <Link
                        to={`/profile/${u.username}`}
                        className="p-1.5 rounded-lg hover:bg-slate-500/10 opacity-60 hover:opacity-100"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div>
                      <div className="flex justify-between font-mono text-[11px] mb-1">
                        <span className="opacity-65">Provenance Trust Index</span>
                        <span className="text-emerald-400 font-semibold">
                          {Math.round(u.trustScore * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={100}
                        value={Math.round(u.trustScore * 100)}
                        onChange={(e) =>
                          onUpdateUser(
                            u.id,
                            { trustScore: Number(e.target.value) / 100 },
                            `Adjusted @${u.username} Trust Score to ${e.target.value}%`
                          )
                        }
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
                      Publication Title
                    </label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) =>
                        onUpdateSettings(
                          { ...settings, siteName: e.target.value },
                          `Renamed publication to "${e.target.value}"`
                        )
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.07] border border-slate-500/20 font-semibold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono uppercase text-[10px] opacity-60 mb-1.5">
                      Editorial Masthead Subtitle
                    </label>
                    <input
                      type="text"
                      value={settings.siteTagline}
                      onChange={(e) =>
                        onUpdateSettings(
                          { ...settings, siteTagline: e.target.value },
                          'Updated publication masthead subtitle'
                        )
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.07] border border-slate-500/20 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono uppercase text-[10px] opacity-60 mb-1.5">
                    Priority Wire Ticker Dispatch
                  </label>
                  <input
                    type="text"
                    value={settings.breakingBannerText}
                    onChange={(e) =>
                      onUpdateSettings(
                        { ...settings, breakingBannerText: e.target.value },
                        'Updated Priority Wire Banner'
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.07] border border-slate-500/20"
                  />
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
                      <span>{settings.theme.glassBlurPx}px</span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={32}
                      value={settings.theme.glassBlurPx}
                      onChange={(e) =>
                        onUpdateSettings(
                          {
                            ...settings,
                            theme: { ...settings.theme, glassBlurPx: Number(e.target.value) },
                          },
                          `Set glass blur to ${e.target.value}px`
                        )
                      }
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
                        onChange={(e) =>
                          onUpdateSettings(
                            {
                              ...settings,
                              theme: {
                                ...settings.theme,
                                presetId: 'custom',
                                [item.key]: e.target.value,
                              },
                            },
                            `Set ${item.label} to ${e.target.value}`
                          )
                        }
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
                    val: settings.algorithm.eyewitnessBoost,
                  },
                  {
                    label: 'Provenance Trust Weight (C)',
                    key: 'trustMultiplierWeight' as const,
                    min: 0.5,
                    max: 4,
                    step: 0.1,
                    val: settings.algorithm.trustMultiplierWeight,
                  },
                  {
                    label: 'Engagement Velocity Multiplier (V)',
                    key: 'velocityWeight' as const,
                    min: 0.2,
                    max: 3,
                    step: 0.1,
                    val: settings.algorithm.velocityWeight,
                  },
                  {
                    label: 'Temporal Decay Gravity (γ)',
                    key: 'timeDecayGravity' as const,
                    min: 1.0,
                    max: 3.0,
                    step: 0.1,
                    val: settings.algorithm.timeDecayGravity,
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
                      onChange={(e) =>
                        onUpdateSettings(
                          {
                            ...settings,
                            algorithm: {
                              ...settings.algorithm,
                              [slider.key]: Number(e.target.value),
                            },
                          },
                          `Updated algorithm ${slider.key} to ${e.target.value}`
                        )
                      }
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
                    <Sparkles className="w-4 h-4 text-indigo-400" /> AI Newsroom Command Copilot
                  </h3>
                  <p className="opacity-65 mt-0.5">
                    Execute automated forensics sweeps, palette shifts, or algorithm recalibrations.
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
    </div>
  );
};
