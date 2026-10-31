import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Clock,
  Film,
  Heart,
  MapPin,
  MessageCircle,
  Play,
  TrendingUp,
} from 'lucide-react';
import { NewsPost, PostCategory, User } from '../types';

interface Explore3DPageProps {
  posts: NewsPost[];
  users: User[];
  primaryColor: string;
  breakingColor: string;
  cardBgColor: string;
  isDark: boolean;
  bookmarkedIds?: string[];
  onToggleBookmark?: (postId: string) => void;
}

export const Explore3DPage: React.FC<Explore3DPageProps> = ({
  posts,
  users,
  primaryColor,
  cardBgColor,
  isDark,
  bookmarkedIds = [],
  onToggleBookmark,
}) => {
  const published = posts.filter((p) => p.status !== 'draft' && p.status !== 'removed');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'video' | PostCategory>('all');
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [pollVoted, setPollVoted] = useState<number | null>(null);

  const featuredPosts = published.slice(0, 3);
  const activeHero = featuredPosts[featuredIdx] || published[0];
  const heroAuthor = users.find((u) => u.id === activeHero?.authorId);

  const gridPosts = published.filter((p) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'video') return p.media.some((m) => m.type === 'video');
    return p.category === selectedCategory;
  });

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-8">
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

            return (
              <article
                key={post.id}
                style={{ backgroundColor: cardBgColor }}
                className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-colors ${
                  isDark
                    ? 'border-white/[0.08] hover:border-white/[0.16]'
                    : 'border-black/[0.08] hover:border-black/[0.16] shadow-sm'
                }`}
              >
                <div>
                  {post.media[0] && (
                    <Link
                      to={`/article/${post.id}`}
                      className="block relative h-52 overflow-hidden bg-black"
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

                <div
                  className={`px-5 py-3.5 border-t flex items-center justify-between text-xs ${
                    isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
                  }`}
                >
                  <Link
                    to={`/profile/${author?.username || 'reporter'}`}
                    className="flex items-center gap-2 truncate"
                  >
                    <img
                      src={author?.avatarUrl}
                      alt={author?.displayName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="font-medium truncate">{author?.displayName}</span>
                  </Link>

                  <div className="flex items-center gap-3 opacity-70">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" /> {post.upvotes}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" /> {post.commentCount}
                    </span>
                    {onToggleBookmark && (
                      <button
                        type="button"
                        onClick={() => onToggleBookmark(post.id)}
                        className={isSaved ? 'text-sky-400' : 'hover:opacity-100'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </div>
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
    </div>
  );
};
