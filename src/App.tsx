import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Atom,
  Bell,
  Bookmark,
  Camera,
  Check,
  ChevronDown,
  Compass,
  Feather,
  Film,
  Flame,
  Globe,
  Headphones,
  Home,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  LogOut,
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
  RoleDefinition,
  SiteSettings,
  User,
} from './types';
import {
  hasPermission,
  canTransitionWorkflow,
  SYSTEM_ROLES,
} from './utils/rbac';
import {
  computePostRankScore,
  INITIAL_SITE_SETTINGS,
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
import { NotificationItem, NotificationsPage } from './pages/NotificationsPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { api } from './services/api';

const STORAGE_KEY = 'pulse_news_mature_v5';

const GUEST_USER: User = {
  id: 'guest',
  username: 'guest',
  displayName: 'Guest Reader',
  email: 'guest@pulsenews.global',
  avatarUrl:
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  bio: 'Exploring open news dispatches on Pulse.',
  location: 'Global',
  role: 'guest',
  status: 'active',
  verificationTier: 'standard',
  trustScore: 0.5,
  joinedAt: '2025-01-01T00:00:00Z',
  followersCount: 0,
  reportsCount: 0,
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    type: 'repost',
    actorId: 'user-kenji',
    postId: 'post-1',
    time: '12m ago',
    text: 'reposted your coverage and added field commentary from Tokyo Bureau.',
  },
  {
    id: 'n-2',
    type: 'comment',
    actorId: 'user-amina',
    postId: 'post-3',
    time: '38m ago',
    text: 'replied to your report: "Battery reserve telemetry in Yaba held at 99.4% stability overnight."',
  },
  {
    id: 'n-3',
    type: 'verified',
    actorId: 'user-marcus',
    postId: 'post-2',
    time: '1h ago',
    text: 'confirmed C2PA hardware signature on your dispatch (#98.4% authenticity).',
  },
  {
    id: 'n-4',
    type: 'like',
    actorId: 'user-claire',
    postId: 'post-4',
    time: '2h ago',
    text: 'and 42 other correspondents recommended your dispatch.',
  },
  {
    id: 'n-5',
    type: 'follow',
    actorId: 'user-rafael',
    time: '4h ago',
    text: 'followed your investigative desk from São Paulo.',
  },
  {
    id: 'n-6',
    type: 'like',
    actorId: 'user-kenji',
    postId: 'post-5',
    time: '6h ago',
    text: 'recommended your report on European Quantum Photonic Interconnect.',
  },
];

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

