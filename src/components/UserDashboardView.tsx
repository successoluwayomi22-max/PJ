import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Award,
  Bookmark,
  Check,
  Edit3,
  Eye,
  FileText,
  Film,
  Plus,
  ShieldCheck,
  ThumbsUp,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { CommunityNote, NewsPost, User } from '../types';

interface UserDashboardViewProps {
  currentUser: User;
  posts: NewsPost[];
  notes: CommunityNote[];
  bookmarkedIds: string[];
  primaryColor: string;
  cardBgColor: string;
  onUpdatePost: (postId: string, updates: Partial<NewsPost>, reason: string) => void;
  onDeletePost: (postId: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
}

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  currentUser,
  posts,
  notes,
  bookmarkedIds,
  primaryColor,
  cardBgColor,
  onUpdatePost,
  onDeletePost,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<
    'my_posts' | 'drafts' | 'bookmarks' | 'media_vault' | 'profile'
  >('my_posts');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio);
  const [location, setLocation] = useState(currentUser.location);
  const [savedToast, setSavedToast] = useState(false);

  const myPosts = posts.filter((p) => p.authorId === currentUser.id);
  const myDrafts = myPosts.filter((p) => p.status === 'draft');
  const myPublished = myPosts.filter((p) => p.status !== 'draft');
  const bookmarkedPosts = posts.filter((p) => bookmarkedIds.includes(p.id));
  const myNotes = notes.filter((n) => n.authorId === currentUser.id);

  const totalViews = myPosts.reduce((acc, p) => acc + p.viewCount, 0);
  const totalUpvotes = myPosts.reduce((acc, p) => acc + p.upvotes, 0);
  const trustPercent = Math.round(currentUser.trustScore * 100);

  const displayedList =
    activeTab === 'drafts'
      ? myDrafts
      : activeTab === 'bookmarks'
      ? bookmarkedPosts
      : myPublished;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-6">
      {/* Studio Header */}
      <div
        style={{ backgroundColor: cardBgColor }}
        className="p-6 rounded-2xl border border-slate-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.displayName}
            className="w-14 h-14 rounded-2xl object-cover ring-1 ring-white/20"
          />
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest opacity-60">
              Correspondent Workspace
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <h1 className="font-editorial text-2xl font-semibold">{currentUser.displayName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-500/15">
                {currentUser.verificationTier.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/profile/${currentUser.username}`}
            className="px-4 py-2 rounded-full text-xs font-medium border border-slate-500/25 hover:bg-slate-500/10 transition-colors"
          >
            Public Profile
          </Link>
          <Link
            to="/create"
            className="px-5 py-2 rounded-full text-xs font-semibold text-slate-950 flex items-center gap-1.5 shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" /> New Dispatch
          </Link>
        </div>
      </div>

      {/* 4 Architectural KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          style={{ backgroundColor: cardBgColor }}
          className="p-5 rounded-2xl border border-slate-500/15 space-y-2"
        >
          <div className="flex items-center justify-between text-[11px] font-mono uppercase opacity-60">
            <span>Provenance Trust</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-3xl font-semibold">{trustPercent}%</div>
          <div className="w-full h-1 rounded-full bg-slate-500/20 overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full"
              style={{ width: `${trustPercent}%` }}
            />
          </div>
        </div>

        <div
          style={{ backgroundColor: cardBgColor }}
          className="p-5 rounded-2xl border border-slate-500/15 space-y-2"
        >
          <div className="flex items-center justify-between text-[11px] font-mono uppercase opacity-60">
            <span>Cumulative Reach</span>
            <Eye className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <div className="font-mono text-3xl font-semibold">
            {(totalViews / 1000).toFixed(1)}K
          </div>
          <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +18.4% 7d velocity
          </div>
        </div>

        <div
          style={{ backgroundColor: cardBgColor }}
          className="p-5 rounded-2xl border border-slate-500/15 space-y-2"
        >
          <div className="flex items-center justify-between text-[11px] font-mono uppercase opacity-60">
            <span>Reader Endorsements</span>
            <ThumbsUp className="w-4 h-4 opacity-70" />
          </div>
          <div className="font-mono text-3xl font-semibold">{totalUpvotes.toLocaleString()}</div>
          <div className="text-[11px] opacity-60 font-mono">
            {myPublished.length} active dispatches
          </div>
        </div>

        <div
          style={{ backgroundColor: cardBgColor }}
          className="p-5 rounded-2xl border border-slate-500/15 space-y-2"
        >
          <div className="flex items-center justify-between text-[11px] font-mono uppercase opacity-60">
            <span>Verification Notes</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-3xl font-semibold">{myNotes.length}</div>
          <div className="text-[11px] opacity-60 font-mono">
            {bookmarkedPosts.length} saved in archive
          </div>
        </div>
      </div>

      {/* Studio Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-500/15 pb-3">
        {[
          { id: 'my_posts', label: `Published (${myPublished.length})`, icon: FileText },
          { id: 'drafts', label: `Drafts (${myDrafts.length})`, icon: Edit3 },
          { id: 'bookmarks', label: `Reading List (${bookmarkedPosts.length})`, icon: Bookmark },
          { id: 'media_vault', label: 'Media Assets', icon: Film },
          { id: 'profile', label: 'Credentials & Settings', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                active
                  ? 'bg-slate-500/20 font-semibold'
                  : 'opacity-65 hover:opacity-100'
              }`}
              style={active ? { color: primaryColor } : undefined}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'media_vault' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {myPosts.flatMap((p) =>
            p.media.map((m) => (
              <Link
                key={m.id}
                to={`/article/${p.id}`}
                style={{ backgroundColor: cardBgColor }}
                className="rounded-2xl overflow-hidden border border-slate-500/15 group"
              >
                <div className="h-44 overflow-hidden bg-black">
                  <img
                    src={m.thumbnailUrl || m.url}
                    alt={p.headline}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3.5 text-xs">
                  <div className="font-mono text-[10px] uppercase opacity-60">{m.type}</div>
                  <div className="font-medium truncate mt-0.5">{p.headline}</div>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : activeTab === 'profile' ? (
        <div
          style={{ backgroundColor: cardBgColor }}
          className="p-6 rounded-2xl border border-slate-500/15 max-w-2xl space-y-4 text-xs"
        >
          <h3 className="text-sm font-semibold">Correspondent Credentials & Bureau Settings</h3>
          <div>
            <label className="block font-mono uppercase text-[10px] opacity-60 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.07] border border-slate-500/20"
            />
          </div>
          <div>
            <label className="block font-mono uppercase text-[10px] opacity-60 mb-1">
              Primary Bureau Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.07] border border-slate-500/20"
            />
          </div>
          <div>
            <label className="block font-mono uppercase text-[10px] opacity-60 mb-1">
              Editorial Biography
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.07] border border-slate-500/20"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onUpdateUser(currentUser.id, {
                  verificationTier: 'journalist',
                  trustScore: Math.min(0.99, Number((currentUser.trustScore + 0.03).toFixed(2))),
                });
                setSavedToast(true);
                setTimeout(() => setSavedToast(false), 2000);
              }}
              className="px-4 py-2 rounded-full font-medium border border-emerald-500/35 text-emerald-400 hover:bg-emerald-500/10"
            >
              Upgrade to Tier-3 Accredited Journalist
            </button>

            <button
              type="button"
              onClick={() => {
                onUpdateUser(currentUser.id, { displayName, bio, location });
                setSavedToast(true);
                setTimeout(() => setSavedToast(false), 2000);
              }}
              className="px-5 py-2 rounded-full font-semibold text-slate-950 flex items-center gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              {savedToast && <Check className="w-3.5 h-3.5" />}
              <span>{savedToast ? 'Saved' : 'Update Credentials'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedList.map((post) => (
            <div
              key={post.id}
              style={{ backgroundColor: cardBgColor }}
              className="p-4 sm:p-5 rounded-2xl border border-slate-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 min-w-0 flex-1">
                {post.media[0] && (
                  <img
                    src={post.media[0].thumbnailUrl || post.media[0].url}
                    alt={post.headline}
                    className="w-20 h-16 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  {editingPostId === post.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/30 border border-white/15 text-sm font-editorial"
                      />
                      <textarea
                        rows={2}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/30 border border-white/15 text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdatePost(
                              post.id,
                              { headline: editTitle, bodyText: editBody },
                              `Updated dispatch #${post.id}`
                            );
                            setEditingPostId(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-semibold"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPostId(null)}
                          className="px-3 py-1 rounded-lg text-xs opacity-70"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 text-[11px] font-mono uppercase opacity-60 mb-1">
                        <span>{post.status}</span>
                        <span>•</span>
                        <span>{post.locationName}</span>
                        <span>•</span>
                        <span>{post.viewCount.toLocaleString()} views</span>
                      </div>
                      <Link
                        to={`/article/${post.id}`}
                        className="font-editorial text-lg font-semibold hover:underline block truncate"
                      >
                        {post.headline}
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {post.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePost(
                        post.id,
                        { status: 'published' },
                        `Published draft #${post.id}`
                      )
                    }
                    className="px-3.5 py-1.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-semibold"
                  >
                    Publish
                  </button>
                )}
                <Link
                  to={`/article/${post.id}`}
                  className="p-2 rounded-full border border-slate-500/20 hover:bg-slate-500/10"
                  title="Read Dispatch"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPostId(post.id);
                    setEditTitle(post.headline);
                    setEditBody(post.bodyText);
                  }}
                  className="p-2 rounded-full border border-slate-500/20 hover:bg-slate-500/10"
                  title="Edit Dispatch"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeletePost(post.id)}
                  className="p-2 rounded-full border border-rose-500/25 text-rose-400 hover:bg-rose-500/10"
                  title="Delete Dispatch"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
