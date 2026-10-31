import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Heart,
  MessageCircle,
  Repeat2,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { NewsPost, User } from '../types';

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'repost' | 'follow' | 'verified';
  actorId: string;
  postId?: string;
  time: string;
  text: string;
}

interface NotificationsPageProps {
  users: User[];
  posts: NewsPost[];
  notifications: NotificationItem[];
  readNotificationIds: string[];
  primaryColor: string;
  cardBgColor: string;
  isDark: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  users,
  posts,
  notifications,
  readNotificationIds,
  primaryColor,
  cardBgColor,
  isDark,
  onMarkRead,
  onMarkAllRead,
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread' | 'verified' | 'mentions'>('all');

  const enriched = notifications
    .map((n) => ({
      ...n,
      actor: users.find((u) => u.id === n.actorId) || users[0],
      post: n.postId ? posts.find((p) => p.id === n.postId) : undefined,
      unread: !readNotificationIds.includes(n.id),
    }))
    .filter((item) => {
      if (filter === 'unread') return item.unread;
      if (filter === 'verified') return item.actor?.verificationTier !== 'standard';
      if (filter === 'mentions') return item.type === 'comment' || item.type === 'repost';
      return true;
    });

  const unreadCount = notifications.filter((n) => !readNotificationIds.includes(n.id)).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5">
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-slate-500/25 hover:bg-slate-500/10 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      <div
        style={{ backgroundColor: cardBgColor }}
        className={`p-5 sm:p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
        }`}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-editorial text-2xl font-semibold">Notifications</h1>
            {unreadCount > 0 ? (
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-950"
                style={{ backgroundColor: primaryColor }}
              >
                {unreadCount} new
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400">
                All caught up
              </span>
            )}
          </div>
          <p className="text-xs opacity-60 mt-1">
            Click any notification to open it and automatically mark it as read
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex rounded-full p-1 text-xs border ${
              isDark ? 'border-white/10 bg-white/[0.03]' : 'border-black/10 bg-black/[0.03]'
            }`}
          >
            {(['all', 'unread', 'verified', 'mentions'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-full capitalize transition-colors ${
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

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {enriched.length === 0 ? (
        <div
          style={{ backgroundColor: cardBgColor }}
          className="p-12 rounded-2xl border border-slate-500/15 text-center space-y-2"
        >
          <Bell className="w-8 h-8 mx-auto opacity-30" />
          <div className="font-semibold text-sm">No notifications in this view</div>
          <p className="text-xs opacity-60">
            {filter === 'unread'
              ? 'You have read all your notifications!'
              : 'New likes, replies, reposts, and follows will appear here.'}
          </p>
        </div>
      ) : (
        <div
          style={{ backgroundColor: cardBgColor }}
          className={`rounded-2xl border divide-y overflow-hidden ${
            isDark
              ? 'border-white/[0.08] divide-white/[0.06]'
              : 'border-black/[0.08] divide-black/[0.06]'
          }`}
        >
          {enriched.map((n) => {
            const targetUrl = n.post
              ? `/article/${n.post.id}`
              : `/profile/${n.actor?.username || 'reporter'}`;

            return (
              <div
                key={n.id}
                onClick={() => {
                  onMarkRead(n.id);
                  navigate(targetUrl);
                }}
                className={`cursor-pointer p-4 sm:p-5 flex items-start gap-3.5 transition-colors ${
                  n.unread
                    ? isDark
                      ? 'bg-sky-500/[0.07] hover:bg-sky-500/[0.11]'
                      : 'bg-sky-500/[0.06] hover:bg-sky-500/[0.10]'
                    : isDark
                    ? 'opacity-75 hover:opacity-100 hover:bg-white/[0.02]'
                    : 'opacity-75 hover:opacity-100 hover:bg-black/[0.02]'
                }`}
              >
                <div className="mt-1 shrink-0">
                  {n.type === 'like' && <Heart className="w-4 h-4 text-rose-500 fill-current" />}
                  {n.type === 'comment' && <MessageCircle className="w-4 h-4 text-sky-400" />}
                  {n.type === 'repost' && <Repeat2 className="w-4 h-4 text-emerald-400" />}
                  {n.type === 'follow' && (
                    <UserPlus className="w-4 h-4" style={{ color: primaryColor }} />
                  )}
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
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs opacity-50">{n.time}</span>
                      {n.unread ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkRead(n.id);
                          }}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-400 hover:bg-sky-500/30"
                        >
                          Unread
                        </button>
                      ) : (
                        <span className="text-[10px] opacity-45 font-mono">Read</span>
                      )}
                    </div>
                  </div>
                  <p className="opacity-85 mt-0.5 text-xs sm:text-sm leading-relaxed">{n.text}</p>
                  {n.post && (
                    <div className="mt-2 text-xs opacity-60 truncate font-medium">
                      “{n.post.headline}”
                    </div>
                  )}
                </div>

                {n.unread && (
                  <span
                    className="w-2.5 h-2.5 rounded-full mt-2 shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
