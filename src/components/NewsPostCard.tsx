import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Check,
  CornerDownRight,
  Download,
  Edit3,
  ExternalLink,
  FileJson,
  FileText,
  Heart,
  Headphones,
  Image as ImageIcon,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pin,
  Repeat2,
  Send,
  Share2,
  ShieldCheck,
  ThumbsDown,
  Trash2,
} from 'lucide-react';
import { CommentItem, CommunityNote, LanguageCode, NewsPost, User } from '../types';
import { formatCompactNumber, formatRelativeTime } from '../i18n';
import { hasPermission } from '../utils/rbac';

interface NewsPostCardProps {
  post: NewsPost;
  author: User | undefined;
  allUsers: User[];
  comments: CommentItem[];
  notes: CommunityNote[];
  currentUser: User;
  lang: LanguageCode;
  isDark: boolean;
  primaryColor: string;
  cardBgColor: string;
  bookmarked: boolean;
  isLiked: boolean;
  isDisliked?: boolean;
  isReposted: boolean;
  likedCommentIds?: string[];
  onLike: (postId: string) => void;
  onDislike?: (postId: string) => void;
  onRepost: (postId: string) => void;
  onQuoteRepost?: (originalPost: NewsPost, quoteText: string) => void;
  onToggleBookmark: (postId: string) => void;
  onAddComment: (postId: string, content: string, parentCommentId?: string | null) => void;
  onLikeComment?: (commentId: string) => void;
  onDeleteComment?: (commentId: string, postId: string) => void;
  onUpdatePost: (postId: string, updates: Partial<NewsPost>, reason: string) => void;
  onDeletePost: (postId: string) => void;
  onPlayAudio?: (post: NewsPost) => void;
  onOpenLightbox?: (imageUrl: string, caption?: string) => void;
  followedUserIds?: string[];
  onToggleFollow?: (userId: string) => void;
}

