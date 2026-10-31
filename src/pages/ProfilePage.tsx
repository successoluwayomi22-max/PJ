import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Calendar,
  Check,
  Eye,
  FileText,
  Film,
  MapPin,
  Plus,
  ShieldCheck,
  ThumbsUp,
} from 'lucide-react';
import { CommunityNote, NewsPost, User } from '../types';

interface ProfilePageProps {
  users: User[];
  posts: NewsPost[];
  notes: CommunityNote[];
  currentUser: User;
  primaryColor: string;
  cardBgColor: string;
  isDark: boolean;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  users,
  posts,
  notes,
  currentUser,
  primaryColor,
  cardBgColor,
  isDark,
}) => {
  const { username } = useParams<{ username: string }>();
  const profileUser =
    users.find((u) => u.username.toLowerCase() === username?.toLowerCase()) || currentUser;

  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dispatches' | 'media' | 'credentials'>('dispatches');

  const userPosts = posts.filter(
    (p) => p.authorId === profileUser.id && p.status !== 'draft' && p.status !== 'removed'
  );
  const userNotes = notes.filter((n) => n.authorId === profileUser.id);
  const totalViews = userPosts.reduce((a, b) => a + b.viewCount, 0);
  const trustPct = Math.round(profileUser.trustScore * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-6">
      {/* Architectural Profile Banner & Identity Card */}
      <div
        style={{ backgroundColor: cardBgColor }}
        className="rounded-3xl border border-slate-500/15 overflow-hidden shadow-lg"
      >
        {/* Minimalist Cover Gradient */}
        <div
          className="h-36 sm:h-48 relative"
          style={{
            background: `linear-gradient(125deg, ${
              isDark ? '#0f172a' : '#1e293b'
            } 0%, ${primaryColor}35 55%, ${isDark ? '#060911' : '#0f172a'} 100%)`,
          }}
        >
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 text-white text-[11px] font-mono uppercase tracking-wider backdrop-blur-md border border-white/15">
            C2PA Correspondent ID • {profileUser.verificationTier.replace('_', ' ')}
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-5">
            <img
              src={profileUser.avatarUrl}
              alt={profileUser.displayName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-slate-950 shadow-xl"
            />

            <div className="flex items-center gap-2.5">
              {profileUser.id === currentUser.id ? (
                <Link
                  to="/studio"
                  className="px-4 py-2 rounded-full text-xs font-semibold border border-slate-500/30 hover:bg-slate-500/10 transition-colors"
                >
                  Open Reporter Studio
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFollowing((v) => !v)}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isFollowing
                      ? 'border border-slate-500/30 bg-slate-500/10'
                      : 'text-slate-950 shadow-sm'
                  }`}
                  style={!isFollowing ? { backgroundColor: primaryColor } : undefined}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Following Correspondent
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Follow Wire
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-editorial text-2xl sm:text-3xl font-semibold">
                  {profileUser.displayName}
                </h1>
                {profileUser.verificationTier !== 'standard' && (
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                    style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs opacity-65 font-mono">
                <span>@{profileUser.username}</span>
                <span className="inline-flex items-center gap-1 font-sans">
                  <MapPin className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  {profileUser.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Joined {profileUser.joinedAt}
                </span>
              </div>

              <p className="text-sm sm:text-[15px] leading-relaxed opacity-85 max-w-2xl">
                {profileUser.bio}
              </p>

              <div className="flex items-center gap-6 pt-2 text-xs font-mono">
                <div>
                  <strong className="text-sm">
                    {(profileUser.followersCount + (isFollowing ? 1 : 0)).toLocaleString()}
                  </strong>{' '}
                  <span className="opacity-60">Subscribers</span>
                </div>
                <div>
                  <strong className="text-sm">{userPosts.length}</strong>{' '}
                  <span className="opacity-60">Dispatches</span>
                </div>
                <div>
                  <strong className="text-sm">{(totalViews / 1000).toFixed(1)}K</strong>{' '}
                  <span className="opacity-60">Total Reach</span>
                </div>
              </div>
            </div>

            {/* Trust Score Meter Card */}
            <div className="lg:col-span-4 p-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Provenance Rating
                </span>
                <span className="font-bold text-base">{trustPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-500/20 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${trustPct}%` }}
                />
              </div>
              <p className="text-[11px] opacity-70 leading-relaxed">
                Calculated from historical C2PA sensor verification and peer-reviewed Community Notes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-500/15 pb-3">
        {[
          { id: 'dispatches', label: `Dispatches (${userPosts.length})`, icon: FileText },
          { id: 'media', label: 'Visual Media Reel', icon: Film },
          { id: 'credentials', label: `Community Verification (${userNotes.length})`, icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                active
                  ? isDark
                    ? 'bg-white text-slate-950'
                    : 'bg-slate-900 text-white'
                  : 'opacity-65 hover:opacity-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'dispatches' && (
        <div className="space-y-4">
          {userPosts.map((post) => (
            <Link
              key={post.id}
              to={`/article/${post.id}`}
              style={{ backgroundColor: cardBgColor }}
              className="block p-5 rounded-2xl border border-slate-500/15 hover:border-slate-500/35 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 text-[11px] font-mono opacity-60 uppercase">
                    <span>{post.category}</span>
                    <span>•</span>
                    <span>{post.locationName}</span>
                    <span>•</span>
                    <span>C2PA {post.forensics.authenticityScore}%</span>
                  </div>
                  <h3 className="font-editorial text-xl font-semibold">{post.headline}</h3>
                  <p className="text-xs sm:text-sm opacity-75 line-clamp-2">{post.bodyText}</p>
                  <div className="flex items-center gap-4 pt-2 text-xs font-mono opacity-65">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5" /> {post.upvotes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {post.viewCount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {post.media[0] && (
                  <img
                    src={post.media[0].thumbnailUrl || post.media[0].url}
                    alt={post.headline}
                    className="w-full sm:w-40 h-28 rounded-xl object-cover shrink-0"
                  />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'media' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {userPosts.flatMap((p) =>
            p.media.map((m) => (
              <Link
                key={m.id}
                to={`/article/${p.id}`}
                style={{ backgroundColor: cardBgColor }}
                className="group rounded-2xl overflow-hidden border border-slate-500/15"
              >
                <div className="h-48 overflow-hidden bg-black">
                  <img
                    src={m.thumbnailUrl || m.url}
                    alt={p.headline}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3.5 text-xs">
                  <div className="font-mono text-[10px] uppercase opacity-60">{m.type}</div>
                  <div className="font-semibold truncate mt-0.5">{p.headline}</div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === 'credentials' && (
        <div className="space-y-3">
          {userNotes.length === 0 ? (
            <div
              style={{ backgroundColor: cardBgColor }}
              className="p-8 rounded-2xl border border-slate-500/15 text-center text-sm opacity-70"
            >
              No Community Notes filed yet.
            </div>
          ) : (
            userNotes.map((n) => (
              <div
                key={n.id}
                style={{ backgroundColor: cardBgColor }}
                className="p-5 rounded-2xl border border-slate-500/15 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-emerald-400 uppercase">
                  <span>Community Verification Note</span>
                  <span>+{n.helpfulVotes} Helpful</span>
                </div>
                <p className="text-sm leading-relaxed">{n.noteText}</p>
                <Link
                  to={`/article/${n.postId}`}
                  className="inline-flex items-center gap-1 font-semibold pt-1 hover:underline"
                  style={{ color: primaryColor }}
                >
                  Inspect Associated Dispatch <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