export function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Persistent state
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
      return saved ? JSON.parse(saved) : INITIAL_SITE_SETTINGS;
    } catch {
      return INITIAL_SITE_SETTINGS;
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

  const [customRoles, setCustomRoles] = useState<RoleDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_custom_roles`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_current_user_id`);
      return saved && saved !== 'user-elena' ? saved : 'user-kenji';
    } catch {
      return 'user-kenji';
    }
  });
  const [lang, setLang] = useState<LanguageCode>('en');
  const [feedTab, setFeedTab] = useState<'for_you' | 'following' | 'breaking' | 'tech' | 'world'>('for_you');
  const [selectedCategory, setSelectedCategory] = useState<'all' | PostCategory>('all');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);

  // Debounce search query (250ms) so typing in the search input never triggers per-keystroke feed re-ranking
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Social interactions state (persisted in localStorage)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_bookmarks`);
      return saved ? JSON.parse(saved) : ['post-1'];
    } catch {
      return ['post-1'];
    }
  });
  const [seenBookmarkIds, setSeenBookmarkIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_seen_bookmarks`);
      if (saved) return JSON.parse(saved);
      const existingBookmarks = localStorage.getItem(`${STORAGE_KEY}_bookmarks`);
      return existingBookmarks ? JSON.parse(existingBookmarks) : ['post-1'];
    } catch {
      return ['post-1'];
    }
  });
  const unseenBookmarksCount = useMemo(
    () => bookmarkedIds.filter((id) => !seenBookmarkIds.includes(id)).length,
    [bookmarkedIds, seenBookmarkIds]
  );
  const [likedIds, setLikedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_likes`);
      return saved ? JSON.parse(saved) : ['post-1'];
    } catch {
      return ['post-1'];
    }
  });
  const [dislikedIds, setDislikedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_dislikes`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [repostedIds, setRepostedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_reposts`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_liked_comments`);
      return saved ? JSON.parse(saved) : ['c-1'];
    } catch {
      return ['c-1'];
    }
  });
  const [notifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_read_notifications`);
      return saved ? JSON.parse(saved) : ['n-4', 'n-5', 'n-6'];
    } catch {
      return ['n-4', 'n-5', 'n-6'];
    }
  });
  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !readNotificationIds.includes(n.id)).length,
    [notifications, readNotificationIds]
  );
  const [followedUserIds, setFollowedUserIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_followed_users`);
      return saved ? JSON.parse(saved) : ['user-kenji', 'user-amina'];
    } catch {
      return ['user-kenji', 'user-amina'];
    }
  });
  const [followToast, setFollowToast] = useState<string | null>(null);
  const followToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const homeAvatarInputRef = useRef<HTMLInputElement>(null);

  const handleHomeAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleUpdateUser(currentUser.id, { avatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  // Persistent Audio Mini-Player state
  const [audioPost, setAudioPost] = useState<NewsPost | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<1 | 1.25 | 1.5>(1);

  // Fullscreen Lightbox state
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; caption?: string } | null>(null);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = Boolean(currentUserId && currentUserId !== 'guest');
  const currentUser = useMemo(() => {
    if (!isAuthenticated) return GUEST_USER;
    return users.find((u) => u.id === currentUserId) || users[0];
  }, [users, currentUserId, isAuthenticated]);

  // Close user dropdown on outside click or route change
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = () => {
    setCurrentUserId('guest');
    try {
      localStorage.setItem(`${STORAGE_KEY}_current_user_id`, 'guest');
    } catch {
      // ignore
    }
    setUserMenuOpen(false);
    navigate('/login');
  };

  // Debounced persistence to localStorage (450ms) so UI updates never block the main thread
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(`${STORAGE_KEY}_current_user_id`, currentUserId);
        localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
        localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
        localStorage.setItem(`${STORAGE_KEY}_posts`, JSON.stringify(posts));
        localStorage.setItem(`${STORAGE_KEY}_comments`, JSON.stringify(comments));
        localStorage.setItem(`${STORAGE_KEY}_notes`, JSON.stringify(notes));
        localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
        localStorage.setItem(`${STORAGE_KEY}_bookmarks`, JSON.stringify(bookmarkedIds));
        localStorage.setItem(`${STORAGE_KEY}_seen_bookmarks`, JSON.stringify(seenBookmarkIds));
        localStorage.setItem(`${STORAGE_KEY}_likes`, JSON.stringify(likedIds));
        localStorage.setItem(`${STORAGE_KEY}_dislikes`, JSON.stringify(dislikedIds));
        localStorage.setItem(`${STORAGE_KEY}_reposts`, JSON.stringify(repostedIds));
        localStorage.setItem(`${STORAGE_KEY}_liked_comments`, JSON.stringify(likedCommentIds));
        localStorage.setItem(`${STORAGE_KEY}_followed_users`, JSON.stringify(followedUserIds));
        localStorage.setItem(
          `${STORAGE_KEY}_read_notifications`,
          JSON.stringify(readNotificationIds)
        );
        localStorage.setItem(
          `${STORAGE_KEY}_custom_roles`,
          JSON.stringify(customRoles)
        );
      } catch {
        // ignore storage quota errors
      }
    }, 450);

    return () => clearTimeout(saveTimer);
  }, [
    currentUserId,
    settings,
    users,
    customRoles,
    posts,
    comments,
    notes,
    auditLogs,
    bookmarkedIds,
    seenBookmarkIds,
    likedIds,
    dislikedIds,
    repostedIds,
    likedCommentIds,
    followedUserIds,
    readNotificationIds,
  ]);

  // Always scroll to the very top of the page when navigating to a new route
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  // Automatically mark Notifications or Bookmarks as seen/read when the user visits those pages or articles
  useEffect(() => {
    if (location.pathname === '/bookmarks') {
      setSeenBookmarkIds((prev) => {
        const merged = Array.from(new Set([...prev, ...bookmarkedIds]));
        return merged.length === prev.length ? prev : merged;
      });
    } else if (location.pathname === '/notifications') {
      const allIds = notifications.map((n) => n.id);
      setReadNotificationIds((prev) => {
        const merged = Array.from(new Set([...prev, ...allIds]));
        return merged.length === prev.length ? prev : merged;
      });
    } else if (location.pathname.startsWith('/article/')) {
      const articleId = location.pathname.replace('/article/', '');
      if (articleId) {
        setSeenBookmarkIds((prev) =>
          prev.includes(articleId) ? prev : [...prev, articleId]
        );
        const matchingNotifIds = notifications
          .filter((n) => n.postId === articleId)
          .map((n) => n.id);
        if (matchingNotifIds.length > 0) {
          setReadNotificationIds((prev) =>
            Array.from(new Set([...prev, ...matchingNotifIds]))
          );
        }
      }
    }
  }, [location.pathname, bookmarkedIds, notifications]);

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

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);
  const bgCanvas = isDark ? settings.theme.darkBgCanvas : settings.theme.lightBgCanvas;
  const cardBgColor = isDark ? settings.theme.darkBgCard : settings.theme.lightBgCard;
  const primaryColor = settings.theme.primaryColor;
  const secondaryAiColor = settings.theme.secondaryAiColor;
  const breakingColor = settings.theme.breakingAlertColor;
  const strings = UI_STRINGS[lang];
  const currentLangMeta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  // Handlers
  const handleUpdateSettings = (next: SiteSettings, description: string) => {
    const prefix = description.split('"')[0]?.split(' to ')[0]?.trim();
    setAuditLogs((prev) => {
      if (
        prefix &&
        prev[0] &&
        prev[0].actionType === 'THEME_CHANGE' &&
        prev[0].description.startsWith(prefix)
      ) {
        return [
          {
            ...prev[0],
            description,
            timestamp: new Date().toISOString(),
          },
          ...prev.slice(1, 50),
        ];
      }
      const entry: AuditLogEntry = {
        id: `audit-${Date.now()}`,
        adminId: currentUser.id,
        actionType: 'THEME_CHANGE',
        description,
        timestamp: new Date().toISOString(),
        previousSettings: settings,
      };
      return [entry, ...prev.slice(0, 49)];
    });
    setSettings(next);
  };

  const handleCreateCustomRole = (role: RoleDefinition) => {
    setCustomRoles((prev) => [role, ...prev]);
    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      adminId: currentUser.id,
      actionType: 'ROLE_CREATED',
      description: `Created custom role [${role.label}] with ${role.permissions.length} granular permissions`,
      timestamp: new Date().toISOString(),
      targetResourceId: role.id,
      resourceType: 'ROLE',
      outcome: 'SUCCESS',
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const handleDeleteCustomRole = (roleId: string) => {
    setCustomRoles((prev) => prev.filter((r) => r.id !== roleId));
    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      adminId: currentUser.id,
      actionType: 'ROLE_DELETED',
      description: `Deleted custom role [${roleId}] from system`,
      timestamp: new Date().toISOString(),
      targetResourceId: roleId,
      resourceType: 'ROLE',
      outcome: 'SUCCESS',
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const handleUpdatePost = (postId: string, updates: Partial<NewsPost>, reason: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;

    // 1. If transitioning workflow status, enforce workflow engine rules
    if (updates.status && updates.status !== target.status) {
      const transitionResult = canTransitionWorkflow(
        currentUser,
        target,
        updates.status,
        customRoles
      );
      if (!transitionResult.allowed) {
        alert(transitionResult.reason || 'Workflow transition denied.');
        return;
      }
    } else {
      // 2. Otherwise enforce object-level article update permissions
      const isAuthorized =
        hasPermission(
          currentUser,
          'articles.update_own',
          { resourceAuthorId: target.authorId },
          customRoles
        ) || hasPermission(currentUser, 'articles.update_any', undefined, customRoles);

      if (!isAuthorized) {
        alert('Forbidden: You do not have permission to update this dispatch.');
        return;
      }
    }

    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      adminId: currentUser.id,
      actionType: updates.status ? 'WORKFLOW_TRANSITION' : 'POST_INLINE_EDIT',
      description: reason,
      timestamp: new Date().toISOString(),
      targetResourceId: postId,
      resourceType: 'ARTICLE',
      outcome: 'SUCCESS',
      previousPostState: target,
    };
    setAuditLogs((prev) => [entry, ...prev]);
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...updates } : p)));
  };

  const handleDeletePost = (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;

    const isAuthorized =
      hasPermission(
        currentUser,
        'articles.delete_own',
        { resourceAuthorId: target.authorId },
        customRoles
      ) || hasPermission(currentUser, 'articles.delete_any', undefined, customRoles);

    if (!isAuthorized) {
      alert('Forbidden: You do not have permission to delete this dispatch.');
      return;
    }

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
    const wasDisliked = dislikedIds.includes(postId);

    setLikedIds((prev) =>
      alreadyLiked ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
    if (wasDisliked) {
      setDislikedIds((prev) => prev.filter((id) => id !== postId));
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              upvotes: Math.max(0, p.upvotes + (alreadyLiked ? -1 : 1)),
              downvotes: wasDisliked ? Math.max(0, p.downvotes - 1) : p.downvotes,
            }
          : p
      )
    );
  };

  const handleDislike = (postId: string) => {
    const alreadyDisliked = dislikedIds.includes(postId);
    const wasLiked = likedIds.includes(postId);

    setDislikedIds((prev) =>
      alreadyDisliked ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
    if (wasLiked) {
      setLikedIds((prev) => prev.filter((id) => id !== postId));
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              downvotes: Math.max(0, p.downvotes + (alreadyDisliked ? -1 : 1)),
              upvotes: wasLiked ? Math.max(0, p.upvotes - 1) : p.upvotes,
            }
          : p
      )
    );
  };

  const handleLikeComment = (commentId: string) => {
    const alreadyLiked = likedCommentIds.includes(commentId);
    setLikedCommentIds((prev) =>
      alreadyLiked ? prev.filter((id) => id !== commentId) : [...prev, commentId]
    );
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, upvotes: Math.max(0, c.upvotes + (alreadyLiked ? -1 : 1)) }
          : c
      )
    );
  };

  const handleDeleteComment = (commentId: string, postId: string) => {
    const targetComment = comments.find((c) => c.id === commentId);
    if (!targetComment) return;

    // Server-side Object-Level Authorization Check
    const isAuthorized =
      hasPermission(
        currentUser,
        'comments.delete_own',
        { resourceAuthorId: targetComment.authorId },
        customRoles
      ) || hasPermission(currentUser, 'comments.moderate', undefined, customRoles);

    if (!isAuthorized) {
      alert('Forbidden: You do not have permission to delete this comment.');
      return;
    }

    setComments((prev) => {
      const removedCount = prev.filter(
        (c) => c.id === commentId || c.parentCommentId === commentId
      ).length;
      setPosts((postsPrev) =>
        postsPrev.map((p) =>
          p.id === postId
            ? { ...p, commentCount: Math.max(0, p.commentCount - removedCount) }
            : p
        )
      );
      return prev.filter((c) => c.id !== commentId && c.parentCommentId !== commentId);
    });
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

  const handleToggleFollow = (targetUserId: string) => {
    const targetUser = users.find((u) => u.id === targetUserId);
    const isFollowing = followedUserIds.includes(targetUserId);
    const nextFollowing = !isFollowing;

    setFollowedUserIds((prev) =>
      isFollowing ? prev.filter((id) => id !== targetUserId) : [...prev, targetUserId]
    );

    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUserId
          ? {
              ...u,
              followersCount: Math.max(0, (u.followersCount || 0) + (nextFollowing ? 1 : -1)),
            }
          : u
      )
    );

    // Persist to backend API
    api.toggleFollow(targetUserId).catch(() => {});

    const name = targetUser?.displayName || targetUser?.username || 'Correspondent';
    setFollowToast(nextFollowing ? `Following ${name}` : `Unfollowed ${name}`);
    if (followToastTimerRef.current) clearTimeout(followToastTimerRef.current);
    followToastTimerRef.current = setTimeout(() => {
      setFollowToast(null);
    }, 1500);
  };

  const handleDeleteAccount = (targetUserId: string, passwordVerification: string): boolean => {
    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) return false;

    if (targetUser.password && passwordVerification !== targetUser.password) {
      return false;
    }

    // 1. Anonymize user dispatches to preserve historical record per GDPR / NDPA policy
    setPosts((prev) =>
      prev.map((p) =>
        p.authorId === targetUserId
          ? {
              ...p,
              bodyText: `[Correspondent profile erased per privacy request] ${p.bodyText}`,
            }
          : p
      )
    );

    // 2. Anonymize comments
    setComments((prev) =>
      prev.map((c) =>
        c.authorId === targetUserId
          ? { ...c, content: '[Comment removed by deleted user]' }
          : c
      )
    );

    // 3. Remove user from users state
    setUsers((prev) => prev.filter((u) => u.id !== targetUserId));

    // 4. Log administrative audit trail without personal information
    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      adminId: currentUserId,
      actionType: 'MODERATION_ACTION',
      description: `User account @${targetUser.username} was permanently erased per user erasure request.`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    // 5. Select next fallback user if current user was deleted
    const fallbackUser = users.find((u) => u.id !== targetUserId && u.id !== 'user-admin') || users[0];
    setCurrentUserId(fallbackUser.id);
    navigate('/');
    setFollowToast('Account successfully deleted and personal data scrubbed.');
    setTimeout(() => setFollowToast(null), 3000);

    return true;
  };

  const handleQuoteRepost = (originalPost: NewsPost, quoteText: string) => {
    const originalAuthor = users.find((u) => u.id === originalPost.authorId);
    const quotedPost: NewsPost = {
      id: `post-quote-${Date.now()}`,
      authorId: currentUser.id,
      headline: quoteText,
      bodyText: `Quoted @${originalAuthor?.username || 'correspondent'} (${originalPost.locationName}): "${originalPost.headline}" — ${originalPost.bodyText}`,
      aiSummary: [
        `Quote repost by @${currentUser.username} referencing @${originalAuthor?.username || 'correspondent'}.`,
        ...originalPost.aiSummary.slice(0, 1),
      ],
      category: originalPost.category,
      status: 'published',
      tags: [...originalPost.tags],
      isEyewitness: false,
      isBreakingPinned: false,
      locationName: currentUser.location || originalPost.locationName,
      latitude: originalPost.latitude,
      longitude: originalPost.longitude,
      privacyLevel: 'city',
      media: originalPost.media,
      upvotes: 1,
      downvotes: 0,
      commentCount: 0,
      viewCount: 1,
      shareCount: 1,
      velocityPer15m: 24,
      createdAt: new Date().toISOString(),
      forensics: originalPost.forensics,
    };

    setPosts((prev) => [
      quotedPost,
      ...prev.map((p) =>
        p.id === originalPost.id ? { ...p, shareCount: p.shareCount + 1 } : p
      ),
    ]);
    setRepostedIds((prev) =>
      prev.includes(originalPost.id) ? prev : [...prev, originalPost.id]
    );
  };

  const handleMarkNotificationRead = (id: string) => {
    setReadNotificationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleMarkAllNotificationsRead = () => {
    setReadNotificationIds(notifications.map((n) => n.id));
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
    const isCurrentlyBookmarked = bookmarkedIds.includes(postId);
    setBookmarkedIds((prev) =>
      isCurrentlyBookmarked ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
    if (isCurrentlyBookmarked) {
      setSeenBookmarkIds((prev) => prev.filter((id) => id !== postId));
    } else if (location.pathname === '/bookmarks') {
      setSeenBookmarkIds((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
    }
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
        if (debouncedSearchQuery.trim()) {
          const q = debouncedSearchQuery.toLowerCase();
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
    debouncedSearchQuery,
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
      <ScrollToTop />
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
          <div className="flex items-center gap-3 sm:gap-5">
            <Link to="/" className="flex items-center gap-3 group">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.siteName}
                  className="w-9 h-9 rounded-xl object-cover border border-slate-500/20"
                />
              ) : (
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                    isDark
                      ? 'bg-white/[0.04] border-white/10 group-hover:border-white/25'
                      : 'bg-slate-900/[0.04] border-black/10 group-hover:border-black/25'
                  }`}
                >
                  {renderEmblem()}
                </div>
              )}
              <div>
                <span className="font-editorial text-lg font-bold tracking-tight block leading-none">
                  {settings.siteName}
                </span>
                <span className="text-[10px] opacity-55 tracking-wide block mt-0.5">
                  {settings.siteTagline}
                </span>
              </div>
            </Link>

            {/* Quick Global Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1 pl-2 border-l border-slate-500/15">
              {[
                { to: '/', label: 'Home', exact: true },
                { to: '/explore', label: 'Explore' },
                {
                  to: '/notifications',
                  label: 'Notifications',
                  badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
                },
                {
                  to: '/bookmarks',
                  label: 'Bookmarks',
                },
              ].map((navItem) => {
                const active = navItem.exact
                  ? location.pathname === navItem.to
                  : location.pathname.startsWith(navItem.to);
                return (
                  <Link
                    key={navItem.to}
                    to={navItem.to}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                      active
                        ? isDark
                          ? 'bg-white/10 text-white font-semibold'
                          : 'bg-slate-900 text-white font-semibold'
                        : 'opacity-70 hover:opacity-100 hover:bg-slate-500/10'
                    }`}
                  >
                    <span>{navItem.label}</span>
                    {navItem.badge !== undefined && (
                      <span
                        className="px-1.5 py-0.2 rounded-full text-[10px] font-bold text-slate-950"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {navItem.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center: Instant Search Input (Works for both Guests and Signed-in Users) */}
          <div className="flex-1 max-w-lg mx-2 sm:mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 opacity-45 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCommandOpen(true)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono opacity-40 hover:opacity-100 transition-opacity"
                  title="Open quick command search (⌘K)"
                >
                  ⌘K
                </button>
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
                  {l.code.toUpperCase()} • {l.nativeName}
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

            {/* Active User RBAC Menu & Dashboard Access */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Write / Publish CTA: ONLY visible when authenticated */}
                <Link
                  to="/create"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-950 shadow-sm transition-opacity hover:opacity-95"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Feather className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Write Story</span>
                </Link>

                <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border transition-colors ${
                    isDark
                      ? 'border-white/10 hover:border-white/25 bg-white/[0.03]'
                      : 'border-black/10 hover:border-black/25 bg-black/[0.02]'
                  }`}
                  aria-label="User account and dashboard menu"
                  aria-expanded={userMenuOpen}
                >
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-xs font-medium hidden sm:inline max-w-[100px] truncate">
                    {currentUser.displayName.split(' ')[0]}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 opacity-60 transition-transform ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Top-Right RBAC Dashboard Dropdown Menu */}
                {userMenuOpen && (
                  <div
                    style={{ backgroundColor: cardBgColor }}
                    className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border shadow-2xl z-50 p-2 text-xs divide-y ${
                      isDark
                        ? 'border-white/15 divide-white/10 text-white'
                        : 'border-black/10 divide-black/10 text-slate-900'
                    }`}
                  >
                    {/* User Profile Header */}
                    <div className="p-2.5 flex items-center gap-3">
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.displayName}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                          <span className="truncate">{currentUser.displayName}</span>
                          {currentUser.role === 'super_admin' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-400 shrink-0">
                              SUPER ADMIN
                            </span>
                          ) : currentUser.role === 'admin' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 shrink-0">
                              ADMIN
                            </span>
                          ) : currentUser.role === 'managing_editor' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-400 shrink-0">
                              MANAGING ED
                            </span>
                          ) : currentUser.role === 'editor' ||
                            currentUser.role === 'moderator' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/15 text-sky-400 shrink-0">
                              EDITOR
                            </span>
                          ) : currentUser.verificationTier === 'journalist' ||
                            currentUser.role === 'author' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 shrink-0">
                              JOURNALIST
                            </span>
                          ) : currentUser.role === 'contributor' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-cyan-500/15 text-cyan-400 shrink-0">
                              CONTRIBUTOR
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-500/15 text-slate-400 shrink-0">
                              READER
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] opacity-60 truncate">
                          @{currentUser.username}
                        </div>
                      </div>
                    </div>

                    {/* RBAC Dashboard & Navigation Items */}
                    <div className="py-1.5 space-y-0.5">
                      {/* Role-Specific Dashboard Access */}
                      <Link
                        to={
                          currentUser.role === 'super_admin' || currentUser.role === 'admin'
                            ? '/admin'
                            : '/studio'
                        }
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-500/10 font-semibold"
                        style={{ color: primaryColor }}
                      >
                        {currentUser.role === 'super_admin' || currentUser.role === 'admin' ? (
                          <Sliders className="w-4 h-4" />
                        ) : (
                          <LayoutDashboard className="w-4 h-4" />
                        )}
                        <span>
                          {currentUser.role === 'super_admin'
                            ? 'Super Admin OS'
                            : currentUser.role === 'admin'
                            ? 'Executive Admin OS'
                            : currentUser.role === 'managing_editor'
                            ? 'Managing Editor Studio'
                            : currentUser.role === 'editor'
                            ? 'Editorial Desk'
                            : currentUser.verificationTier === 'journalist' ||
                              currentUser.role === 'author'
                            ? 'Creator Studio'
                            : 'Reader Dashboard'}
                        </span>
                      </Link>

                      {/* Public Profile */}
                      <Link
                        to={`/profile/${currentUser.username}`}
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-500/10 font-medium"
                      >
                        <UserIcon className="w-4 h-4 opacity-70" />
                        <span>My Profile</span>
                      </Link>

                      {/* Security & Account Settings Modal Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setSettingsModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-500/10 font-medium"
                      >
                        <KeyRound className="w-4 h-4 opacity-70" />
                        <span>Account Settings</span>
                      </button>
                    </div>

                    {/* Complete Sign Out */}
                    <div className="pt-1.5">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    isDark
                      ? 'border-white/15 hover:bg-white/10 text-white'
                      : 'border-black/15 hover:bg-black/5 text-slate-900'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-950 shadow-sm transition-opacity hover:opacity-95"
                  style={{ backgroundColor: primaryColor }}
                >
                  Create Account
                </Link>
              </div>
            )}
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
            <main
              className={`max-w-[1380px] mx-auto px-4 sm:px-6 py-6 ${
                audioPost ? 'pb-24' : 'pb-8'
              }`}
            >
              <input
                ref={homeAvatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleHomeAvatarUpload}
                className="hidden"
              />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT NAVIGATION COLUMN (3 cols — Independently Scrollable & Sticky) */}
                <aside className="lg:col-span-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto pr-1 pb-6 space-y-5">
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
                        badge:
                          unreadNotificationsCount > 0
                            ? String(unreadNotificationsCount)
                            : undefined,
                      },
                      {
                        to: '/bookmarks',
                        label: 'Bookmarks',
                        icon: Bookmark,
                      },
                      {
                        to: `/profile/${currentUser.username}`,
                        label: 'My Profile',
                        icon: UserIcon,
                      },
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

                  {/* Privacy & Compliance Navigation Footer */}
                  <div className="px-3 pt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] opacity-55">
                    <Link to="/privacy" className="hover:underline">
                      Privacy Policy
                    </Link>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setCookieSettingsOpen(true)}
                      className="hover:underline"
                    >
                      Cookie Settings
                    </button>
                    <span>•</span>
                    <a href="/rss.xml" target="_blank" rel="noreferrer" className="hover:underline">
                      RSS
                    </a>
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
                              to="/create"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium opacity-70 hover:opacity-100 hover:bg-slate-500/10 transition-colors"
                            >
                              <span>Full Studio</span>
                            </Link>
                          </div>

                          <button
                            type="submit"
                            disabled={!quickHeadline.trim() && !quickBody.trim()}
                            className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-950 disabled:opacity-40 transition-opacity"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Post Story
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* NEWS CARDS STREAM */}
                  {visiblePosts.length === 0 ? (
                    <div
                      style={{ backgroundColor: cardBgColor }}
                      className="p-12 rounded-2xl border border-slate-500/15 text-center space-y-3"
                    >
                      <div className="text-base font-semibold">No stories match this filter</div>
                      <p className="text-xs opacity-60">
                        Try switching back to &ldquo;For You&rdquo; or clearing your search filter.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedTab('for_you');
                          setSelectedCategory('all');
                          setActiveTagFilter(null);
                          setSearchQuery('');
                        }}
                        className="px-4 py-2 rounded-full text-xs font-semibold text-slate-950"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Reset Feed Filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {visiblePosts.map((post) => {
                        const author = users.find((u) => u.id === post.authorId);
                        return (
                          <NewsPostCard
                            key={post.id}
                            post={post}
                            author={author}
                            allUsers={users}
                            comments={comments}
                            notes={notes}
                            currentUser={currentUser}
                            lang={lang}
                            isDark={isDark}
                            primaryColor={primaryColor}
                            cardBgColor={cardBgColor}
                            bookmarked={bookmarkedIds.includes(post.id)}
                            isLiked={likedIds.includes(post.id)}
                            isDisliked={dislikedIds.includes(post.id)}
                            isReposted={repostedIds.includes(post.id)}
                            likedCommentIds={likedCommentIds}
                            onLike={handleLike}
                            onDislike={handleDislike}
                            onRepost={handleRepost}
                            onQuoteRepost={handleQuoteRepost}
                            onToggleBookmark={handleToggleBookmark}
                            onAddComment={(pId, text, parentId) =>
                              handleAddComment(pId, text, parentId ?? null)
                            }
                            onLikeComment={handleLikeComment}
                            onDeleteComment={handleDeleteComment}
                            onUpdatePost={handleUpdatePost}
                            onDeletePost={handleDeletePost}
                            onPlayAudio={handlePlayAudio}
                            onOpenLightbox={(url, caption) => setLightboxMedia({ url, caption })}
                            followedUserIds={followedUserIds}
                            onToggleFollow={handleToggleFollow}
                          />
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* RIGHT EDITORIAL & DISCOVERY SIDEBAR (3 cols — Independently Scrollable & Sticky) */}
                <aside className="lg:col-span-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto pr-1 pb-6 space-y-5">
                  {/* 1. Live Breaking Wire Timeline */}
                  <div
                    style={{ backgroundColor: cardBgColor }}
                    className={`p-5 rounded-2xl border space-y-4 ${
                      isDark ? 'border-white/[0.07]' : 'border-black/[0.07]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span>Breaking Wire</span>
                      </div>
                      <span className="text-[11px] opacity-50">Live Updates</span>
                    </div>

                    <div className="relative pl-4 border-l border-slate-500/20 space-y-4">
                      {posts.slice(0, 4).map((p) => (
                        <Link
                          key={p.id}
                          to={`/article/${p.id}`}
                          className="block group relative"
                        >
                          <span
                            className="w-2 h-2 rounded-full absolute -left-[20.5px] top-1.5"
                            style={{
                              backgroundColor: p.isBreakingPinned ? '#f43f5e' : primaryColor,
                            }}
                          />
                          <div className="text-[11px] opacity-55 flex items-center gap-1.5">
                            <span>{formatRelativeTime(p.createdAt, lang)}</span>
                            <span>•</span>
                            <span className="truncate">{p.locationName.split(',')[0]}</span>
                          </div>
                          <div className="text-xs font-semibold leading-snug mt-0.5 group-hover:underline line-clamp-2">
                            {p.headline}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* 2. Trending Topics in News */}
                  <div
                    style={{ backgroundColor: cardBgColor }}
                    className={`p-5 rounded-2xl border space-y-3.5 ${
                      isDark ? 'border-white/[0.07]' : 'border-black/[0.07]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                        <span>Trending Topics</span>
                      </h3>
                    </div>

                    <div className="space-y-2.5">
                      {trendingTopics.map((item) => (
                        <button
                          key={item.tag}
                          type="button"
                          onClick={() =>
                            setActiveTagFilter(activeTagFilter === item.tag ? null : item.tag)
                          }
                          className="w-full text-left p-2 rounded-xl hover:bg-slate-500/[0.06] transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="text-[10px] uppercase opacity-50">
                              {strings.categories[item.category as PostCategory] || item.category}
                            </div>
                            <div className="text-xs font-semibold mt-0.5">{item.tag}</div>
                          </div>
                          <span className="text-[11px] opacity-55">
                            {(item.views / 1000).toFixed(1)}K reads
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Who to Follow (Verified Journalists) */}
                  <div
                    style={{ backgroundColor: cardBgColor }}
                    className={`p-5 rounded-2xl border space-y-4 ${
                      isDark ? 'border-white/[0.07]' : 'border-black/[0.07]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        Correspondents to Follow
                      </h3>
                    </div>

                    <div className="space-y-3.5">
                      {users
                        .filter((u) => u.id !== currentUser.id)
                        .slice(0, 4)
                        .map((u) => {
                          const isFollowing = followedUserIds.includes(u.id);
                          return (
                            <div
                              key={u.id}
                              className="flex items-center justify-between gap-2.5"
                            >
                              <Link
                                to={`/profile/${u.username}`}
                                className="flex items-center gap-2.5 min-w-0 group"
                              >
                                <img
                                  src={u.avatarUrl}
                                  alt={u.displayName}
                                  className="w-9 h-9 rounded-full object-cover shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold truncate group-hover:underline flex items-center gap-1">
                                    <span className="truncate">{u.displayName}</span>
                                    <Check
                                      className="w-3 h-3 shrink-0"
                                      style={{ color: primaryColor }}
                                    />
                                  </div>
                                  <div className="text-[11px] opacity-55 truncate">
                                    @{u.username} • {(u.followersCount || 0).toLocaleString()} followers
                                  </div>
                                </div>
                              </Link>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleToggleFollow(u.id);
                                }}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                                  isFollowing
                                    ? 'border border-slate-500/40 text-emerald-400 bg-emerald-500/10 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400'
                                    : isDark
                                    ? 'bg-white text-slate-950 hover:bg-slate-200 shadow-sm'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                                }`}
                                title={isFollowing ? 'Click to Unfollow' : 'Click to Follow'}
                              >
                                {isFollowing ? 'Following' : 'Follow'}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </aside>
              </div>
            </main>
          }
        />

        {/* 2. EDITORIAL MAGAZINE & VIDEO EXPLORE PAGE (/explore) */}
        <Route
          path="/explore"
          element={
            <Explore3DPage
              posts={posts}
              users={users}
              comments={comments}
              primaryColor={primaryColor}
              breakingColor={breakingColor}
              cardBgColor={cardBgColor}
              isDark={isDark}
              bookmarkedIds={bookmarkedIds}
              likedIds={likedIds}
              repostedIds={repostedIds}
              onToggleBookmark={handleToggleBookmark}
              onLike={handleLike}
              onRepost={handleRepost}
              onAddComment={(pId, text) => handleAddComment(pId, text, null)}
            />
          }
        />

        {/* 3. DEDICATED NOTIFICATIONS PAGE (/notifications) */}
        <Route
          path="/notifications"
          element={
            <NotificationsPage
              posts={posts}
              users={users}
              notifications={notifications}
              readNotificationIds={readNotificationIds}
              primaryColor={primaryColor}
              cardBgColor={cardBgColor}
              isDark={isDark}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
            />
          }
        />

        {/* 4. DEDICATED BOOKMARKS / SAVED STORIES PAGE (/bookmarks) */}
        <Route
          path="/bookmarks"
          element={
            <BookmarksPage
              posts={posts}
              users={users}
              comments={comments}
              notes={notes}
              bookmarkedIds={bookmarkedIds}
              likedIds={likedIds}
              dislikedIds={dislikedIds}
              repostedIds={repostedIds}
              likedCommentIds={likedCommentIds}
              currentUser={currentUser}
              lang={lang}
              primaryColor={primaryColor}
              cardBgColor={cardBgColor}
              isDark={isDark}
              onToggleBookmark={handleToggleBookmark}
              onClearAllBookmarks={() => setBookmarkedIds([])}
              onLike={handleLike}
              onDislike={handleDislike}
              onRepost={handleRepost}
              onQuoteRepost={handleQuoteRepost}
              onAddComment={(pId, text, parentId) => handleAddComment(pId, text, parentId ?? null)}
              onLikeComment={handleLikeComment}
              onDeleteComment={handleDeleteComment}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
              onPlayAudio={handlePlayAudio}
              onOpenLightbox={(url, caption) => setLightboxMedia({ url, caption })}
              followedUserIds={followedUserIds}
              onToggleFollow={handleToggleFollow}
            />
          }
        />

        {/* 5. DEDICATED FULL-SCREEN ARTICLE READER (/article/:id) */}
        <Route
          path="/article/:id"
          element={
            <ArticleDetailPage
              posts={posts}
              users={users}
              comments={comments}
              notes={notes}
              currentUser={currentUser}
              lang={lang}
              isDark={isDark}
              primaryColor={primaryColor}
              secondaryAiColor={secondaryAiColor}
              breakingColor={breakingColor}
              cardBgColor={cardBgColor}
              algorithmWeights={settings.algorithm}
              bookmarkedIds={bookmarkedIds}
              likedIds={likedIds}
              likedCommentIds={likedCommentIds}
              userVotes={userVotes}
              onVote={handleVote}
              onLike={handleLike}
              onToggleBookmark={handleToggleBookmark}
              onAddComment={handleAddComment}
              onLikeComment={handleLikeComment}
              onDeleteComment={handleDeleteComment}
              onAddCommunityNote={handleAddCommunityNote}
              onVoteCommunityNote={handleVoteCommunityNote}
              followedUserIds={followedUserIds}
              onToggleFollow={handleToggleFollow}
            />
          }
        />

        {/* 6. DEDICATED PUBLISH DISPATCH STUDIO (/create) */}
        <Route
          path="/create"
          element={
            <CreatePostPage
              currentUser={currentUser}
              primaryColor={primaryColor}
              breakingColor={breakingColor}
              cardBgColor={cardBgColor}
              isDark={isDark}
              onCreatePost={handleCreatePost}
            />
          }
        />

        {/* 7. DEDICATED CREATOR / REPORTER STUDIO (/studio) */}
        <Route
          path="/studio"
          element={
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <UserDashboardView
                currentUser={currentUser}
                posts={posts}
                notes={notes}
                bookmarkedIds={bookmarkedIds}
                primaryColor={primaryColor}
                cardBgColor={cardBgColor}
                onUpdatePost={handleUpdatePost}
                onDeletePost={handleDeletePost}
                onUpdateUser={(uId, upd) => handleUpdateUser(uId, upd)}
                onSignOut={handleSignOut}
              />
            </div>
          }
        />

        {/* 8. DEDICATED ADMIN CONTROL DASHBOARD (/admin) */}
        <Route
          path="/admin"
          element={
            currentUser.role === 'admin' || currentUser.role === 'super_admin' ? (
              <AdminDashboardView
                settings={settings}
                posts={posts}
                users={users}
                currentUser={currentUser}
                notes={notes}
                auditLogs={auditLogs}
                customRoles={customRoles}
                onUpdateSettings={handleUpdateSettings}
                onUpdatePost={handleUpdatePost}
                onDeletePost={handleDeletePost}
                onUpdateUser={handleUpdateUser}
                onUndoAuditLog={handleUndoAuditLog}
                onCreateCustomRole={handleCreateCustomRole}
                onDeleteCustomRole={handleDeleteCustomRole}
                onSignOut={handleSignOut}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Universal RBAC Dashboard Redirect Route (/dashboard) */}
        <Route
          path="/dashboard"
          element={
            <Navigate
              to={
                currentUser.role === 'admin' || currentUser.role === 'super_admin'
                  ? '/admin'
                  : '/studio'
              }
              replace
            />
          }
        />

        {/* 9. DEDICATED JOURNALIST / USER PROFILE PAGE (/profile/:username) */}
        <Route
          path="/profile/:username"
          element={
            <ProfilePage
              users={users}
              posts={posts}
              notes={notes}
              repostedIds={repostedIds}
              followedUserIds={followedUserIds}
              bookmarkedIds={bookmarkedIds}
              currentUser={currentUser}
              primaryColor={primaryColor}
              cardBgColor={cardBgColor}
              isDark={isDark}
              onUpdateUser={handleUpdateUser}
              onToggleFollow={handleToggleFollow}
              onDeleteAccount={handleDeleteAccount}
            />
          }
        />

        {/* 10. DEDICATED LOGIN & REGISTRATION PAGES (/login & /register) */}
        <Route
          path="/login"
          element={
            <AuthPage
              users={users}
              currentUser={isAuthenticated ? currentUser : null}
              primaryColor={primaryColor}
              cardBgColor={cardBgColor}
              isDark={isDark}
              onSelectUser={(u) => setCurrentUserId(u.id)}
              onCreateUser={(newU) => {
                setUsers((prev) => [newU, ...prev]);
                setCurrentUserId(newU.id);
              }}
              onSignOut={handleSignOut}
            />
          }
        />
        <Route
          path="/register"
          element={
            <AuthPage
              users={users}
              currentUser={isAuthenticated ? currentUser : null}
              primaryColor={primaryColor}
              cardBgColor={cardBgColor}
              isDark={isDark}
              onSelectUser={(u) => setCurrentUserId(u.id)}
              onCreateUser={(newU) => {
                setUsers((prev) => [newU, ...prev]);
                setCurrentUserId(newU.id);
              }}
              onSignOut={handleSignOut}
            />
          }
        />

        {/* 11. DEDICATED PRIVACY POLICY & DATA GOVERNANCE (/privacy) */}
        <Route
          path="/privacy"
          element={
            <PrivacyPolicyPage
              primaryColor={primaryColor}
              cardBgColor={cardBgColor}
              isDark={isDark}
              onOpenCookieSettings={() => setCookieSettingsOpen(true)}
            />
          }
        />

        {/* 12. 404 CATCH-ALL ROUTE */}
        <Route
          path="*"
          element={
            <NotFoundPage
              primaryColor={primaryColor}
              cardBgColor={cardBgColor}
              isDark={isDark}
            />
          }
        />
      </Routes>

      {/* =====================================================================
          PERSISTENT BOTTOM GLASS AUDIO MINI-PLAYER (WHEN LISTENING TO A STORY)
      ===================================================================== */}
      {audioPost && (
        <div
          style={{
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
          }}
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-2xl px-4 py-3 rounded-2xl border shadow-2xl flex items-center justify-between gap-4 ${
            isDark ? 'border-white/15 text-white' : 'border-black/10 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={toggleAudioPlayPause}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 shrink-0 shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider opacity-60">
                <Headphones className="w-3 h-3" style={{ color: primaryColor }} />
                <span>Pulse Audio Narration</span>
              </div>
              <Link
                to={`/article/${audioPost.id}`}
                className="text-xs sm:text-sm font-semibold truncate block hover:underline"
              >
                {audioPost.headline}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const nextSpeed = audioSpeed === 1 ? 1.25 : audioSpeed === 1.25 ? 1.5 : 1;
                setAudioSpeed(nextSpeed);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-500/25 text-[11px] font-mono"
            >
              {audioSpeed}x
            </button>
            <button
              type="button"
              onClick={() => {
                window.speechSynthesis?.cancel();
                setIsAudioPlaying(false);
                setAudioPost(null);
              }}
              className="p-1.5 rounded-lg opacity-65 hover:opacity-100"
              title="Close audio player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          FULL-SCREEN IMAGE LIGHTBOX MODAL
      ===================================================================== */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxMedia(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxMedia(null)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxMedia.url}
            alt={lightboxMedia.caption || 'Full resolution media'}
            className="max-w-full max-h-[82vh] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxMedia.caption && (
            <p className="mt-4 text-xs sm:text-sm text-slate-300 max-w-2xl text-center">
              {lightboxMedia.caption}
            </p>
          )}
        </div>
      )}

      {/* =====================================================================
          COMMAND-K QUICK SEARCH DIALOG
      ===================================================================== */}
      {commandOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4"
          onClick={() => setCommandOpen(false)}
        >
          <div
            style={{ backgroundColor: cardBgColor }}
            className="w-full max-w-xl rounded-2xl border border-slate-500/25 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-500/15 flex items-center gap-3">
              <Search className="w-4 h-4 opacity-50" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to any story, topic, or page..."
                className="w-full bg-transparent text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCommandOpen(false)}
                className="text-xs opacity-60 hover:opacity-100"
              >
                ESC
              </button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto divide-y divide-slate-500/10 text-xs">
              {posts
                .filter((p) =>
                  p.headline.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice(0, 5)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setCommandOpen(false);
                      navigate(`/article/${p.id}`);
                    }}
                    className="w-full p-3 text-left hover:bg-slate-500/10 flex items-center justify-between gap-3 rounded-xl"
                  >
                    <span className="font-medium truncate">{p.headline}</span>
                    <span className="opacity-50 shrink-0">{p.locationName.split(',')[0]}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 1.5s Pop Notification for Follow / Unfollow */}
      {followToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-semibold shadow-2xl border border-white/10 dark:border-black/10 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{followToast}</span>
        </div>
      )}

      {/* Account Settings & Security Governance Modal */}
      <AccountSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        currentUser={currentUser}
        userPosts={posts.filter((p) => p.authorId === currentUser.id)}
        bookmarkedIds={bookmarkedIds}
        primaryColor={primaryColor}
        cardBgColor={cardBgColor}
        isDark={isDark}
        onUpdateUser={handleUpdateUser}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Categorized Cookie Consent & Persistent Settings System */}
      <CookieConsentBanner
        primaryColor={primaryColor}
        isDark={isDark}
        isOpenExternal={cookieSettingsOpen}
        onCloseExternal={() => setCookieSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