export const NewsPostCard: React.FC<NewsPostCardProps> = ({
  post,
  author,
  allUsers,
  comments,
  notes,
  currentUser,
  lang,
  isDark,
  primaryColor,
  cardBgColor,
  bookmarked,
  isLiked,
  isDisliked = false,
  isReposted,
  likedCommentIds = [],
  onLike,
  onDislike,
  onRepost,
  onQuoteRepost,
  onToggleBookmark,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  onUpdatePost,
  onDeletePost,
  onPlayAudio,
  onOpenLightbox,
  followedUserIds = [],
  onToggleFollow,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentSort, setCommentSort] = useState<'top' | 'newest' | 'oldest'>('top');
  const [commentText, setCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const [showMenu, setShowMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showQuoteBox, setShowQuoteBox] = useState(false);
  const [quoteText, setQuoteText] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editHeadline, setEditHeadline] = useState(post.headline);
  const [editBody, setEditBody] = useState(post.bodyText);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [showRepostUndoPop, setShowRepostUndoPop] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const isFollowingAuthor = author ? followedUserIds.includes(author.id) : false;

  const postComments = comments.filter((c) => c.postId === post.id);
  const topLevelComments = postComments
    .filter((c) => !c.parentCommentId)
    .sort((a, b) => {
      if (commentSort === 'top') return b.upvotes - a.upvotes;
      if (commentSort === 'newest')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const postNotes = notes.filter((n) => n.postId === post.id);
  const canModify =
    hasPermission(
      currentUser,
      'articles.update_own',
      { resourceAuthorId: post.authorId }
    ) || hasPermission(currentUser, 'articles.update_any');

  const triggerToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 1500);
  };

  const repostPopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRepostUndoPopup = () => {
    if (repostPopTimerRef.current) clearTimeout(repostPopTimerRef.current);
    setShowRepostUndoPop(true);
    repostPopTimerRef.current = setTimeout(() => {
      setShowRepostUndoPop(false);
    }, 1500);
  };

  const handleSaveEdit = () => {
    if (!editHeadline.trim()) return;
    onUpdatePost(
      post.id,
      { headline: editHeadline.trim(), bodyText: editBody.trim() },
      `Updated post "${editHeadline.slice(0, 35)}..."`
    );
    setIsEditing(false);
    triggerToast('Story updated');
  };

  // Download 1: Full Offline Article + All Comments (.txt)
  const handleDownloadArticleText = () => {
    const lines: string[] = [
      '====================================================================',
      `PULSE NEWS — VERIFIED STORY & PUBLIC COMMENTS ARCHIVE`,
      '====================================================================',
      `HEADLINE: ${post.headline}`,
      `REPORTER: ${author?.displayName || 'Correspondent'} (@${author?.username || 'reporter'})`,
      `LOCATION: ${post.locationName}`,
      `CATEGORY: ${post.category.toUpperCase()}`,
      `PUBLISHED: ${new Date(post.createdAt).toLocaleString()}`,
      `PROVENANCE SCORE: ${post.forensics.authenticityScore}% (${post.forensics.deviceSignature})`,
      `STATS: ${post.upvotes} Likes | ${post.downvotes} Dislikes | ${postComments.length} Comments`,
      '--------------------------------------------------------------------',
      '',
      'STORY BODY:',
      post.bodyText,
      '',
      'EXECUTIVE SUMMARY:',
      ...post.aiSummary.map((s, idx) => `  ${idx + 1}. ${s}`),
      '',
      '--------------------------------------------------------------------',
      `ALL READER COMMENTS (${postComments.length}):`,
      '--------------------------------------------------------------------',
    ];

    if (postComments.length === 0) {
      lines.push('No comments recorded yet.');
    } else {
      topLevelComments.forEach((c, idx) => {
        const cAuthor = allUsers.find((u) => u.id === c.authorId);
        lines.push(
          `[${idx + 1}] ${cAuthor?.displayName || 'Reader'} (@${cAuthor?.username || 'user'}) • ${
            c.upvotes
          } likes:`
        );
        lines.push(`    "${c.content}"`);
        const replies = postComments.filter((r) => r.parentCommentId === c.id);
        replies.forEach((r) => {
          const rAuthor = allUsers.find((u) => u.id === r.authorId);
          lines.push(
            `      ↳ Reply by ${rAuthor?.displayName || 'Reader'} (@${
              rAuthor?.username || 'user'
            }) • ${r.upvotes} likes: "${r.content}"`
          );
        });
        lines.push('');
      });
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulse-story-${post.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
    triggerToast('Downloaded story & comments (.txt)');
  };

  // Download 2: Media Image / Video File
  const handleDownloadMedia = async () => {
    const primaryMedia = post.media[0];
    if (!primaryMedia) {
      handleDownloadArticleText();
      return;
    }
    setIsDownloading(true);
    try {
      const response = await fetch(primaryMedia.url);
      const blob = await response.blob();
      const ext = primaryMedia.type === 'video' ? 'mp4' : 'jpg';
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `pulse-media-${post.id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      triggerToast(`Downloaded ${primaryMedia.type} file`);
    } catch {
      // Fallback if CORS blocks direct blob fetch
      const a = document.createElement('a');
      a.href = primaryMedia.url;
      a.target = '_blank';
      a.download = `pulse-media-${post.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      triggerToast('Opened media for download');
    } finally {
      setIsDownloading(false);
      setShowDownloadMenu(false);
    }
  };

  // Download 3: Structured JSON Package
  const handleDownloadJson = () => {
    const payload = {
      post,
      author: author
        ? {
            id: author.id,
            username: author.username,
            displayName: author.displayName,
            verificationTier: author.verificationTier,
            trustScore: author.trustScore,
          }
        : null,
      comments: postComments,
      communityNotes: postNotes,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulse-story-${post.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
    triggerToast('Downloaded JSON data package');
  };

  // Share Handlers
  const articleUrl = `${window.location.origin}/article/${post.id}`;
  const shareText = `${post.headline} — via Pulse News (${post.locationName})`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(articleUrl);
    setShowShareMenu(false);
    triggerToast('Story link copied to clipboard');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.headline,
          text: shareText,
          url: articleUrl,
        });
        setShowShareMenu(false);
      } catch {
        // user cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const images = post.media.filter((m) => m.type === 'image' || m.type === 'panorama_360');
  const video = post.media.find((m) => m.type === 'video');

  return (
    <article
      style={{ backgroundColor: cardBgColor }}
      className={`relative rounded-2xl border transition-colors duration-200 ${
        isDark
          ? 'border-white/[0.08] hover:border-white/[0.14]'
          : 'border-black/[0.08] hover:border-black/[0.14] shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
      }`}
    >
      {/* Floating Action Confirmation Toast */}
      {actionToast && (
        <div className="absolute top-3.5 right-14 z-30 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-semibold shadow-lg flex items-center gap-1.5">
          <Check className="w-3 h-3 stroke-[3]" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* 1.5s Pop Notification when Reposted (with Undo Repost button) */}
      {showRepostUndoPop && (
        <div className="absolute top-3.5 right-4 sm:right-14 z-40 px-3.5 py-2 rounded-xl bg-slate-900/95 text-white border border-emerald-500/50 shadow-2xl flex items-center gap-3 text-xs animate-in fade-in duration-150">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Repeat2 className="w-3.5 h-3.5" />
            <span>Reposted story (@{currentUser.username})</span>
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRepost(post.id);
              setShowRepostUndoPop(false);
              triggerToast('Removed Repost');
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors shadow-sm"
          >
            Undo Repost
          </button>
        </div>
      )}

      {/* Subtle Pinned Indicator */}
      {post.isBreakingPinned && (
        <div
          className={`flex items-center gap-2 px-5 pt-3 text-xs font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <Pin className="w-3.5 h-3.5 text-rose-500" />
          <span>Pinned Breaking Story</span>
        </div>
      )}

      <div className="p-5 sm:p-6">
        {/* Author Header */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={`/profile/${author?.username || 'reporter'}`} className="shrink-0">
              <img
                src={
                  author?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
                }
                alt={author?.displayName}
                className="w-10 h-10 rounded-full object-cover hover:opacity-90 transition-opacity"
              />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  to={`/profile/${author?.username || 'reporter'}`}
                  className="font-semibold text-[15px] hover:underline truncate"
                >
                  {author?.displayName || 'Correspondent'}
                </Link>
                {author?.verificationTier !== 'standard' && (
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white shrink-0"
                    style={{ backgroundColor: primaryColor }}
                    title="Verified Journalist"
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
                <span className="text-xs opacity-55 truncate">@{author?.username}</span>
                {author && author.id !== currentUser.id && onToggleFollow && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleFollow(author.id);
                    }}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                      isFollowingAuthor
                        ? 'border border-slate-500/30 opacity-70 hover:opacity-100'
                        : 'text-slate-950 font-bold'
                    }`}
                    style={!isFollowingAuthor ? { backgroundColor: primaryColor } : undefined}
                    title={isFollowingAuthor ? 'Unfollow correspondent' : 'Follow correspondent'}
                  >
                    {isFollowingAuthor ? 'Following' : '+ Follow'}
                  </button>
                )}
                <span className="text-xs opacity-40">·</span>
                <span className="text-xs opacity-55">
                  {formatRelativeTime(post.createdAt, lang)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs opacity-60 mt-0.5">
                {post.locationName && (
                  <span className="inline-flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{post.locationName}</span>
                  </span>
                )}
                <span>·</span>
                <span className="capitalize font-medium" style={{ color: primaryColor }}>
                  {post.category.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* More Menu Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((v) => !v)}
              className={`p-2 rounded-full transition-colors ${
                isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.05]'
              }`}
            >
              <MoreHorizontal className="w-4 h-4 opacity-60" />
            </button>

            {showMenu && (
              <div
                onMouseLeave={() => setShowMenu(false)}
                style={{ backgroundColor: cardBgColor }}
                className={`absolute right-0 mt-1 w-52 rounded-xl border py-1.5 shadow-xl z-20 text-xs ${
                  isDark ? 'border-white/10' : 'border-black/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onPlayAudio && onPlayAudio(post);
                    setShowMenu(false);
                  }}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-slate-500/10"
                >
                  <Headphones className="w-3.5 h-3.5" /> Listen to Story
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleBookmark(post.id);
                    triggerToast(bookmarked ? 'Removed from Saved' : 'Saved to Bookmarks');
                    setShowMenu(false);
                  }}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-slate-500/10"
                >
                  <Bookmark className="w-3.5 h-3.5" />{' '}
                  {bookmarked ? 'Remove from Saved' : 'Save Story'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadArticleText();
                    setShowMenu(false);
                  }}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-slate-500/10"
                >
                  <Download className="w-3.5 h-3.5" /> Download Story & Comments
                </button>
                {canModify && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-slate-500/10"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Story
                    </button>
                    {hasPermission(currentUser, 'articles.update_any') && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdatePost(
                            post.id,
                            { isBreakingPinned: !post.isBreakingPinned },
                            `Toggled pin on "${post.headline.slice(0, 30)}..."`
                          );
                          setShowMenu(false);
                        }}
                        className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-slate-500/10"
                      >
                        <Pin className="w-3.5 h-3.5" />{' '}
                        {post.isBreakingPinned ? 'Unpin Story' : 'Pin to Top'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onDeletePost(post.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Story
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Inline Edit Form OR Story Headline & Body */}
        {isEditing ? (
          <div className="mb-4 space-y-3 p-4 rounded-xl border border-slate-500/20 bg-slate-500/[0.04]">
            <input
              type="text"
              value={editHeadline}
              onChange={(e) => setEditHeadline(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-transparent border border-slate-500/25 font-semibold text-base focus:outline-none"
            />
            <textarea
              rows={3}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-transparent border border-slate-500/25 text-sm leading-relaxed focus:outline-none"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 rounded-lg opacity-70 hover:opacity-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded-lg font-semibold text-slate-950"
                style={{ backgroundColor: primaryColor }}
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <Link to={`/article/${post.id}`} className="block group">
              <h2 className="font-editorial text-xl sm:text-[22px] font-semibold leading-[1.32] group-hover:opacity-80 transition-opacity mb-2">
                {post.headline}
              </h2>
            </Link>
            <p className="text-[15px] leading-[1.65] opacity-85">{post.bodyText}</p>
          </div>
        )}

        {/* Media Block (Video or Crisp Photo Grid) */}
        {video ? (
          <div className="mb-4 rounded-xl overflow-hidden bg-black border border-slate-500/15">
            <video
              src={video.url}
              poster={video.thumbnailUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[430px] object-cover"
            />
          </div>
        ) : images.length === 1 ? (
          <div
            onClick={() => onOpenLightbox && onOpenLightbox(images[0].url, images[0].caption)}
            className="mb-4 rounded-xl overflow-hidden border border-slate-500/15 cursor-zoom-in bg-black/5"
          >
            <img
              src={images[0].url}
              alt={post.headline}
              className="w-full max-h-[440px] object-cover hover:scale-[1.01] transition-transform duration-500"
            />
          </div>
        ) : images.length > 1 ? (
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
            {images.slice(0, 2).map((img) => (
              <div
                key={img.id}
                onClick={() => onOpenLightbox && onOpenLightbox(img.url, img.caption)}
                className="h-60 overflow-hidden cursor-zoom-in bg-black/5 border border-slate-500/15 rounded-lg"
              >
                <img
                  src={img.url}
                  alt={post.headline}
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        ) : null}

        {/* Source Link & Hashtags */}
        {(post.tags.length > 0 || post.externalSourceUrl) && (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="opacity-60 hover:opacity-100 cursor-pointer">
                  {tag}
                </span>
              ))}
            </div>
            {post.externalSourceUrl && (
              <a
                href={post.externalSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 opacity-65 hover:opacity-100 hover:underline"
              >
                <span>Source Reference</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Community Context Note */}
        {postNotes.length > 0 && (
          <div
            className={`mb-4 p-3.5 rounded-xl border text-xs leading-relaxed ${
              isDark
                ? 'border-white/10 bg-white/[0.025]'
                : 'border-slate-200 bg-slate-50/80'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold mb-1 text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
              <span>Readers added context</span>
            </div>
            <p className="opacity-85">{postNotes[0].noteText}</p>
          </div>
        )}

        {/* =================================================================
            FULL-FUNCTION SOCIAL ACTION BAR:
            LIKE/UNLIKE • DISLIKE • COMMENT • REPOST • LISTEN • SAVE • DOWNLOAD • SHARE
        ================================================================= */}
        <div
          className={`flex flex-wrap items-center justify-between gap-1.5 pt-3 border-t text-xs ${
            isDark ? 'border-white/[0.06] text-slate-400' : 'border-black/[0.06] text-slate-500'
          }`}
        >
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            {/* 1. Like / Unlike Toggle */}
            <button
              type="button"
              onClick={() => {
                onLike(post.id);
                triggerToast(isLiked ? 'Unliked story' : 'Liked story');
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors ${
                isLiked
                  ? 'bg-rose-500/15 text-rose-500 font-semibold'
                  : 'hover:bg-rose-500/10 hover:text-rose-500'
              }`}
              title={isLiked ? 'Click to Unlike' : 'Click to Like'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{isLiked ? 'Liked' : 'Like'}</span>
              <span className="font-mono">{formatCompactNumber(post.upvotes, lang)}</span>
            </button>

            {/* 2. Dislike / Undislike Toggle */}
            {onDislike && (
              <button
                type="button"
                onClick={() => {
                  onDislike(post.id);
                  triggerToast(isDisliked ? 'Removed dislike' : 'Disliked story');
                }}
                className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-full transition-colors ${
                  isDisliked
                    ? 'bg-amber-500/15 text-amber-400 font-semibold'
                    : 'hover:bg-slate-500/10 hover:text-amber-400'
                }`}
                title={isDisliked ? 'Remove Dislike' : 'Dislike'}
              >
                <ThumbsDown className={`w-3.5 h-3.5 ${isDisliked ? 'fill-current' : ''}`} />
                <span className="font-mono">{post.downvotes}</span>
              </button>
            )}

            {/* 3. Comments Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowComments((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors ${
                showComments
                  ? 'bg-sky-500/15 text-sky-400 font-semibold'
                  : 'hover:bg-sky-500/10 hover:text-sky-400'
              }`}
              title="Read all comments & write a reply"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{postComments.length}</span>
            </button>

            {/* 4. Repost Toggle + Quote Repost */}
            <button
              type="button"
              onClick={() => {
                const wasReposted = isReposted;
                onRepost(post.id);
                if (!wasReposted) {
                  triggerRepostUndoPopup();
                } else {
                  setShowRepostUndoPop(false);
                  triggerToast('Removed Repost');
                }
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors ${
                isReposted
                  ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                  : 'hover:bg-emerald-500/10 hover:text-emerald-400'
              }`}
              title={isReposted ? 'Click to Undo Repost' : 'Click to Repost'}
            >
              <Repeat2 className="w-4 h-4" />
              <span>{isReposted ? 'Reposted' : 'Repost'}</span>
              <span className="font-mono">{post.shareCount}</span>
            </button>

            {onQuoteRepost && (
              <button
                type="button"
                onClick={() => setShowQuoteBox((v) => !v)}
                className={`hidden sm:inline-flex items-center gap-1 px-2 py-1.5 rounded-full transition-colors ${
                  showQuoteBox
                    ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                    : 'hover:bg-emerald-500/10 hover:text-emerald-400'
                }`}
                title="Quote Repost with your own commentary"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Quote</span>
              </button>
            )}

            {/* 5. Audio Listen */}
            {onPlayAudio && (
              <button
                type="button"
                onClick={() => onPlayAudio(post)}
                className="hidden xl:inline-flex items-center gap-1 px-2 py-1.5 rounded-full hover:bg-sky-500/10 hover:text-sky-400 transition-colors"
                title="Listen to audio narration"
              >
                <Headphones className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Action Cluster: Save, Download, Share */}
          <div className="flex items-center gap-1.5">
            {/* 6. Save / Bookmark Button */}
            <button
              type="button"
              onClick={() => {
                onToggleBookmark(post.id);
                triggerToast(bookmarked ? 'Removed from Saved' : 'Saved to Bookmarks');
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-colors ${
                bookmarked
                  ? 'bg-sky-500/15 text-sky-400 font-semibold'
                  : 'hover:bg-sky-500/10 hover:text-sky-400'
              }`}
              title={bookmarked ? 'Remove from Saved' : 'Save Story'}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>
            </button>

            {/* 7. Multi-Format Download Button & Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowDownloadMenu((v) => !v);
                  setShowShareMenu(false);
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-colors ${
                  showDownloadMenu
                    ? 'bg-sky-500/15 text-sky-400 font-semibold'
                    : 'hover:bg-sky-500/10 hover:text-sky-400'
                }`}
                title="Download story, comments, or media"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>

              {showDownloadMenu && (
                <div
                  onMouseLeave={() => setShowDownloadMenu(false)}
                  style={{ backgroundColor: cardBgColor }}
                  className={`absolute right-0 bottom-10 w-64 rounded-2xl border p-2 shadow-2xl z-30 text-xs space-y-1 ${
                    isDark ? 'border-white/15 text-slate-100' : 'border-black/10 text-slate-800'
                  }`}
                >
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase opacity-55">
                    Download Options
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadArticleText}
                    className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10"
                  >
                    <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Full Story + All Comments</div>
                      <div className="text-[10px] opacity-60">Offline Reader Text (.txt)</div>
                    </div>
                  </button>

                  {post.media.length > 0 && (
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={handleDownloadMedia}
                      className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10"
                    >
                      <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold">
                          {isDownloading
                            ? 'Downloading Media...'
                            : `Download Attached ${
                                post.media[0].type === 'video' ? 'Video' : 'Photo'
                              }`}
                        </div>
                        <div className="text-[10px] opacity-60">Original resolution media</div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10"
                  >
                    <FileJson className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Verified Data & Forensics</div>
                      <div className="text-[10px] opacity-60">Structured JSON (.json)</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 8. Interactive Share Button & Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowShareMenu((v) => !v);
                  setShowDownloadMenu(false);
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-colors ${
                  showShareMenu
                    ? 'bg-sky-500/15 text-sky-400 font-semibold'
                    : 'hover:bg-sky-500/10 hover:text-sky-400'
                }`}
                title="Share story"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>

              {showShareMenu && (
                <div
                  onMouseLeave={() => setShowShareMenu(false)}
                  style={{ backgroundColor: cardBgColor }}
                  className={`absolute right-0 bottom-10 w-60 rounded-2xl border p-2 shadow-2xl z-30 text-xs space-y-1 ${
                    isDark ? 'border-white/15 text-slate-100' : 'border-black/10 text-slate-800'
                  }`}
                >
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase opacity-55">
                    Share Story
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10 font-medium"
                  >
                    <Link2 className="w-4 h-4 text-sky-400" /> Copy Direct Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRepost(post.id);
                      setShowShareMenu(false);
                      triggerToast(isReposted ? 'Removed Repost' : 'Reposted to Pulse Feed');
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10 font-medium"
                  >
                    <Repeat2 className="w-4 h-4 text-emerald-400" />{' '}
                    {isReposted ? 'Undo Repost' : 'Repost on Pulse'}
                  </button>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      shareText
                    )}&url=${encodeURIComponent(articleUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShowShareMenu(false)}
                    className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10 font-medium"
                  >
                    <ExternalLink className="w-4 h-4 opacity-70" /> Share on X (Twitter)
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `${shareText} ${articleUrl}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShowShareMenu(false)}
                    className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10 font-medium"
                  >
                    <Send className="w-4 h-4 text-emerald-400" /> Share on WhatsApp
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(
                      post.headline
                    )}&body=${encodeURIComponent(`${shareText}\n\nRead more: ${articleUrl}`)}`}
                    onClick={() => setShowShareMenu(false)}
                    className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10 font-medium"
                  >
                    <Mail className="w-4 h-4 text-amber-400" /> Share via Email
                  </a>
                  {'share' in navigator && (
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10 font-medium"
                    >
                      <Share2 className="w-4 h-4" /> System Share Sheet...
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inline Quote Repost Composer */}
        {showQuoteBox && onQuoteRepost && (
          <div
            className={`mt-3 p-3.5 rounded-2xl border space-y-2.5 text-xs ${
              isDark
                ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
                : 'border-emerald-500/30 bg-emerald-50/60'
            }`}
          >
            <div className="font-semibold text-emerald-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Repeat2 className="w-3.5 h-3.5" /> Quote Repost to Home Feed
              </span>
              <button
                type="button"
                onClick={() => setShowQuoteBox(false)}
                className="opacity-65 hover:opacity-100"
              >
                Cancel
              </button>
            </div>
            <input
              type="text"
              autoFocus
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && quoteText.trim()) {
                  onQuoteRepost(post, quoteText.trim());
                  setQuoteText('');
                  setShowQuoteBox(false);
                  triggerToast('Published Quote Repost!');
                }
              }}
              placeholder="Add your commentary or headline above this story..."
              className={`w-full px-3.5 py-2 rounded-xl border focus:outline-none ${
                isDark
                  ? 'bg-black/30 border-white/15 text-white'
                  : 'bg-white border-black/15 text-slate-900'
              }`}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!quoteText.trim()) return;
                  onQuoteRepost(post, quoteText.trim());
                  setQuoteText('');
                  setShowQuoteBox(false);
                  triggerToast('Published Quote Repost!');
                }}
                className="px-4 py-1.5 rounded-full font-semibold bg-emerald-500 text-slate-950"
              >
                Publish Quote Repost
              </button>
            </div>
          </div>
        )}

        {/* =================================================================
            COLLAPSED COMMENT PREVIEW ("READ ALL COMMENTS" BAR)
        ================================================================= */}
        {!showComments && postComments.length > 0 && (
          <div
            className={`mt-3 pt-3 border-t space-y-2 text-xs ${
              isDark ? 'border-white/[0.05]' : 'border-black/[0.05]'
            }`}
          >
            {topLevelComments.slice(0, 2).map((c) => {
              const cAuthor = allUsers.find((u) => u.id === c.authorId);
              return (
                <div key={c.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="font-semibold shrink-0">
                    {cAuthor?.displayName || 'Reader'}:
                  </span>
                  <span className="opacity-80 line-clamp-1">{c.content}</span>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setShowComments(true)}
              className="text-xs font-semibold hover:underline pt-0.5 inline-flex items-center gap-1"
              style={{ color: primaryColor }}
            >
              Read all {postComments.length} comments & replies →
            </button>
          </div>
        )}

        {/* =================================================================
            FULL EXPANDED COMMENTS & NESTED REPLIES DRAWER
        ================================================================= */}
        {showComments && (
          <div
            className={`mt-4 pt-4 border-t space-y-4 text-xs ${
              isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
            }`}
          >
            {/* Header + Sort Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-sm flex items-center gap-2">
                <span>All Comments ({postComments.length})</span>
              </div>
              <div className="flex items-center gap-1">
                {(['top', 'newest', 'oldest'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setCommentSort(mode)}
                    className={`px-2.5 py-1 rounded-full text-[11px] capitalize transition-colors ${
                      commentSort === mode
                        ? isDark
                          ? 'bg-white text-slate-950 font-semibold'
                          : 'bg-slate-900 text-white font-semibold'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* New Top-Level Comment Input */}
            <div className="flex gap-2.5">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && commentText.trim()) {
                      onAddComment(post.id, commentText.trim(), null);
                      setCommentText('');
                      triggerToast('Comment posted');
                    }
                  }}
                  placeholder={`Comment as ${currentUser.displayName}...`}
                  className={`flex-1 px-4 py-2 rounded-full border focus:outline-none ${
                    isDark
                      ? 'bg-white/[0.04] border-white/10 focus:border-sky-400'
                      : 'bg-black/[0.03] border-black/10 focus:border-sky-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!commentText.trim()) return;
                    onAddComment(post.id, commentText.trim(), null);
                    setCommentText('');
                    triggerToast('Comment posted');
                  }}
                  className="px-4 py-2 rounded-full font-semibold text-slate-950 shrink-0 shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  Post
                </button>
              </div>
            </div>

            {/* Full Scrollable Comments & Nested Replies List */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 pt-1">
              {topLevelComments.length === 0 ? (
                <div className="py-6 text-center opacity-60">
                  No comments yet. Be the first to share your thoughts!
                </div>
              ) : (
                topLevelComments.map((c) => {
                  const cAuthor = allUsers.find((u) => u.id === c.authorId);
                  const cLiked = likedCommentIds.includes(c.id);
                  const childReplies = postComments.filter((r) => r.parentCommentId === c.id);
                  const isOwnComment = c.authorId === currentUser.id;
                  const canModerate = hasPermission(currentUser, 'comments.moderate');
                  const canDeleteOwn = hasPermission(currentUser, 'comments.delete_own', {
                    resourceAuthorId: c.authorId,
                  });
                  const canDeleteComment = (isOwnComment && canDeleteOwn) || canModerate;

                  return (
                    <div key={c.id} className="space-y-2">
                      {/* Parent Comment */}
                      <div className="flex items-start gap-2.5">
                        <Link to={`/profile/${cAuthor?.username || 'reader'}`} className="shrink-0">
                          <img
                            src={cAuthor?.avatarUrl}
                            alt={cAuthor?.displayName}
                            className="w-7 h-7 rounded-full object-cover mt-0.5"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`p-3 rounded-2xl ${
                              isDark ? 'bg-white/[0.04]' : 'bg-black/[0.04]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5 truncate">
                                <Link
                                  to={`/profile/${cAuthor?.username || 'reader'}`}
                                  className="font-semibold hover:underline truncate"
                                >
                                  {cAuthor?.displayName || 'Reader'}
                                </Link>
                                <span className="opacity-50 text-[11px]">
                                  @{cAuthor?.username || 'reader'}
                                </span>
                                <span className="opacity-40">·</span>
                                <span className="opacity-50 text-[11px]">
                                  {formatRelativeTime(c.createdAt, lang)}
                                </span>
                              </div>
                            </div>
                            <p className="opacity-90 leading-relaxed text-[13px]">{c.content}</p>
                          </div>

                          {/* Comment Action Bar: Like/Unlike, Reply, Delete */}
                          <div className="flex items-center gap-4 px-2 pt-1 text-[11px] opacity-75">
                            <button
                              type="button"
                              onClick={() => onLikeComment && onLikeComment(c.id)}
                              className={`inline-flex items-center gap-1 font-medium transition-colors ${
                                cLiked ? 'text-rose-500 font-semibold' : 'hover:text-rose-500'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${cLiked ? 'fill-current' : ''}`} />
                              <span>{cLiked ? 'Liked' : 'Like'}</span>
                              <span>({c.upvotes})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setReplyingToId(replyingToId === c.id ? null : c.id)
                              }
                              className="inline-flex items-center gap-1 font-medium hover:text-sky-400"
                            >
                              <CornerDownRight className="w-3 h-3" />
                              <span>Reply</span>
                            </button>

                            {canDeleteComment && onDeleteComment && (
                              <button
                                type="button"
                                onClick={() => onDeleteComment(c.id, post.id)}
                                className={`inline-flex items-center gap-1 hover:underline ${
                                  isOwnComment ? 'text-rose-400' : 'text-amber-400 font-semibold'
                                }`}
                                title={
                                  isOwnComment
                                    ? 'Delete your comment'
                                    : 'Admin Moderation: Remove comment'
                                }
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>{isOwnComment ? 'Delete' : 'Admin Remove'}</span>
                              </button>
                            )}
                          </div>

                          {/* Inline Reply Input Box */}
                          {replyingToId === c.id && (
                            <div className="flex gap-2 mt-2 pl-2">
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
                                    triggerToast('Reply posted');
                                  }
                                }}
                                placeholder={`Reply to @${cAuthor?.username || 'reader'}...`}
                                className={`flex-1 px-3 py-1.5 rounded-full border text-xs focus:outline-none ${
                                  isDark
                                    ? 'bg-white/[0.04] border-white/15'
                                    : 'bg-black/[0.03] border-black/15'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!replyText.trim()) return;
                                  onAddComment(post.id, replyText.trim(), c.id);
                                  setReplyText('');
                                  setReplyingToId(null);
                                  triggerToast('Reply posted');
                                }}
                                className="px-3.5 py-1.5 rounded-full font-semibold text-slate-950 text-xs"
                                style={{ backgroundColor: primaryColor }}
                              >
                                Reply
                              </button>
                            </div>
                          )}

                          {/* Nested Child Replies */}
                          {childReplies.length > 0 && (
                            <div className="mt-2 pl-4 border-l-2 border-slate-500/20 space-y-2">
                              {childReplies.map((r) => {
                                const rAuthor = allUsers.find((u) => u.id === r.authorId);
                                const rLiked = likedCommentIds.includes(r.id);
                                const isOwnReply = r.authorId === currentUser.id;
                                const canDeleteReplyOwn = hasPermission(currentUser, 'comments.delete_own', {
                                  resourceAuthorId: r.authorId,
                                });
                                const canDeleteReply = (isOwnReply && canDeleteReplyOwn) || canModerate;
                                return (
                                  <div key={r.id} className="flex items-start gap-2">
                                    <Link
                                      to={`/profile/${rAuthor?.username || 'reader'}`}
                                      className="shrink-0"
                                    >
                                      <img
                                        src={rAuthor?.avatarUrl}
                                        alt={rAuthor?.displayName}
                                        className="w-6 h-6 rounded-full object-cover mt-0.5"
                                      />
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                      <div
                                        className={`p-2.5 rounded-2xl ${
                                          isDark ? 'bg-white/[0.03]' : 'bg-black/[0.03]'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                          <Link
                                            to={`/profile/${rAuthor?.username || 'reader'}`}
                                            className="font-semibold hover:underline"
                                          >
                                            {rAuthor?.displayName || 'Reader'}
                                          </Link>
                                          <span className="opacity-50 text-[10px]">
                                            @{rAuthor?.username}
                                          </span>
                                          <span className="opacity-40">·</span>
                                          <span className="opacity-50 text-[10px]">
                                            {formatRelativeTime(r.createdAt, lang)}
                                          </span>
                                        </div>
                                        <p className="opacity-90 leading-relaxed">{r.content}</p>
                                      </div>
                                      <div className="flex items-center gap-3 px-2 pt-1 text-[10px] opacity-75">
                                        <button
                                          type="button"
                                          onClick={() => onLikeComment && onLikeComment(r.id)}
                                          className={`inline-flex items-center gap-1 font-medium ${
                                            rLiked
                                              ? 'text-rose-500 font-semibold'
                                              : 'hover:text-rose-500'
                                          }`}
                                        >
                                          <Heart
                                            className={`w-2.5 h-2.5 ${
                                              rLiked ? 'fill-current' : ''
                                            }`}
                                          />
                                          <span>{rLiked ? 'Liked' : 'Like'}</span>
                                          <span>({r.upvotes})</span>
                                        </button>
                                        {canDeleteReply && onDeleteComment && (
                                          <button
                                            type="button"
                                            onClick={() => onDeleteComment(r.id, post.id)}
                                            className={`hover:underline ${
                                              isOwnReply
                                                ? 'text-rose-400'
                                                : 'text-amber-400 font-semibold'
                                            }`}
                                          >
                                            {isOwnReply ? 'Delete' : 'Admin Remove'}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
