import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Heart, MessageCircle, Repeat2, ShieldCheck, UserPlus } from 'lucide-react';
import { NewsPost, User } from '../types';

interface NotificationsPageProps {
  users: User[];
  posts: NewsPost[];
  primaryColor: string;
  cardBgColor: string;
  isDark: boolean;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  users,
  posts,
  primaryColor,
  cardBgColor,
  isDark,
}) => {
  const [filter, setFilter] = useState<'all' | 'verified' | 'mentions'>('all');
  const [allRead, setAllRead] = useState(false);

  const notifications = [
    {
      id: 'n-1',
      type: 'like',
      actor: users[1],
      post: posts[0],
      time: '8m ago',
      unread: !allRead,
      text: 'endorsed your breaking report on the Tokyo Maglev Express trial.',
    },
    {
      id: 'n-2',
      type: 'comment',
      actor: users[2],
      post: posts[0],
      time: '24m ago',
      unread: !allRead,
      text: 'replied: "The acoustic reduction on this pod is incredible! Measured under 58dB."',
    },
    {
      id: 'n-3',
      type: 'repost',
      actor: users[3],
      post: posts[1],
      time: '1h ago',
      unread: false,
      text: 'reposted the Rotterdam storm-surge barrier update to their followers.',
    },
    {
      id: 'n-4',
      type: 'follow',
      actor: users[4],
      post: posts[3],
      time: '3h ago',
      unread: false,
      text: 'started following your newsroom feed.',
    },
    {
      id: 'n-5',
      type: 'verified',
      actor: users[0],
      post: posts[5],
      time: '5h ago',
      unread: false,
      text: 'verified your correspondent credentials and Community Note citation.',
    },
  ].filter((item) => {
    if (filter === 'verified') return item.actor?.verificationTier !== 'standard';
    if (filter === 'mentions') return item.type === 'comment';
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-20 space-y-5">
      <div
        style={{ backgroundColor: cardBgColor }}
        className={`p-5 sm:p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
        }`}
      >
        <div>
          <h1 className="font-editorial text-2xl font-semibold">Notifications</h1>
          <p className="text-xs opacity-60 mt-0.5">
            Activity across your stories, comments, and correspondent network
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`inline-flex rounded-full p-1 text-xs border ${
              isDark ? 'border-white/10 bg-white/[0.03]' : 'border-black/10 bg-black/[0.03]'
            }`}
          >
            {(['all', 'verified', 'mentions'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1 rounded-full capitalize transition-colors ${
                  filter === tab
                    ? isDark
                      ? 'bg-white text-slate-950 font-semibold'
                      : 'bg-slate-900 text-white font-semibold'
                    : 'opacity-65 hover:opacity-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAllRead(true)}
            className="px-3 py-1.5 rounded-full text-xs opacity-65 hover:opacity-100"
          >
            Mark all read
          </button>
        </div>
      </div>

      <div
        style={{ backgroundColor: cardBgColor }}
        className={`rounded-2xl border divide-y overflow-hidden ${
          isDark
            ? 'border-white/[0.08] divide-white/[0.06]'
            : 'border-black/[0.08] divide-black/[0.06]'
        }`}
      >
        {notifications.map((n) => (
          <Link
            key={n.id}
            to={n.post ? `/article/${n.post.id}` : `/profile/${n.actor?.username}`}
            className={`p-4 sm:p-5 flex items-start gap-3.5 transition-colors ${
              n.unread
                ? isDark
                  ? 'bg-sky-500/[0.04] hover:bg-white/[0.03]'
                  : 'bg-sky-500/[0.04] hover:bg-black/[0.02]'
                : isDark
                ? 'hover:bg-white/[0.02]'
                : 'hover:bg-black/[0.02]'
            }`}
          >
            <div className="mt-1 shrink-0">
              {n.type === 'like' && <Heart className="w-4 h-4 text-rose-500 fill-current" />}
              {n.type === 'comment' && <MessageCircle className="w-4 h-4 text-sky-400" />}
              {n.type === 'repost' && <Repeat2 className="w-4 h-4 text-emerald-400" />}
              {n.type === 'follow' && <UserPlus className="w-4 h-4" style={{ color: primaryColor }} />}
              {n.type === 'verified' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
            </div>

            <img
              src={n.actor?.avatarUrl}
              alt={n.actor?.displayName}
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />

            <div className="flex-1 min-w-0 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold flex items-center gap-1">
                  {n.actor?.displayName}
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                </span>
                <span className="text-xs opacity-50 shrink-0">{n.time}</span>
              </div>
              <p className="opacity-80 mt-0.5 text-xs sm:text-sm leading-relaxed">{n.text}</p>
              {n.post && (
                <div className="mt-2 text-xs opacity-55 truncate font-medium">
                  “{n.post.headline}”
                </div>
              )}
            </div>

            {n.unread && (
              <span
                className="w-2 h-2 rounded-full mt-2 shrink-0"
                style={{ backgroundColor: primaryColor }}
              />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};
