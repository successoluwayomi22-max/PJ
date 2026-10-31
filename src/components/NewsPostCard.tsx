import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Check,
  Edit3,
  ExternalLink,
  Heart,
  Headphones,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pin,
  Repeat2,
  Share,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { CommentItem, CommunityNote, LanguageCode, NewsPost, User } from '../types';
import { formatCompactNumber, formatRelativeTime } from '../i18n';

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
  isReposted: boolean;
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onUpdatePost: (postId: string, updates: Partial<NewsPost>, reason: string) => void;
  onDeletePost: (postId: string) => void;
  onPlayAudio?: (post: NewsPost) => void;
  onOpenLightbox?: (imageUrl: string, caption?: string) => void;
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
  isReposted,
  onLike,
  onRepost,
  onToggleBookmark,
  onAddComment,
  onUpdatePost,
  onDeletePost,
  onPlayAudio,
  onOpenLightbox,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editHeadline, setEditHeadline] = useState(post.headline);
  const [editBody, setEditBody] = useState(post.bodyText);
  const [copied, setCopied] = useState(false);

  const postComments = comments.filter((c) => c.postId === post.id);
  const postNotes = notes.filter((n) => n.postId === post.id);
  const canModify = currentUser.id === post.authorId || currentUser.role === 'admin';

  const handleSaveEdit = () => {
    if (!editHeadline.trim()) return;
    onUpdatePost(
      post.id,
      { headline: editHeadline.trim(), bodyText: editBody.trim() },
      `Updated post "${editHeadline.slice(0, 35)}..."`
    );
    setIsEditing(false);
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
                className={`absolute right-0 mt-1 w-48 rounded-xl border py-1.5 shadow-xl z-20 text-xs ${
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
                    setShowMenu(false);
                  }}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-slate-500/10"
                >
                  <Bookmark className="w-3.5 h-3.5" />{' '}
                  {bookmarked ? 'Remove Bookmark' : 'Save to Bookmarks'}
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
                    {currentUser.role === 'admin' && (
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

        {/* Community Context Note (Clean, Mature Box) */}
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

        {/* Mature Social Interaction Bar */}
        <div
          className={`flex items-center justify-between pt-3 border-t text-xs ${
            isDark ? 'border-white/[0.06] text-slate-400' : 'border-black/[0.06] text-slate-500'
          }`}
        >
          <div className="flex items-center gap-5 sm:gap-7">
            {/* Like / Endorse */}
            <button
              type="button"
              onClick={() => onLike(post.id)}
              className={`inline-flex items-center gap-1.5 transition-colors ${
                isLiked ? 'text-rose-500 font-semibold' : 'hover:text-rose-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{formatCompactNumber(post.upvotes, lang)}</span>
            </button>

            {/* Comments */}
            <button
              type="button"
              onClick={() => setShowComments((v) => !v)}
              className="inline-flex items-center gap-1.5 hover:text-sky-400 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{post.commentCount + postComments.length}</span>
            </button>

            {/* Repost */}
            <button
              type="button"
              onClick={() => onRepost(post.id)}
              className={`inline-flex items-center gap-1.5 transition-colors ${
                isReposted ? 'text-emerald-400 font-semibold' : 'hover:text-emerald-400'
              }`}
            >
              <Repeat2 className="w-4 h-4" />
              <span>{post.shareCount + (isReposted ? 1 : 0)}</span>
            </button>

            {/* Audio Listen */}
            {onPlayAudio && (
              <button
                type="button"
                onClick={() => onPlayAudio(post)}
                className="hidden sm:inline-flex items-center gap-1.5 hover:text-sky-400 transition-colors"
                title="Listen to audio narration"
              >
                <Headphones className="w-4 h-4" />
                <span>Listen</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggleBookmark(post.id)}
              className={`p-1.5 rounded-full transition-colors ${
                bookmarked ? 'text-sky-400' : 'hover:text-sky-400'
              }`}
              title="Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/article/${post.id}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="p-1.5 rounded-full hover:text-sky-400 transition-colors"
              title="Share link"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Share className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Smooth Inline Comments Drawer */}
        {showComments && (
          <div
            className={`mt-4 pt-4 border-t space-y-3 text-xs ${
              isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
            }`}
          >
            <div className="flex gap-2.5">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && commentText.trim()) {
                      onAddComment(post.id, commentText.trim());
                      setCommentText('');
                    }
                  }}
                  placeholder="Write a comment..."
                  className={`flex-1 px-3.5 py-2 rounded-full border focus:outline-none ${
                    isDark
                      ? 'bg-white/[0.03] border-white/10 focus:border-white/25'
                      : 'bg-black/[0.03] border-black/10 focus:border-black/25'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!commentText.trim()) return;
                    onAddComment(post.id, commentText.trim());
                    setCommentText('');
                  }}
                  className="px-4 py-2 rounded-full font-semibold text-slate-950 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  Reply
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pt-1">
              {postComments.map((c) => {
                const cAuthor = allUsers.find((u) => u.id === c.authorId);
                return (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <img
                      src={cAuthor?.avatarUrl}
                      alt={cAuthor?.displayName}
                      className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div
                      className={`flex-1 p-3 rounded-2xl ${
                        isDark ? 'bg-white/[0.03]' : 'bg-black/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-semibold">{cAuthor?.displayName || 'Reader'}</span>
                        <span className="opacity-50">@{cAuthor?.username}</span>
                      </div>
                      <p className="opacity-90 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
