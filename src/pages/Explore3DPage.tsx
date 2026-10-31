import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  Clock,
  Download,
  ExternalLink,
  Film,
  Heart,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Play,
  Repeat2,
  Send,
  Share2,
  TrendingUp,
} from 'lucide-react';
import { CommentItem, NewsPost, PostCategory, User } from '../types';

interface Explore3DPageProps {
  posts: NewsPost[];
  users: User[];
  comments?: CommentItem[];
  primaryColor: string;
  breakingColor: string;
  cardBgColor: string;
  isDark: boolean;
  bookmarkedIds?: string[];
  likedIds?: string[];
  repostedIds?: string[];
  onToggleBookmark?: (postId: string) => void;
  onLike?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onAddComment?: (postId: string, content: string) => void;
}

export const Explore3DPage: React.FC<Explore3DPageProps> = ({
  posts,
  users,
  comments = [],
  primaryColor,
  cardBgColor,
  isDark,
  bookmarkedIds = [],
  likedIds = [],
  repostedIds = [],
  onToggleBookmark,
  onLike,
  onRepost,
  onAddComment,
}) => {
  const navigate = useNavigate();
  const published = posts.filter((p) => p.status !== 'draft' && p.status !== 'removed');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'video' | PostCategory>('all');
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [pollVoted, setPollVoted] = useState<number | null>(null);
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [openSharePostId, setOpenSharePostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [repostPopPostId, setRepostPopPostId] = useState<string | null>(null);

  const triggerRepostPop = (postId: string) => {
    setRepostPopPostId(postId);
    setTimeout(() => {
      setRepostPopPostId((prev) => (prev === postId ? null : prev));
    }, 1500);
  };

  const featuredPosts = published.slice(0, 3);
  const activeHero = featuredPosts[featuredIdx] || published[0];
  const heroAuthor = users.find((u) => u.id === activeHero?.authorId);

  const gridPosts = published.filter((p) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'video') return p.media.some((m) => m.type === 'video');
    return p.category === selectedCategory;
  });

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-6">
      {/* 1. IMMERSIVE FULL-BLEED EDITORIAL SPOTLIGHT HERO */}
      {activeHero && (
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-slate-950 text-white min-h-[440px] flex flex-col justify-end shadow-xl group">
          <img
            src={activeHero.media[0]?.thumbnailUrl || activeHero.media[0]?.url}
            alt={activeHero.headline}
            className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:scale-[1.02] transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />

          <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
              <span
                className="px-3 py-1 rounded-full text-slate-950 font-semibold capitalize"
                style={{ backgroundColor: primaryColor }}
              >
                Featured Story · {activeHero.category.replace('_', ' ')}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-300">
                <MapPin className="w-3.5 h-3.5" /> {activeHero.locationName}
              </span>
            </div>

            <Link to={`/article/${activeHero.id}`} className="block">
              <h1 className="font-editorial text-2xl sm:text-4xl lg:text-[42px] font-semibold leading-[1.16] hover:opacity-90 transition-opacity">
                {activeHero.headline}
              </h1>
            </Link>

            <p className="text-sm sm:text-base text-slate-200 line-clamp-2 max-w-2xl leading-relaxed">
              {activeHero.bodyText}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <Link
                to={`/profile/${heroAuthor?.username || 'reporter'}`}
                className="flex items-center gap-3"
              >
                <img
                  src={heroAuthor?.avatarUrl}
                  alt={heroAuthor?.displayName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20"
                />
                <div className="text-xs">
                  <div className="font-semibold flex items-center gap-1">
                    {heroAuthor?.displayName}
                    <Check className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="text-slate-400">{heroAuthor?.location}</div>
                </div>
              </Link>

              {/* Hero Story Switcher Dots */}
              <div className="flex items-center gap-2">
                {featuredPosts.map((fp, i) => (
                  <button
                    key={fp.id}
                    type="button"
                    onClick={() => setFeaturedIdx(i)}
                    className={`h-2 rounded-full transition-all ${
                      featuredIdx === i ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. EXPLORE FILTER BAR */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-500/15 pb-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Coverage' },
            { id: 'video', label: 'Video Reports' },
            { id: 'breaking', label: 'Breaking' },
            { id: 'tech', label: 'Technology' },
            { id: 'science', label: 'Science & Climate' },
            { id: 'politics', label: 'Policy & World' },
            { id: 'weather_disaster', label: 'Weather' },
          ].map((tab) => {
            const active = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id as typeof selectedCategory)}
                className={`px-4 py-2 rounded-full text-xs font-medium shrink-0 transition-all ${
                  active
                    ? isDark
                      ? 'bg-white text-slate-950 font-semibold'
                      : 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-500/10 opacity-70 hover:opacity-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. EDITORIAL MAGAZINE GRID + COMMUNITY PULSE POLL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          {gridPosts.map((post) => {
            const author = users.find((u) => u.id === post.authorId);
            const hasVideo = post.media.some((m) => m.type === 'video');
            const isSaved = bookmarkedIds.includes(post.id);
            const isLiked = likedIds.includes(post.id);
            const isReposted = repostedIds.includes(post.id);
            const postComments = comments.filter((c) => c.postId === post.id);
            const isCommentsOpen = openCommentsPostId === post.id;

            const handleDownloadPost = () => {
              const reportText = [
                '====================================================================',
                `PULSE NEWS REPORT — ${post.headline.toUpperCase()}`,
                '====================================================================',
                `Author: ${author?.displayName || 'Correspondent'} (@${author?.username || 'reporter'})`,
                `Location: ${post.locationName}`,
                `Published: ${new Date(post.createdAt).toLocaleString()}`,
                '',
                post.bodyText,
                '',
                `--- COMMENTS (${postComments.length}) ---`,
                ...postComments.map((c) => {
                  const cAuthor = users.find((u) => u.id === c.authorId);
                  return `• ${cAuthor?.displayName || 'Reader'}: ${c.content}`;
                }),
              ].join('\n');

              const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `pulse-news-${post.id}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            };

            const shareUrl = `${window.location.origin}/article/${post.id}`;

            const handleCopyShareLink = () => {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareUrl);
              } else {
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
              }
              setCopiedPostId(post.id);
              setOpenSharePostId(null);
              setTimeout(() => setCopiedPostId(null), 1500);
            };

            return (
              <article
                key={post.id}
                style={{ backgroundColor: cardBgColor }}
                className={`relative rounded-2xl border flex flex-col justify-between transition-colors ${
                  isDark
                    ? 'border-white/[0.08] hover:border-white/[0.16]'
                    : 'border-black/[0.08] hover:border-black/[0.16] shadow-sm'
                }`}
              >
                {/* 1.5s Pop Notification with Undo Repost */}
                {repostPopPostId === post.id && (
                  <div className="absolute top-3 right-3 z-30 px-3.5 py-2 rounded-xl bg-slate-900/95 text-white border border-emerald-500/40 shadow-xl flex items-center gap-3 text-xs animate-in fade-in duration-150">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <Repeat2 className="w-3.5 h-3.5" /> Reposted story
                    </span>
                    {onRepost && (
                      <button
                        type="button"
                        onClick={() => {
                          onRepost(post.id);
                          setRepostPopPostId(null);
                        }}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-semibold"
                      >
                        Undo Repost
                      </button>
                    )}
                  </div>
                )}

                {copiedPostId === post.id && (
                  <div className="absolute top-3 right-3 z-30 px-3.5 py-1.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-semibold shadow-lg flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Link copied to clipboard
                  </div>
                )}

                <div>
                  {post.media[0] && (
                    <Link
                      to={`/article/${post.id}`}
                      className="block relative h-52 rounded-t-2xl overflow-hidden bg-black"
                    >
                      <img
                        src={post.media[0].thumbnailUrl || post.media[0].url}
                        alt={post.headline}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      {hasVideo && (
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/75 text-white backdrop-blur-md">
                          <Play className="w-3 h-3 fill-current" /> Video
                        </span>
                      )}
                    </Link>
                  )}

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs opacity-60">
                      <span className="capitalize font-medium" style={{ color: primaryColor }}>
                        {post.category.replace('_', ' ')}
                      </span>
                      <span>{post.locationName.split(',')[0]}</span>
                    </div>

                    <Link to={`/article/${post.id}`} className="block group">
                      <h3 className="font-editorial text-xl font-semibold leading-snug group-hover:opacity-80 transition-opacity line-clamp-2">
                        {post.headline}
                      </h3>
                    </Link>

                    <p className="text-xs sm:text-sm opacity-75 line-clamp-2 leading-relaxed">
                      {post.bodyText}
                    </p>
                  </div>
                </div>

                <div>
                  <div
                    className={`px-5 py-3.5 border-t flex items-center justify-between gap-2 text-xs ${
                      isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
                    }`}
                  >
                    <Link
                      to={`/profile/${author?.username || 'reporter'}`}
                      className="flex items-center gap-2 truncate min-w-0"
                    >
                      <img
                        src={author?.avatarUrl}
                        alt={author?.displayName}
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                      <span className="font-medium truncate">{author?.displayName}</span>
                    </Link>

                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                      {/* LIKE / UNLIKE BUTTON */}
                      <button
                        type="button"
                        onClick={() => onLike?.(post.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                          isLiked
                            ? 'text-rose-500 bg-rose-500/10 font-semibold'
                            : 'opacity-75 hover:opacity-100 hover:bg-slate-500/10'
                        }`}
                        title={isLiked ? 'Unlike story' : 'Like story'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                        <span>{post.upvotes}</span>
                      </button>

                      {/* COMMENTS DRAWER TOGGLE BUTTON */}
                      <button
                        type="button"
                        onClick={() =>
                          setOpenCommentsPostId(isCommentsOpen ? null : post.id)
                        }
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                          isCommentsOpen
                            ? 'text-sky-400 bg-sky-500/10 font-semibold'
                            : 'opacity-75 hover:opacity-100 hover:bg-slate-500/10'
                        }`}
                        title="Read & write comments"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{Math.max(post.commentCount, postComments.length)}</span>
                      </button>

                      {/* REPOST / UNREPOST BUTTON */}
                      <button
                        type="button"
                        onClick={() => {
                          const wasReposted = isReposted;
                          onRepost?.(post.id);
                          if (!wasReposted) {
                            triggerRepostPop(post.id);
                          } else {
                            setRepostPopPostId(null);
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                          isReposted
                            ? 'text-emerald-400 bg-emerald-500/10 font-semibold'
                            : 'opacity-75 hover:opacity-100 hover:bg-slate-500/10'
                        }`}
                        title={isReposted ? 'Undo Repost' : 'Repost story'}
                      >
                        <Repeat2 className="w-3.5 h-3.5" />
                        <span>{post.shareCount}</span>
                      </button>

                      {/* DOWNLOAD BUTTON */}
                      <button
                        type="button"
                        onClick={handleDownloadPost}
                        className="p-1.5 rounded-full opacity-75 hover:opacity-100 hover:bg-slate-500/10 transition-colors"
                        title="Download report (.txt)"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* SHARE MENU BUTTON & POPOVER */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={async () => {
                            if (navigator.share) {
                              try {
                                await navigator.share({
                                  title: post.headline,
                                  text: post.bodyText.slice(0, 100),
                                  url: shareUrl,
                                });
                                return;
                              } catch {
                                // fallback to menu
                              }
                            }
                            setOpenSharePostId(openSharePostId === post.id ? null : post.id);
                          }}
                          className={`p-1.5 rounded-full transition-colors ${
                            openSharePostId === post.id || copiedPostId === post.id
                              ? 'text-sky-400 bg-sky-500/10'
                              : 'opacity-75 hover:opacity-100 hover:bg-slate-500/10'
                          }`}
                          title="Share story"
                        >
                          {copiedPostId === post.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {openSharePostId === post.id && (
                          <div
                            style={{ backgroundColor: cardBgColor }}
                            className={`absolute right-0 bottom-9 w-56 rounded-2xl border p-1.5 shadow-2xl z-40 text-xs space-y-0.5 ${
                              isDark ? 'border-white/15' : 'border-black/15'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={handleCopyShareLink}
                              className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10 font-medium"
                            >
                              <Link2 className="w-3.5 h-3.5 text-sky-400" />
                              <span>Copy Story Link</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const wasReposted = isReposted;
                                onRepost?.(post.id);
                                if (!wasReposted) triggerRepostPop(post.id);
                                setOpenSharePostId(null);
                              }}
                              className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10 font-medium"
                            >
                              <Repeat2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{isReposted ? 'Undo Repost' : 'Repost to Feed'}</span>
                            </button>
                            <a
                              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                post.headline
                              )}&url=${encodeURIComponent(shareUrl)}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => setOpenSharePostId(null)}
                              className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10 font-medium"
                            >
                              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                              <span>Share on X / Twitter</span>
                            </a>
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(
                                `${post.headline} — ${shareUrl}`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => setOpenSharePostId(null)}
                              className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10 font-medium"
                            >
                              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Share on WhatsApp</span>
                            </a>
                            <a
                              href={`mailto:?subject=${encodeURIComponent(
                                post.headline
                              )}&body=${encodeURIComponent(
                                `${post.headline}\n\n${post.bodyText}\n\nRead full story: ${shareUrl}`
                              )}`}
                              onClick={() => setOpenSharePostId(null)}
                              className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 hover:bg-slate-500/10 font-medium"
                            >
                              <Mail className="w-3.5 h-3.5 text-amber-400" />
                              <span>Share via Email</span>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* SAVE / BOOKMARK BUTTON */}
                      {onToggleBookmark && (
                        <button
                          type="button"
                          onClick={() => onToggleBookmark(post.id)}
                          className={`p-1.5 rounded-full transition-colors ${
                            isSaved
                              ? 'text-sky-400 bg-sky-500/10'
                              : 'opacity-75 hover:opacity-100 hover:bg-slate-500/10'
                          }`}
                          title={isSaved ? 'Remove from Bookmarks' : 'Save to Bookmarks'}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* INLINE COMMENTS DRAWER ON EXPLORE CARD */}
                  {isCommentsOpen && (
                    <div
                      className={`px-5 py-4 border-t space-y-3 text-xs ${
                        isDark
                          ? 'border-white/[0.06] bg-white/[0.02]'
                          : 'border-black/[0.06] bg-slate-500/[0.03]'
                      }`}
                    >
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const text = (commentInputs[post.id] || '').trim();
                          if (!text || !onAddComment) return;
                          onAddComment(post.id, text);
                          setCommentInputs((prev) => ({ ...prev, [post.id]: '' }));
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          placeholder="Write a comment..."
                          className={`flex-1 px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                            isDark
                              ? 'bg-slate-900 border-white/10 text-white'
                              : 'bg-white border-black/10 text-slate-900'
                          }`}
                        />
                        <button
                          type="submit"
                          className="px-3 py-2 rounded-xl font-semibold text-slate-950 inline-flex items-center gap-1"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Send className="w-3 h-3" /> Post
                        </button>
                      </form>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {postComments.length === 0 ? (
                          <div className="opacity-60 py-2 text-center">
                            No comments yet. Be the first to share your perspective!
                          </div>
                        ) : (
                          postComments.map((c) => {
                            const cUser = users.find((u) => u.id === c.authorId);
                            return (
                              <div
                                key={c.id}
                                className={`p-2.5 rounded-xl border ${
                                  isDark
                                    ? 'border-white/[0.06] bg-white/[0.02]'
                                    : 'border-black/[0.06] bg-white'
                                }`}
                              >
                                <div className="font-semibold text-[11px]">
                                  {cUser?.displayName || 'Reader'}{' '}
                                  <span className="opacity-50 font-normal">
                                    @{cUser?.username || 'reader'}
                                  </span>
                                </div>
                                <p className="opacity-85 mt-0.5 leading-relaxed">{c.content}</p>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Link
                          to={`/article/${post.id}`}
                          className="text-[11px] font-semibold hover:underline"
                          style={{ color: primaryColor }}
                        >
                          Open full article & thread →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* RIGHT SIDEBAR: LIVE READER SENTIMENT POLL & SPECIAL COVERAGE */}
        <aside className="lg:col-span-4 space-y-6">
          <div
            style={{ backgroundColor: cardBgColor }}
            className={`p-6 rounded-2xl border space-y-4 ${
              isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" style={{ color: primaryColor }} />
              Live Reader Poll
            </div>
            <h3 className="font-editorial text-xl font-semibold leading-snug">
              Should urban high-speed Maglev corridors replace short-haul domestic flights by 2030?
            </h3>

            <div className="space-y-2.5 text-xs">
              {[
                { label: 'Yes — prioritize clean rail infrastructure', pct: 74 },
                { label: 'Only where economically self-sustaining', pct: 19 },
                { label: 'No — focus on electric aviation instead', pct: 7 },
              ].map((opt, idx) => {
                const selected = pollVoted === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPollVoted(idx)}
                    className={`w-full p-3 rounded-xl border text-left relative overflow-hidden transition-all ${
                      selected
                        ? 'border-sky-400 font-semibold'
                        : isDark
                        ? 'border-white/10 hover:bg-white/[0.03]'
                        : 'border-black/10 hover:bg-black/[0.03]'
                    }`}
                  >
                    {pollVoted !== null && (
                      <div
                        className="absolute inset-y-0 left-0 opacity-15 transition-all duration-500"
                        style={{
                          width: `${opt.pct}%`,
                          backgroundColor: primaryColor,
                        }}
                      />
                    )}
                    <div className="relative z-10 flex items-center justify-between">
                      <span>{opt.label}</span>
                      {pollVoted !== null && <span className="font-mono">{opt.pct}%</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] opacity-55">
              4,820 verified readers voted · Updated live
            </div>
          </div>

          <div
            style={{ backgroundColor: cardBgColor }}
            className={`p-6 rounded-2xl border space-y-4 ${
              isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider opacity-60">
              In-Depth Desks
            </div>
            <div className="space-y-3 text-xs">
              {[
                {
                  title: 'Global Clean Energy Transition',
                  desc: '14 correspondents reporting from Tokyo, Lagos, and Rotterdam',
                },
                {
                  title: 'Autonomous Urban Mobility',
                  desc: 'Field tests of hydrofoil ferries and superconducting rail',
                },
                {
                  title: 'Digital Media Provenance',
                  desc: 'How hardware signatures protect eyewitness journalism',
                },
              ].map((topic, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border ${
                    isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-black/[0.06] bg-black/[0.02]'
                  }`}
                >
                  <div className="font-semibold text-sm">{topic.title}</div>
                  <p className="opacity-65 mt-1 leading-relaxed">{topic.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Back Navigation Bar */}
      <div className="pt-8 pb-4 flex items-center justify-start border-t border-slate-500/15">
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
  );
};
