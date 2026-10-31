import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  Activity,
  Atom,
  Bell,
  Bookmark,
  Check,
  Compass,
  Feather,
  Film,
  Flame,
  Globe,
  Headphones,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  MapPin,
  Moon,
  Pause,
  Play,
  Plus,
  Radio,
  Search,
  Shield,
  Sliders,
  Sun,
  TrendingUp,
  User as UserIcon,
  Volume2,
  X,
} from 'lucide-react';
import {
  AuditLogEntry,
  CommentItem,
  CommunityNote,
  LanguageCode,
  MediaItem,
  NewsPost,
  PostCategory,
  SiteSettings,
  User,
} from './types';
import {
  computePostRankScore,
  DEFAULT_SITE_SETTINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_COMMENTS,
  INITIAL_COMMUNITY_NOTES,
  INITIAL_POSTS,
  INITIAL_USERS,
} from './mockData';
import { formatRelativeTime, LANGUAGES, UI_STRINGS } from './i18n';
import { NewsPostCard } from './components/NewsPostCard';
import { UserDashboardView } from './components/UserDashboardView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { Explore3DPage } from './pages/Explore3DPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { BookmarksPage } from './pages/BookmarksPage';

const STORAGE_KEY = 'pulse_news_mature_v4';

export function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Persistent state
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
      return saved ? JSON.parse(saved) : DEFAULT_SITE_SETTINGS;
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [posts, setPosts] = useState<NewsPost[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_posts`);
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });

  const [comments, setComments] = useState<CommentItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_comments`);
      return saved ? JSON.parse(saved) : INITIAL_COMMENTS;
    } catch {
      return INITIAL_COMMENTS;
    }
  });

  const [notes, setNotes] = useState<CommunityNote[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_notes`);
      return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_NOTES;
    } catch {
      return INITIAL_COMMUNITY_NOTES;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>('user-elena');
  const [lang, setLang] = useState<LanguageCode>('en');
  const [feedTab, setFeedTab] = useState<'for_you' | 'following' | 'breaking' | 'tech' | 'world'>('for_you');
  const [selectedCategory, setSelectedCategory] = useState<'all' | PostCategory>('all');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);

  // Social interactions state
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(['post-tokyo-grid']);
  const [likedIds, setLikedIds] = useState<string[]>(['post-tokyo-grid']);
  const [repostedIds, setRepostedIds] = useState<string[]>([]);
  const [followedUserIds, setFollowedUserIds] = useState<string[]>(['user-kenji', 'user-amara']);
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>({});

  // Inline Home Quick-Post Composer state
  const [quickHeadline, setQuickHeadline] = useState('');
  const [quickBody, setQuickBody] = useState('');
  const [quickCategory, setQuickCategory] = useState<PostCategory>('breaking');
  const [quickLocation, setQuickLocation] = useState('London, UK');
  const [quickMediaUrl, setQuickMediaUrl] = useState('');
  const [quickMediaType, setQuickMediaType] = useState<'image' | 'video'>('image');
  const [quickComposerExpanded, setQuickComposerExpanded] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  // Persistent Audio Mini-Player state
  const [audioPost, setAudioPost] = useState<NewsPost | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<1 | 1.25 | 1.5>(1);

  // Fullscreen Lightbox state
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; caption?: string } | null>(null);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) || users[0],
    [users, currentUserId]
  );

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
      localStorage.setItem(`${STORAGE_KEY}_posts`, JSON.stringify(posts));
      localStorage.setItem(`${STORAGE_KEY}_comments`, JSON.stringify(comments));
      localStorage.setItem(`${STORAGE_KEY}_notes`, JSON.stringify(notes));
      localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
    } catch {
      // ignore storage quota errors
    }
  }, [settings, users, posts, comments, notes, auditLogs]);

  // Keyboard shortcut Cmd/Ctrl + K for instant search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setCommandOpen(false);
        setLightboxMedia(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const isDark = settings.theme.mode === 'dark';
  const bgCanvas = isDark ? settings.theme.darkBgCanvas : settings.theme.lightBgCanvas;
  const cardBgColor = isDark ? settings.theme.darkBgCard : settings.theme.lightBgCard;
  const primaryColor = settings.theme.primaryColor;
  const secondaryAiColor = settings.theme.secondaryAiColor;
  const breakingColor = settings.theme.breakingAlertColor;
  const strings = UI_STRINGS[lang];
  const currentLangMeta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  // Handlers
  const handleUpdateSettings = (next: SiteSettings, description: string) => {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      adminId: currentUser.id,
      actionType: 'THEME_CHANGE',
      description,
      timestamp: new Date().toISOString(),
      previousSettings: settings,
    };
    setAuditLogs((prev) => [entry, ...prev]);
    setSettings(next);
  };

  const handleUpdatePost = (postId: string, updates: Partial<NewsPost>, reason: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      adminId: currentUser.id,
      actionType: 'POST_INLINE_EDIT',
      description: reason,
      timestamp: new Date().toISOString(),
      previousPostState: target,
    };
    setAuditLogs((prev) => [entry, ...prev]);
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...updates } : p)));
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleCreatePost = (newPost: NewsPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleQuickPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickHeadline.trim() && !quickBody.trim()) return;

    const headlineText =
      quickHeadline.trim() ||
      (quickBody.trim().length > 85
        ? `${quickBody.trim().slice(0, 82)}...`
        : quickBody.trim());
    const bodyContent = quickBody.trim() || quickHeadline.trim();

    const mediaList: MediaItem[] = quickMediaUrl.trim()
      ? [
          {
            id: `media-${Date.now()}`,
            type: quickMediaType,
            url: quickMediaUrl.trim(),
            caption: `${quickLocation} • Submitted by ${currentUser.displayName}`,
          },
        ]
      : [];

    const newPost: NewsPost = {
      id: `post-${Date.now()}`,
      authorId: currentUser.id,
      headline: headlineText,
      bodyText: bodyContent,
      aiSummary: [
        `Direct report filed from ${quickLocation} by @${currentUser.username}.`,
        'Timestamp and source metadata logged to the live news stream.',
      ],
      category: quickCategory,
      status: 'published',
      tags: [`#${quickCategory}`, `#${quickLocation.split(',')[0].replace(/\s+/g, '')}`],
      isEyewitness: true,
      isBreakingPinned: false,
      locationName: quickLocation,
      latitude: 51.5074,
      longitude: -0.1278,
      privacyLevel: 'city',
      media: mediaList,
      upvotes: 1,
      downvotes: 0,
      commentCount: 0,
      viewCount: 1,
      shareCount: 0,
      velocityPer15m: 18,
      createdAt: new Date().toISOString(),
      forensics: {
        authenticityScore: 96,
        exifVerified: true,
        gpsWeatherMatch: true,
        deepfakeProbability: 2,
        recycledFootageCheck: 'Original Capture',
        deviceSignature: 'Verified Web Session',
      },
    };

    setPosts((prev) => [newPost, ...prev]);
    setQuickHeadline('');
    setQuickBody('');
    setQuickMediaUrl('');
    setQuickComposerExpanded(false);
  };

  const handleQuickFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    setQuickMediaType(isVideo ? 'video' : 'image');
    setQuickMediaUrl(url);
    setQuickComposerExpanded(true);
  };

  const handleLike = (postId: string) => {
    const alreadyLiked = likedIds.includes(postId);
    setLikedIds((prev) =>
      alreadyLiked ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, upvotes: Math.max(0, p.upvotes + (alreadyLiked ? -1 : 1)) }
          : p
      )
    );
  };

  const handleRepost = (postId: string) => {
    const alreadyReposted = repostedIds.includes(postId);
    setRepostedIds((prev) =>
      alreadyReposted ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, shareCount: Math.max(0, p.shareCount + (alreadyReposted ? -1 : 1)) }
          : p
      )
    );
  };

  const handleVote = (postId: string, dir: 'up' | 'down') => {
    const existing = userVotes[postId];
    setUserVotes((prev) => ({ ...prev, [postId]: dir }));
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        let up = p.upvotes;
        let down = p.downvotes;
        if (existing === 'up') up--;
        if (existing === 'down') down--;
        if (dir === 'up') up++;
        if (dir === 'down') down++;
        return { ...p, upvotes: up, downvotes: down };
      })
    );
  };

  const handleToggleBookmark = (postId: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleAddComment = (postId: string, content: string, parentCommentId: string | null = null) => {
    const newComment: CommentItem = {
      id: `comment-${Date.now()}`,
      postId,
      authorId: currentUser.id,
      parentCommentId,
      content,
      upvotes: 1,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, newComment]);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p))
    );
  };

  const handleAddCommunityNote = (postId: string, noteText: string, sourceUrl: string) => {
    const newNote: CommunityNote = {
      id: `note-${Date.now()}`,
      postId,
      authorId: currentUser.id,
      noteText,
      sourcesCited: [sourceUrl],
      status: 'rated_helpful',
      helpfulVotes: 1,
      unhelpfulVotes: 0,
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleVoteCommunityNote = (noteId: string, helpful: boolean) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              helpfulVotes: helpful ? n.helpfulVotes + 1 : n.helpfulVotes,
              unhelpfulVotes: !helpful ? n.unhelpfulVotes + 1 : n.unhelpfulVotes,
            }
          : n
      )
    );
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>, reason?: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
    if (reason) {
      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          adminId: currentUser.id,
          actionType: 'USER_TRUST_UPDATE',
          description: reason,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  };

  const handleUndoAuditLog = (entry: AuditLogEntry) => {
    if (entry.previousSettings) {
      setSettings((prev) => ({ ...prev, ...entry.previousSettings }));
    }
    if (entry.previousPostState) {
      const prevPost = entry.previousPostState;
      setPosts((prev) => prev.map((p) => (p.id === prevPost.id ? prevPost : p)));
    }
    setAuditLogs((prev) => prev.filter((a) => a.id !== entry.id));
  };

  // Audio Narration Player handler
  const handlePlayAudio = (post: NewsPost) => {
    if (!('speechSynthesis' in window)) {
      setAudioPost(post);
      setIsAudioPlaying(true);
      return;
    }
    window.speechSynthesis.cancel();
    if (audioPost?.id === post.id && isAudioPlaying) {
      setIsAudioPlaying(false);
      return;
    }
    const author = users.find((u) => u.id === post.authorId);
    const utterance = new SpeechSynthesisUtterance(
      `${post.headline}. Reported by ${author?.displayName || 'Pulse News'} from ${
        post.locationName
      }. ${post.bodyText}`
    );
    utterance.rate = audioSpeed;
    utterance.onend = () => setIsAudioPlaying(false);
    window.speechSynthesis.speak(utterance);
    setAudioPost(post);
    setIsAudioPlaying(true);
  };

  const toggleAudioPlayPause = () => {
    if (!audioPost) return;
    if (isAudioPlaying) {
      window.speechSynthesis?.cancel();
      setIsAudioPlaying(false);
    } else {
      handlePlayAudio(audioPost);
    }
  };

  // Filtered & Ranked Posts for the Home Stream
  const visiblePosts = useMemo(() => {
    return posts
      .filter((p) => {
        if (p.status === 'removed' || p.status === 'draft') return false;
        if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
        if (activeTagFilter && !p.tags.includes(activeTagFilter)) return false;
        if (feedTab === 'following' && !followedUserIds.includes(p.authorId) && p.authorId !== currentUser.id) {
          return false;
        }
        if (feedTab === 'breaking' && p.category !== 'breaking' && !p.isBreakingPinned) {
          return false;
        }
        if (feedTab === 'tech' && p.category !== 'tech' && p.category !== 'science') {
          return false;
        }
        if (feedTab === 'world' && p.category !== 'politics' && p.category !== 'culture' && p.category !== 'business') {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            p.headline.toLowerCase().includes(q) ||
            p.bodyText.toLowerCase().includes(q) ||
            p.locationName.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isBreakingPinned !== b.isBreakingPinned) return a.isBreakingPinned ? -1 : 1;
        if (feedTab === 'breaking') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        const authorA = users.find((u) => u.id === a.authorId);
        const authorB = users.find((u) => u.id === b.authorId);
        const scoreA = computePostRankScore(a, authorA, settings.algorithm, notes).totalScore;
        const scoreB = computePostRankScore(b, authorB, settings.algorithm, notes).totalScore;
        return scoreB - scoreA;
      });
  }, [
    posts,
    selectedCategory,
    activeTagFilter,
    feedTab,
    followedUserIds,
    currentUser.id,
    searchQuery,
    users,
    settings.algorithm,
    notes,
  ]);

  // Trending topics computed from posts
  const trendingTopics = useMemo(() => {
    const counts: Record<string, { tag: string; category: string; views: number; postsCount: number }> = {};
    posts.forEach((p) => {
      p.tags.forEach((t) => {
        if (!counts[t]) {
          counts[t] = { tag: t, category: p.category, views: 0, postsCount: 0 };
        }
        counts[t].views += p.viewCount;
        counts[t].postsCount += 1;
      });
    });
    return Object.values(counts)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [posts]);

  const renderEmblem = () => {
    const props = { className: 'w-5 h-5', style: { color: primaryColor } };
    if (settings.logoEmblem === 'atom') return <Atom {...props} />;
    if (settings.logoEmblem === 'pulse') return <Activity {...props} />;
    if (settings.logoEmblem === 'shield') return <Shield {...props} />;
    return <Globe {...props} />;
  };

  return (
    <div
      dir={currentLangMeta.dir}
      style={{
        backgroundColor: bgCanvas,
        color: isDark ? '#F8FAFC' : '#0F172A',
      }}
      className={`min-h-screen transition-colors duration-300 ${
        settings.theme.fontStyle === 'tech' ? 'font-mono' : 'font-sans'
      }`}
    >
      {/* =====================================================================
          CLEAN, MATURE STICKY HEADER
      ===================================================================== */}
      <header
        style={{
          backgroundColor: isDark ? 'rgba(9, 13, 22, 0.85)' : 'rgba(255, 255, 255, 0.88)',
          backdropFilter: `blur(${settings.theme.glassBlurPx}px)`,
        }}
        className={`sticky top-0 z-40 border-b ${
          isDark ? 'border-white/[0.07]' : 'border-black/[0.07]'
        }`}
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                  isDark
                    ? 'bg-white/[0.04] border-white/10 group-hover:border-white/25'
                    : 'bg-slate-900/[0.04] border-black/10 group-hover:border-black/25'
                }`}
              >
                {renderEmblem()}
              </div>
              <div>
                <span className="font-editorial text-lg font-bold tracking-tight block leading-none">
                  {settings.siteName}
                </span>
                <span className="text-[10px] opacity-55 tracking-wide block mt-0.5">
                  {settings.siteTagline}
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Instant Search Input */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 opacity-45 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (location.pathname !== '/') navigate('/');
                }}
                placeholder="Search stories, topics, or journalists (⌘K)..."
                className={`w-full pl-10 pr-12 py-2 rounded-full text-xs border transition-colors focus:outline-none ${
                  isDark
                    ? 'bg-white/[0.04] border-white/10 focus:border-sky-400/60 text-white placeholder:text-slate-500'
                    : 'bg-slate-100 border-black/10 focus:border-sky-500 text-slate-900 placeholder:text-slate-400'
                }`}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono opacity-40">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>

          {/* Right: Language, Theme Toggle, Publish Button & User Avatar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Selector */}
            <select
              aria-label="Select language"
              value={lang}
              onChange={(e) => setLang(e.target.value as LanguageCode)}
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium border cursor-pointer focus:outline-none ${
                isDark
                  ? 'bg-white/[0.04] text-slate-200 border-white/10'
                  : 'bg-slate-100 text-slate-800 border-black/10'
              }`}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.code.toUpperCase()} • {l.nativeLabel}
                </option>
              ))}
            </select>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={() =>
                handleUpdateSettings(
                  {
                    ...settings,
                    theme: {
                      ...settings.theme,
                      mode: isDark ? 'light' : 'dark',
                    },
                  },
                  `Switched theme to ${isDark ? 'Light' : 'Dark'}`
                )
              }
              className={`p-2 rounded-full border transition-colors ${
                isDark
                  ? 'border-white/10 hover:bg-white/10 text-slate-200'
                  : 'border-black/10 hover:bg-black/5 text-slate-700'
              }`}
              title={isDark ? 'Switch to Light Paper Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Write / Publish CTA */}
            <Link
              to="/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-slate-950 shadow-sm transition-opacity hover:opacity-95"
              style={{ backgroundColor: primaryColor }}
            >
              <Feather className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Write Story</span>
            </Link>

            {/* Active User Pill */}
            <Link
              to={`/profile/${currentUser.username}`}
              className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border transition-colors ${
                isDark
                  ? 'border-white/10 hover:border-white/25 bg-white/[0.03]'
                  : 'border-black/10 hover:border-black/25 bg-black/[0.02]'
              }`}
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-xs font-medium hidden sm:inline max-w-[100px] truncate">
                {currentUser.displayName.split(' ')[0]}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================================
          DEDICATED ROUTES — EACH PAGE FOR ITS OWN PURPOSE
      ===================================================================== */}
      <Routes>
        {/* 1. HOME SOCIAL NEWS STREAM (/) */}
        <Route
          path="/"
          element={
            <main className="max-w-[1380px] mx-auto px-4 sm:px-6 py-6 pb-28">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT NAVIGATION COLUMN (3 cols) */}
                <aside className="lg:col-span-3 lg:sticky lg:top-22 space-y-5">
                  {/* Primary App Navigation */}
                  <nav
                    style={{ backgroundColor: cardBgColor }}
                    className={`p-3 rounded-2xl border space-y-1 ${
                      isDark ? 'border-white/[0.07]' : 'border-black/[0.07]'
                    }`}
                  >
                    {[
                      { to: '/', label: 'Home Feed', icon: Home, exact: true },
                      { to: '/explore', label: 'Explore & Video', icon: Compass },
                      {
                        to: '/notifications',
                        label: 'Notifications',
                        icon: Bell,
                        badge: '3',
                      },
                      {
                        to: '/bookmarks',
                        label: 'Bookmarks',
                        icon: Bookmark,
                        badge: bookmarkedIds.length > 0 ? String(bookmarkedIds.length) : undefined,
                      },
                      { to: '/studio', label: 'Creator Studio', icon: LayoutDashboard },
                      {
                        to: `/profile/${currentUser.username}`,
                        label: 'My Profile',
                        icon: UserIcon,
                      },
                      { to: '/admin', label: 'Admin Control', icon: Sliders },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = item.exact
                        ? location.pathname === item.to
                        : location.pathname.startsWith(item.to);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isActive
                              ? isDark
                                ? 'bg-white/10 text-white font-semibold'
                                : 'bg-slate-900 text-white font-semibold'
                              : isDark
                              ? 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </span>
                          {item.badge && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-slate-950"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>

                  {/* Editorial Desks Filter */}
                  <div
                    style={{ backgroundColor: cardBgColor }}
                    className={`p-4 rounded-2xl border space-y-2 ${
                      isDark ? 'border-white/[0.07]' : 'border-black/[0.07]'
                    }`}
                  >
                    <div className="px-2 text-[11px] font-semibold uppercase tracking-wider opacity-50">
                      News Desks
                    </div>
                    <div className="space-y-0.5">
                      {(
                        [
                          'all',
                          'breaking',
                          'tech',
                          'science',
                          'politics',
                          'business',
                          'weather_disaster',
                          'culture',
                        ] as const
                      ).map((cat) => {
                        const active = selectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                              active
                                ? isDark
                                  ? 'bg-white/[0.08] text-white font-semibold'
                                  : 'bg-slate-200/80 text-slate-950 font-semibold'
                                : 'opacity-70 hover:opacity-100 hover:bg-slate-500/[0.06]'
                            }`}
                          >
                            <span>
                              {cat === 'all' ? 'All Desks' : strings.categories[cat] || cat}
                            </span>
                            {active && (
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: primaryColor }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Current User Session Card */}
                  <div
                    style={{ backgroundColor: cardBgColor }}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                      isDark ? 'border-white/[0.07]' : 'border-black/[0.07]'
                    }`}
                  >
                    <Link
                      to={`/profile/${currentUser.username}`}
                      className="flex items-center gap-3 min-w-0"
                    >
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate">
                          {currentUser.displayName}
                        </div>
                        <div className="text-[11px] opacity-55 truncate">
                          @{currentUser.username}
                        </div>
                      </div>
                    </Link>
                    <Link
                      to="/login"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-500/20 hover:bg-slate-500/10 text-[11px] font-medium shrink-0"
                    >
                      Switch
                    </Link>
                  </div>
                </aside>

                {/* CENTER SOCIAL NEWS FEED (6 cols) */}
                <section className="lg:col-span-6 space-y-4">
                  {/* Feed Stream Tabs */}
                  <div
                    style={{ backgroundColor: cardBgColor }}
                    className={`p-1.5 rounded-2xl border flex items-center justify-between gap-1 overflow-x-auto ${
                      isDark ? 'border-white/[0.07]' : 'border-black/[0.07]'
                    }`}
                  >
                    {[
                      { id: 'for_you', label: 'For You' },
                      { id: 'following', label: 'Following' },
                      { id: 'breaking', label: 'Breaking' },
                      { id: 'tech', label: 'Tech & Science' },
                      { id: 'world', label: 'World & Policy' },
                    ].map((tab) => {
                      const active = feedTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setFeedTab(tab.id as typeof feedTab)}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                            active
                              ? isDark
                                ? 'bg-white text-slate-950 shadow-xs'
                                : 'bg-slate-900 text-white shadow-xs'
                              : 'opacity-65 hover:opacity-100'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Tag Filter Pill */}
                  {activeTagFilter && (
                    <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-xs">
                      <span>
                        Filtering stories tagged{' '}
                        <strong style={{ color: primaryColor }}>{activeTagFilter}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTagFilter(null)}
                        className="inline-flex items-center gap-1 font-semibold hover:underline"
                      >
                        Clear filter <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* INLINE QUICK-POST COMPOSER */}
                  <form
                    onSubmit={handleQuickPostSubmit}
                    style={{ backgroundColor: cardBgColor }}
                    className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
                      isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.displayName}
                        className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0 space-y-3">
                        <input
                          type="text"
                          value={quickHeadline}
                          onFocus={() => setQuickComposerExpanded(true)}
                          onChange={(e) => setQuickHeadline(e.target.value)}
                          placeholder="Share a breaking news headline or field update..."
                          className="w-full bg-transparent text-sm sm:text-base font-medium placeholder:opacity-50 focus:outline-none"
                        />

                        {quickComposerExpanded && (
                          <div className="space-y-3 pt-1">
                            <textarea
                              rows={3}
                              value={quickBody}
                              onChange={(e) => setQuickBody(e.target.value)}
                              placeholder="Add full story context, verified details, or eyewitness observations..."
                              className={`w-full p-3 rounded-xl text-sm border focus:outline-none ${
                                isDark
                                  ? 'bg-white/[0.03] border-white/10 text-slate-100'
                                  : 'bg-slate-50 border-black/10 text-slate-800'
                              }`}
                            />

                            {quickMediaUrl && (
                              <div className="relative rounded-xl overflow-hidden border border-slate-500/20 max-h-60 bg-black">
                                {quickMediaType === 'video' ? (
                                  <video
                                    src={quickMediaUrl}
                                    controls
                                    className="w-full max-h-60 object-cover"
                                  />
                                ) : (
                                  <img
                                    src={quickMediaUrl}
                                    alt="Upload preview"
                                    className="w-full max-h-60 object-cover"
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setQuickMediaUrl('')}
                                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/75 text-white hover:bg-black"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <select
                                value={quickCategory}
                                onChange={(e) => setQuickCategory(e.target.value as PostCategory)}
                                className={`px-3 py-1.5 rounded-lg border text-xs ${
                                  isDark
                                    ? 'bg-slate-900 border-white/10 text-slate-200'
                                    : 'bg-slate-100 border-black/10 text-slate-800'
                                }`}
                              >
                                <option value="breaking">Breaking News</option>
                                <option value="tech">Tech & AI</option>
                                <option value="science">Science & Space</option>
                                <option value="politics">Politics & Policy</option>
                                <option value="business">Markets & Economy</option>
                                <option value="weather_disaster">Weather & Climate</option>
                                <option value="culture">World Culture</option>
                              </select>

                              <div
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                                  isDark
                                    ? 'bg-slate-900 border-white/10 text-slate-200'
                                    : 'bg-slate-100 border-black/10 text-slate-800'
                                }`}
                              >
                                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                                <input
                                  type="text"
                                  value={quickLocation}
                                  onChange={(e) => setQuickLocation(e.target.value)}
                                  className="bg-transparent text-xs focus:outline-none w-32"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div
                          className={`flex items-center justify-between pt-2.5 border-t ${
                            isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <input
                              ref={quickFileInputRef}
                              type="file"
                              accept="image/*,video/*"
                              onChange={handleQuickFileSelect}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => quickFileInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium opacity-70 hover:opacity-100 hover:bg-slate-500/10 transition-colors"
                              title="Upload photo or video from device"
                            >
                              <ImageIcon className="w-4 h-4 text-sky-400" />
                              <span>Photo / Video</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setQuickComposerExpanded(true);
                                setQuickMediaType('image');
                                setQuickMediaUrl(
                                  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80'
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium opacity-70 hover:opacity-100 hover:bg-slate-500/10 transition-colors"
                            >
                              <Film className="w-4 h-4 text-emerald-400" />
                              <span className="hidden sm:inline">Sample Media</span>
                            </button>

                            <Link
                    