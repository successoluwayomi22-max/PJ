import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Compass, Search, Trash2 } from 'lucide-react';
import { CommentItem, CommunityNote, LanguageCode, NewsPost, User } from '../types';
import { NewsPostCard } from '../components/NewsPostCard';

interface BookmarksPageProps {
  posts: NewsPost[];
  users: User[];
  comments: CommentItem[];
  notes: CommunityNote[];
  bookmarkedIds: string[];
  likedIds: string[];
  repostedIds: string[];
  currentUser: User;
  lang: LanguageCode;
  primaryColor: string;
  cardBgColor: string;
  isDark: boolean;
  onToggleBookmark: (postId: string) => void;
  onClearAllBookmarks: () => void;
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onUpdatePost: (postId: string, updates: Partial<NewsPost>, reason: string) => void;
  onDeletePost: (postId: string) => void;
  onPlayAudio: (post: NewsPost) => void;
  onOpenLightbox: (url: string, caption?: string) => void;
}

export const BookmarksPage: React.FC<BookmarksPageProps> = ({
  posts,
  users,
  comments,
  notes,
  bookmarkedIds,
  likedIds,
  repostedIds,
  currentUser,
  lang,
  primaryColor,
  cardBgColor,
  isDark,
  onToggleBookmark,
  onClearAllBookmarks,
  onLike,
  onRepost,
  onAddComment,
  onUpdatePost,
  onDeletePost,
  onPlayAudio,
  onOpenLightbox,
}) => {
  const [query, setQuery] = useState('');

  const savedPosts = posts.filter((post) => {
    if (!bookmarkedIds.includes(post.id)) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      post.headline.toLowerCase().includes(q) ||
      post.bodyText.toLowerCase().includes(q) ||
      post.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight">
            Bookmarks & Reading List
          </h1>
          <p className="text-xs opacity-60 mt-1">
            @{currentUser.username} • {bookmarkedIds.length} saved{' '}
            {bookmarkedIds.length === 1 ? 'story' : 'stories'}
          </p>
        </div>

        {bookmarkedIds.length > 0 && (
          <button
            type="button"
            onClick={onClearAllBookmarks}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-rose-500/25 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear all bookmarks
          </button>
        )}
      </div>

      {bookmarkedIds.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 opacity-45 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter your saved stories..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/15 text-sm focus:outline-none focus:border-sky-400/50"
          />
        </div>
      )}

      {savedPosts.length > 0 ? (
        <div className="space-y-4">
          {savedPosts.map((post) => {
            const author = users.find((u) => u.id === post.authorId) || users[0];
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
                isReposted={repostedIds.includes(post.id)}
                onLike={onLike}
                onRepost={onRepost}
                onToggleBookmark={onToggleBookmark}
                onAddComment={onAddComment}
                onUpdatePost={onUpdatePost}
                onDeletePost={onDeletePost}
                onPlayAudio={onPlayAudio}
                onOpenLightbox={onOpenLightbox}
              />
            );
          })}
        </div>
      ) : (
        <div
          style={{ backgroundColor: cardBgColor }}
          className="p-12 rounded-2xl border border-slate-500/15 text-center space-y-3"
        >
          <Bookmark className="w-8 h-8 mx-auto opacity-30" />
          <div className="font-semibold text-base">Save stories for later</div>
          <p className="text-xs opacity-60 max-w-sm mx-auto leading-relaxed">
            Bookmark breaking reports, longform investigations, or videos on your feed to build your personal reading list.
          </p>
          <div className="pt-2">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-slate-950"
              style={{ backgroundColor: primaryColor }}
            >
              <Compass className="w-3.5 h-3.5" /> Explore Today&apos;s Stories
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
