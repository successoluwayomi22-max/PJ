import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Compass,
  CornerDownRight,
  Download,
  ExternalLink,
  FileText,
  Film,
  Flag,
  Heart,
  Image as ImageIcon,
  Languages,
  Link2,
  Mail,
  MapPin,
  MessageSquare,
  Radio,
  Share2,
  ShieldAlert,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AlgorithmWeights,
  CommentItem,
  CommunityNote,
  LanguageCode,
  NewsPost,
  User,
} from '../types';
import { computePostRankScore } from '../mockData';
import { formatRelativeTime, UI_STRINGS } from '../i18n';
import { hasPermission } from '../utils/rbac';
import { Panorama360Viewer } from '../components/Panorama360Viewer';

interface ArticleDetailPageProps {
  posts: NewsPost[];
  users: User[];
  comments: CommentItem[];
  notes: CommunityNote[];
  currentUser: User;
  lang: LanguageCode;
  isDark: boolean;
  primaryColor: string;
  secondaryAiColor: string;
  breakingColor: string;
  cardBgColor: string;
  algorithmWeights: AlgorithmWeights;
  bookmarkedIds: string[];
  likedIds?: string[];
  likedCommentIds?: string[];
  userVotes: Record<string, 'up' | 'down'>;
  onVote: (postId: string, dir: 'up' | 'down') => void;
  onLike?: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onAddComment: (postId: string, content: string, parentId?: string | null) => void;
  onLikeComment?: (commentId: string) => void;
  onDeleteComment?: (commentId: string, postId: string) => void;
  followedUserIds?: string[];
  onToggleFollow?: (userId: string) => void;
  onAddCommunityNote: (postId: string, noteText: string, sourceUrl: string) => void;
  onVoteCommunityNote: (noteId: string, helpful: boolean) => void;
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({
  posts,
  users,
  comments,
  notes,
  currentUser,
  lang,
  isDark,
  primaryColor,
  secondaryAiColor,
  cardBgColor,
  algorithmWeights,
  bookmarkedIds,
  likedIds = [],
  likedCommentIds = [],
  userVotes,
  onVote,
  onLike,
  onToggleBookmark,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  followedUserIds = [],
  onToggleFollow,
  onAddCommunityNote,
  onVoteCommunityNote,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const strings = UI_STRINGS[lang];

  const post = posts.find((p) => p.id === id) || posts[0];
  const author = users.find((u) => u.id === post?.authorId);

  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg'>('md');
  const [isTranslated, setIsTranslated] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commentSort, setCommentSort] = useState<'top' | 'newest' | 'oldest'>('top');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteSource, setNoteSource] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadedToast, setDownloadedToast] = useState(false);
  const [reportedCommentId, setReportedCommentId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (post) {
      document.title = `${post.headline} | Pulse News`;

      let script = document.getElementById('json-ld-news-article') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = 'json-ld-news-article';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: post.headline,
        description: post.bodyText.slice(0, 200),
        datePublished: post.createdAt,
        dateModified: post.createdAt,
        image: post.media[0]?.url || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200',
        author: {
          '@type': 'Person',
          name: author?.displayName || 'Correspondent',
          url: `https://pulse-news.org/profile/${author?.username || 'reporter'}`,
        },
        publisher: {
          '@type': 'NewsMediaOrganization',
          name: 'Pulse News Global',
          logo: {
            '@type': 'ImageObject',
            url: 'https://pulse-news.org/logo.png',
          },
        },
      });
    }

    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollProgress(Math.min(100, Math.round((window.scrollY / total) * 100)));
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.speechSynthesis?.cancel();
      document.title = 'Pulse News | Global Live Intelligence & Open Journalism';
      const existingScript = document.getElementById('json-ld-news-article');
      if (existingScript) existingScript.remove();
    };
  }, [id, post, author]);

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <h1 className="font-editorial text-3xl">Dispatch Not Found</h1>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-full text-xs font-semibold bg-white text-slate-950"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const rank = computePostRankScore(post, author, algorithmWeights, notes);
  const postNotes = notes.filter((n) => n.postId === post.id);
  const postComments = comments.filter((c) => c.postId === post.id);
  const topLevelComments = postComments
    .filter((c) => !c.parentCommentId)
    .sort((a, b) => {
      if (commentSort === 'top') return b.upvotes - a.upvotes;
      if (commentSort === 'newest')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  const activeMedia = post.media[activeMediaIdx] || post.media[0];
  const bookmarked = bookmarkedIds.includes(post.id);
  const isLiked = likedIds.includes(post.id) || userVotes[post.id] === 'up';
  const userVote = userVotes[post.id];
  const isFollowingAuthor = author ? followedUserIds.includes(author.id) : false;

  const handleDownloadArticleReport = () => {
    const lines = [
      '====================================================================',
      `PULSE NEWS — FULL ARTICLE & COMMENTS ARCHIVE`,
      '====================================================================',
      `HEADLINE: ${post.headline}`,
      `AUTHOR: ${author?.displayName || 'Correspondent'} (@${author?.username || 'reporter'})`,
      `LOCATION: ${post.locationName}`,
      `PUBLISHED: ${new Date(post.createdAt).toLocaleString()}`,
      '--------------------------------------------------------------------',
      '',
      post.bodyText,
      '',
      'KEY FINDINGS:',
      ...post.aiSummary.map((s, idx) => `${idx + 1}. ${s}`),
      '',
      '--------------------------------------------------------------------',
      `ALL COMMENTS (${postComments.length}):`,
      '--------------------------------------------------------------------',
      ...postComments.map((c) => {
        const u = users.find((usr) => usr.id === c.authorId);
        return `@${u?.username || 'reader'} (${c.upvotes} likes): "${c.content}"`;
      }),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulse-article-${post.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedToast(true);
    setTimeout(() => setDownloadedToast(false), 2200);
  };

  const targetLang: LanguageCode = lang === 'en' ? 'es' : lang;
  const translated = post.translations?.[targetLang] || {
    headline: `[${targetLang.toUpperCase()}] ${post.headline}`,
    bodyText: post.bodyText,
  };

  const headline = isTranslated ? translated.headline : post.headline;
  const body = isTranslated ? translated.bodyText : post.bodyText;

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `${headline}. Reported from ${post.locationName} by ${
          author?.displayName || 'Correspondent'
        }. ${body}. ${post.aiSummary.join(' ')}`
      );
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <div className="relative pb-24">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent pointer-events-none">
        <div
          className="h-full transition-all duration-150"
          style={{ width: `${scrollProgress}%`, backgroundColor: primaryColor }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Story Forensics & Category Metadata Bar */}
        <div className="flex items-center justify-end pb-4 mb-6 border-b border-slate-500/15">
          <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-wider opacity-70">
            <span>{strings.categories[post.category] || post.category}</span>
            <span>•</span>
            <span>C2PA {post.forensics.authenticityScore}%</span>
            <span>•</span>
            <span>INDEX {rank.totalScore}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* MAIN EDITORIAL COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            {/* Editorial Header */}
            <header className="space-y-5">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                {post.isEyewitness && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    <Radio className="w-3 h-3 animate-pulse" /> On-Scene Eyewitness Dispatch
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs opacity-70">
                  <MapPin className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  {post.locationName} ({post.latitude.toFixed(3)}°N, {post.longitude.toFixed(3)}°E)
                </span>
              </div>

              <h1 className="font-editorial text-3xl sm:text-4xl md:text-[44px] font-semibold leading-[1.15] tracking-tight">
                {headline}
              </h1>

              {/* Author Byline & Utility Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-500/15">
                <div className="flex items-center gap-3">
                  <Link
                    to={`/profile/${author?.username || 'correspondent'}`}
                    className="flex items-center gap-3 group"
                  >
                    <img
                      src={author?.avatarUrl}
                      alt={author?.displayName}
                      className="w-11 h-11 rounded-full object-cover ring-1 ring-white/20"
                    />
                    <div>
                      <div className="font-semibold text-sm group-hover:underline flex items-center gap-1.5">
                        <span>{author?.displayName}</span>
                        <span
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full"
                          style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      </div>
                      <div className="text-xs opacity-60 font-mono">
                        @{author?.username} • {Math.round((author?.trustScore ?? 0.9) * 100)}% Trust •{' '}
                        {formatRelativeTime(post.createdAt, lang)}
                      </div>
                    </div>
                  </Link>

                  {author && author.id !== currentUser.id && onToggleFollow && (
                    <button
                      type="button"
                      onClick={() => onToggleFollow(author.id)}
                      className={`ml-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        isFollowingAuthor
                          ? 'border border-slate-500/30 opacity-75 hover:opacity-100'
                          : 'text-slate-950 font-bold'
                      }`}
                      style={!isFollowingAuthor ? { backgroundColor: primaryColor } : undefined}
                    >
                      {isFollowingAuthor ? 'Following' : '+ Follow'}
                    </button>
                  )}
                </div>

                {/* Reader Controls: Audio TTS, Font Size, Translate, Bookmark */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleSpeech}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isSpeaking
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : 'border-slate-500/25 hover:bg-slate-500/10'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" /> Stop Audio
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" /> Listen
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTranslated((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isTranslated
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/50'
                        : 'border-slate-500/25 hover:bg-slate-500/10'
                    }`}
                  >
                    <Languages className="w-3.5 h-3.5" />
                    <span>{isTranslated ? 'Original' : `Translate (${targetLang.toUpperCase()})`}</span>
                  </button>

                  <div className="inline-flex items-center rounded-full border border-slate-500/25 p-0.5 text-[11px] font-mono">
                    {(['sm', 'md', 'lg'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setFontScale(sz)}
                        className={`px-2 py-0.5 rounded-full uppercase ${
                          fontScale === sz ? 'bg-slate-500/25 font-bold' : 'opacity-60'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleBookmark(post.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      bookmarked
                        ? 'border-sky-400 text-sky-400 bg-sky-500/10'
                        : 'border-slate-500/25 hover:bg-slate-500/10'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                    <span>{bookmarked ? 'Saved' : 'Save'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadArticleReport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-500/25 hover:bg-slate-500/10 transition-colors"
                  >
                    {downloadedToast ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Downloaded</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </>
                    )}
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowShareMenu((v) => !v);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-500/25 hover:bg-slate-500/10"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied Link</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </>
                      )}
                    </button>

                    {showShareMenu && (
                      <div
                        style={{ backgroundColor: cardBgColor }}
                        className={`absolute right-0 top-10 w-56 rounded-2xl border p-1.5 shadow-2xl z-30 text-xs space-y-0.5 ${
                          isDark ? 'border-white/15' : 'border-black/15'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(window.location.href);
                            setCopied(true);
                            setShowShareMenu(false);
                            setTimeout(() => setCopied(false), 1500);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10 font-medium"
                        >
                          <Link2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>Copy Story Link</span>
                        </button>
                        <a
                          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                            post.headline
                          )}&url=${encodeURIComponent(window.location.href)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => setShowShareMenu(false)}
                          className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10 font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                          <span>Share on X / Twitter</span>
                        </a>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `${post.headline} — ${window.location.href}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => setShowShareMenu(false)}
                          className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10 font-medium"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Share on WhatsApp</span>
                        </a>
                        <a
                          href={`mailto:?subject=${encodeURIComponent(
                            post.headline
                          )}&body=${encodeURIComponent(
                            `${post.headline}\n\n${post.bodyText}\n\nRead full story: ${window.location.href}`
                          )}`}
                          onClick={() => setShowShareMenu(false)}
                          className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10 font-medium"
                        >
                          <Mail className="w-3.5 h-3.5 text-amber-400" />
                          <span>Share via Email</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Cinema Media Showcase */}
            {post.media.length > 0 && (
              <div className="space-y-3">
                {post.media.length > 1 && (
                  <div className="flex items-center gap-2">
                    {post.media.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveMediaIdx(idx)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                          activeMediaIdx === idx
                            ? isDark
                              ? 'bg-white text-slate-950'
                              : 'bg-slate-900 text-white'
                            : 'bg-slate-500/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        {item.type === 'video' && <Film className="w-3.5 h-3.5" />}
                        {item.type === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                        {item.type === 'panorama_360' && <Compass className="w-3.5 h-3.5" />}
                        <span>
                          {item.type === 'video'
                            ? '4K Field Stream'
                            : item.type === 'panorama_360'
                            ? 'WebGL 360° Sphere'
                            : `Photograph 0${idx + 1}`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {activeMedia.type === 'panorama_360' ? (
                  <Panorama360Viewer
                    imageUrl={activeMedia.url}
                    caption={activeMedia.caption}
                    locationName={post.locationName}
                  />
                ) : activeMedia.type === 'video' ? (
                  <div className="rounded-2xl overflow-hidden bg-black border border-white/10">
                    <video
                      src={activeMedia.url}
                      poster={activeMedia.thumbnailUrl}
                      controls
                      playsInline
                      className="w-full max-h-[500px] object-cover"
                    />
                    {activeMedia.caption && (
                      <div className="px-4 py-2.5 bg-black/90 text-xs text-slate-300 font-mono">
                        {activeMedia.caption}
                      </div>
                    )}
                  </div>
                ) : (
                  <figure className="rounded-2xl overflow-hidden border border-slate-500/15">
                    <img
                      src={activeMedia.url}
                      alt={activeMedia.caption || headline}
                      className="w-full max-h-[520px] object-cover"
                    />
                    {activeMedia.caption && (
                      <figcaption className="px-4 py-2.5 text-xs opacity-70 border-t border-slate-500/15">
                        {activeMedia.caption}
                      </figcaption>
                    )}
                  </figure>
                )}
              </div>
            )}

            {/* Executive Summary Box */}
            <div
              style={{ backgroundColor: cardBgColor }}
              className="p-5 sm:p-6 rounded-2xl border border-slate-500/15 space-y-3"
            >
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest opacity-65">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" style={{ color: secondaryAiColor }} />
                  Story Highlights & Key Findings
                </span>
                <span>Verified Transcript</span>
              </div>
              <ul className="space-y-2 text-sm sm:text-[15px] leading-relaxed">
                {post.aiSummary.map((pt, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="font-mono text-xs opacity-50 mt-1">0{i + 1}</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Article Lead & Full Editorial Body */}
            <div
              className={`font-editorial leading-[1.82] space-y-5 ${
                fontScale === 'sm'
                  ? 'text-base'
                  : fontScale === 'lg'
                  ? 'text-xl sm:text-2xl'
                  : 'text-lg sm:text-[19px]'
              }`}
            >
              <p className="first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:leading-none">
                {body}
              </p>
              <p className="opacity-85">
                Field telemetry captured from {post.locationName} confirms the timeline submitted by{' '}
                {author?.displayName || 'the reporting correspondent'}. Under the Open-Verify C2PA
                protocol, hardware sensor signatures and atmospheric telemetry are cross-referenced
                automatically against satellite weather and grid logs before elevating a dispatch to
                the global priority stream.
              </p>
            </div>

            {/* Tags & Engagement Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-y border-slate-500/15">
              <div className="flex flex-wrap items-center gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-mono bg-slate-500/10"
                    style={{ color: primaryColor }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => (onLike ? onLike(post.id) : onVote(post.id, 'up'))}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                    isLiked
                      ? 'bg-rose-500 text-white border-rose-400'
                      : 'border-slate-500/25 hover:bg-slate-500/10'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{isLiked ? 'Liked' : 'Like'} ({post.upvotes})</span>
                </button>
                <button
                  type="button"
                  onClick={() => onVote(post.id, 'down')}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs border transition-colors ${
                    userVote === 'down'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                      : 'border-slate-500/25 opacity-70 hover:opacity-100'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Dislike ({post.downvotes})</span>
                </button>
              </div>
            </div>

            {/* Threaded Discussion Section */}
            <section className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  All Reader Comments ({postComments.length})
                </h3>
                <div className="flex items-center gap-1 text-xs">
                  {(['top', 'newest', 'oldest'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCommentSort(mode)}
                      className={`px-3 py-1 rounded-full capitalize transition-colors ${
                        commentSort === mode
                          ? isDark
                            ? 'bg-white text-slate-950 font-semibold'
                            : 'bg-slate-900 text-white font-semibold'
                          : 'opacity-65 hover:opacity-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5"
                />
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && commentText.trim()) {
                      onAddComment(post.id, commentText.trim(), null);
                      setCommentText('');
                    }
                  }}
                  placeholder={`Write a comment as ${currentUser.displayName}...`}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-500/10 border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!commentText.trim()) return;
                    onAddComment(post.id, commentText.trim(), null);
                    setCommentText('');
                  }}
                  className="px-6 py-3 rounded-xl text-xs font-semibold text-slate-950 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  Post Comment
                </button>
              </div>

              <div className="space-y-3">
                {topLevelComments.map((c) => {
                  const cAuthor = users.find((u) => u.id === c.authorId);
                  const cLiked = likedCommentIds.includes(c.id);
                  const childReplies = postComments.filter((r) => r.parentCommentId === c.id);
                  const isOwnComment = c.authorId === currentUser.id;
                  const canModerate = hasPermission(currentUser, 'comments.moderate');
                  const canDeleteOwn = hasPermission(currentUser, 'comments.delete_own', {
                    resourceAuthorId: c.authorId,
                  });
                  const canDelete = (isOwnComment && canDeleteOwn) || canModerate;

                  return (
                    <div
                      key={c.id}
                      style={{ backgroundColor: cardBgColor }}
                      className="p-4 rounded-xl border border-slate-500/15 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <Link
                          to={`/profile/${cAuthor?.username || 'member'}`}
                          className="font-semibold hover:underline flex items-center gap-2"
                        >
                          <img
                            src={cAuthor?.avatarUrl}
                            alt={cAuthor?.displayName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span>{cAuthor?.displayName || 'Citizen'}</span>
                          <span className="font-mono opacity-50">@{cAuthor?.username}</span>
                        </Link>
                        <span className="font-mono text-[11px] opacity-55">
                          {formatRelativeTime(c.createdAt, lang)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed opacity-90">{c.content}</p>

                      {/* Comment Actions */}
                      <div className="flex items-center gap-4 pt-1 text-xs opacity-75">
                        <button
                          type="button"
                          onClick={() => onLikeComment && onLikeComment(c.id)}
                          className={`inline-flex items-center gap-1 font-medium ${
                            cLiked ? 'text-rose-500 font-semibold' : 'hover:text-rose-500'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${cLiked ? 'fill-current' : ''}`} />
                          <span>{cLiked ? 'Liked' : 'Like'} ({c.upvotes})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyingToId(replyingToId === c.id ? null : c.id)}
                          className="inline-flex items-center gap-1 font-medium hover:text-sky-400"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>
                        {canDelete && onDeleteComment && (
                          <button
                            type="button"
                            onClick={() => onDeleteComment(c.id, post.id)}
                            className={`inline-flex items-center gap-1 hover:underline ${
                              isOwnComment ? 'text-rose-400' : 'text-amber-400 font-semibold'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isOwnComment ? 'Delete' : 'Admin Remove'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setReportedCommentId(c.id);
                            setTimeout(() => setReportedCommentId(null), 2500);
                          }}
                          className={`inline-flex items-center gap-1 transition-colors ${
                            reportedCommentId === c.id ? 'text-amber-400 font-semibold' : 'hover:text-amber-400'
                          }`}
                          title="Report comment for community review"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>{reportedCommentId === c.id ? 'Reported' : 'Report'}</span>
                        </button>
                      </div>

                      {/* Reply Input */}
                      {replyingToId === c.id && (
                        <div className="flex gap-2 pt-2">
                          <input
                            type="text"
                            autoFocus
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && replyText.trim()) {
                                onAddComment(post.id, replyText.trim(), c.id);
                                setReplyText('');
                                setReplyingToId(null);
                              }
                            }}
                            placeholder={`Reply to @${cAuthor?.username || 'reader'}...`}
                            className="flex-1 px-3.5 py-2 rounded-lg bg-slate-500/10 border border-slate-500/20 text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!replyText.trim()) return;
                              onAddComment(post.id, replyText.trim(), c.id);
                              setReplyText('');
                              setReplyingToId(null);
                            }}
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-950"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Reply
                          </button>
                        </div>
                      )}

                      {/* Nested Replies */}
                      {childReplies.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2 border-slate-500/20 space-y-2.5 pt-1">
                          {childReplies.map((r) => {
                            const rAuthor = users.find((u) => u.id === r.authorId);
                            const rLiked = likedCommentIds.includes(r.id);
                            const isOwnReply = r.authorId === currentUser.id;
                            const canDeleteReplyOwn = hasPermission(currentUser, 'comments.delete_own', {
                              resourceAuthorId: r.authorId,
                            });
                            const canDeleteReply = (isOwnReply && canDeleteReplyOwn) || canModerate;
                            return (
                              <div key={r.id} className="space-y-1 text-xs">
                                <div className="flex items-center justify-between">
                                  <Link
                                    to={`/profile/${rAuthor?.username || 'reader'}`}
                                    className="font-semibold hover:underline flex items-center gap-2"
                                  >
                                    <img
                                      src={rAuthor?.avatarUrl}
                                      alt={rAuthor?.displayName}
                                      className="w-5 h-5 rounded-full object-cover"
                                    />
                                    <span>{rAuthor?.displayName || 'Reader'}</span>
                                    <span className="opacity-50">@{rAuthor?.username}</span>
                                  </Link>
                                  <span className="opacity-50 text-[11px]">
                                    {formatRelativeTime(r.createdAt, lang)}
                                  </span>
                                </div>
                                <p className="opacity-90 leading-relaxed pl-7">{r.content}</p>
                                <div className="pl-7 flex items-center gap-3 text-[11px] opacity-75">
                                  <button
                                    type="button"
                                    onClick={() => onLikeComment && onLikeComment(r.id)}
                                    className={`inline-flex items-center gap-1 ${
                                      rLiked ? 'text-rose-500 font-semibold' : 'hover:text-rose-500'
                                    }`}
                                  >
                                    <Heart
                                      className={`w-3 h-3 ${rLiked ? 'fill-current' : ''}`}
                                    />
                                    <span>{rLiked ? 'Liked' : 'Like'} ({r.upvotes})</span>
                                  </button>
                                  {canDeleteReply && onDeleteComment && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteComment(r.id, post.id)}
                                      className={`inline-flex items-center gap-1 hover:underline ${
                                        isOwnReply
                                          ? 'text-rose-400'
                                          : 'text-amber-400 font-semibold'
                                      }`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>{isOwnReply ? 'Delete' : 'Admin Remove'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR: PROVENANCE PASSPORT & COMMUNITY NOTES */}
          <aside className="lg:col-span-4 space-y-6">
            {/* C2PA Cryptographic Provenance Passport */}
            <div
              style={{ backgroundColor: cardBgColor }}
              className="p-5 rounded-2xl border border-slate-500/15 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-500/15">
                <span className="font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-4 h-4" /> Provenance Passport
                </span>
                <span className="font-mono font-bold text-sm text-emerald-400">
                  {post.forensics.authenticityScore}/100
                </span>
              </div>

              <div className="space-y-2.5 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-500/10">
                  <span className="opacity-60">Hardware Signature</span>
                  <span>{post.forensics.exifVerified ? 'Verified C2PA' : 'Unsigned'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-500/10">
                  <span className="opacity-60">Weather & Satellite</span>
                  <span>{post.forensics.gpsWeatherMatch ? 'Confirmed' : 'Mismatch'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-500/10">
                  <span className="opacity-60">Synthetic Probability</span>
                  <span>{post.forensics.deepfakeProbability}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-500/10">
                  <span className="opacity-60">Archive Index</span>
                  <span>{post.forensics.recycledFootageCheck}</span>
                </div>
                <div className="pt-1 opacity-70 leading-relaxed">
                  {post.forensics.deviceSignature}
                </div>
              </div>

              {post.externalSourceUrl && (
                <a
                  href={post.externalSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 flex items-center justify-between font-medium transition-colors"
                >
                  <span>Primary Wire Reference</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Community Fact-Check Notes Card */}
            <div
              style={{ backgroundColor: cardBgColor }}
              className="p-5 rounded-2xl border border-slate-500/15 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase tracking-wider font-semibold">
                  Community Context Notes
                </span>
                <button
                  type="button"
                  onClick={() => setShowNoteForm((v) => !v)}
                  className="text-sky-400 hover:underline font-medium"
                >
                  + Add Note
                </button>
              </div>

              {showNoteForm && (
                <div className="p-3 rounded-xl bg-slate-500/10 space-y-2.5">
                  <textarea
                    rows={3}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Provide neutral verification context..."
                    className="w-full p-2.5 rounded-lg bg-black/30 border border-white/15 focus:outline-none"
                  />
                  <input
                    type="url"
                    value={noteSource}
                    onChange={(e) => setNoteSource(e.target.value)}
                    placeholder="Citation URL (https://...)"
                    className="w-full p-2 rounded-lg bg-black/30 border border-white/15 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!noteText.trim()) return;
                      onAddCommunityNote(
                        post.id,
                        noteText.trim(),
                        noteSource.trim() || 'https://c2pa.org'
                      );
                      setNoteText('');
                      setNoteSource('');
                      setShowNoteForm(false);
                    }}
                    className="w-full py-2 rounded-lg font-semibold bg-emerald-500 text-slate-950"
                  >
                    Submit Verification Note
                  </button>
                </div>
              )}

              {postNotes.length === 0 ? (
                <p className="opacity-60 leading-relaxed">
                  No disputes or context notes filed on this dispatch.
                </p>
              ) : (
                postNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-xl border border-slate-500/20 bg-slate-500/[0.04] space-y-2"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-emerald-400">
                      {note.status === 'rated_misleading' ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span>{note.status.replace('_', ' ')}</span>
                    </div>
                    <p className="leading-relaxed opacity-90">{note.noteText}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-500/15 text-[11px]">
                      <button
                        type="button"
                        onClick={() => onVoteCommunityNote(note.id, true)}
                        className="hover:text-emerald-400"
                      >
                        Helpful ({note.helpfulVotes})
                      </button>
                      <button
                        type="button"
                        onClick={() => onVoteCommunityNote(note.id, false)}
                        className="opacity-60 hover:opacity-100"
                      >
                        Unhelpful ({note.unhelpfulVotes})
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>

        {/* Bottom Back Navigation Bar */}
        <div className="pt-10 pb-6 flex items-center justify-start border-t border-slate-500/15 mt-10">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold border border-slate-500/25 hover:bg-slate-500/10 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

