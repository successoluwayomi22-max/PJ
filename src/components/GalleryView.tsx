import React, { useState } from 'react';
import {
  Camera,
  Compass,
  Eye,
  Film,
  Layers,
  MapPin,
  Play,
  Radio,
  ShieldCheck,
  X,
} from 'lucide-react';
import { MediaItem, NewsPost, User } from '../types';
import { Tilt3DCard } from './Tilt3DCard';
import { Panorama360Viewer } from './Panorama360Viewer';

interface GalleryViewProps {
  posts: NewsPost[];
  users: User[];
  primaryColor: string;
  breakingColor: string;
  cardBgColor: string;
  isDark: boolean;
  enable3DTilt: boolean;
  tiltIntensity: number;
}

interface FlattenedGalleryItem {
  media: MediaItem;
  post: NewsPost;
  author: User | undefined;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  posts,
  users,
  primaryColor,
  breakingColor,
  cardBgColor,
  isDark,
  enable3DTilt,
  tiltIntensity,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'video' | 'image' | 'panorama_360'>('all');
  const [eyewitnessOnly, setEyewitnessOnly] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<FlattenedGalleryItem | null>(null);

  const allItems: FlattenedGalleryItem[] = [];
  posts
    .filter((p) => p.status !== 'draft' && p.status !== 'removed')
    .forEach((post) => {
      if (eyewitnessOnly && !post.isEyewitness) return;
      const author = users.find((u) => u.id === post.authorId);
      post.media.forEach((media) => {
        if (filterType === 'all' || media.type === filterType) {
          allItems.push({ media, post, author });
        }
      });
    });

  return (
    <div className="space-y-6">
      {/* Gallery Hero Banner (Inspired by react.dev confs/[slug].js video gallery) */}
      <div
        style={{ backgroundColor: cardBgColor }}
        className="p-6 rounded-2xl border border-slate-500/20 relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-sky-500/15 text-sky-400">
              <Layers className="w-3.5 h-3.5" /> Eyewitness Visual Hub & Press Gallery
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Global Eyewitness Media Stream
            </h1>
            <p className="text-sm opacity-75 mt-1 max-w-2xl">
              Explore C2PA-verified 4K video journalism, high-resolution field photography, and interactive 360° spatial captures uploaded by citizens and correspondents worldwide.
            </p>
          </div>

          {/* Filter Switcher Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: `All Media (${allItems.length})`, icon: Layers },
              { id: 'video', label: '4K Videos', icon: Film },
              { id: 'image', label: 'Photojournalism', icon: Camera },
              { id: 'panorama_360', label: '360° Spatial 3D', icon: Compass },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id as typeof filterType)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    active ? 'text-slate-950 shadow-md' : 'bg-slate-500/10 hover:bg-slate-500/20'
                  }`}
                  style={active ? { backgroundColor: primaryColor } : undefined}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setEyewitnessOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                eyewitnessOnly
                  ? 'bg-rose-500 text-white border-rose-400'
                  : 'border-rose-500/40 text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Eyewitness Only
            </button>
          </div>
        </div>
      </div>

      {/* 3D Bento Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {allItems.map((item, index) => {
          const isFeaturedWide = index === 0 && filterType === 'all';
          return (
            <div
              key={`${item.post.id}-${item.media.id}`}
              className={isFeaturedWide ? 'md:col-span-2' : ''}
            >
              <Tilt3DCard
                enabled={enable3DTilt}
                intensity={tiltIntensity}
                glowColor={`${primaryColor}40`}
                className="h-full"
              >
                <div
                  onClick={() => setLightboxItem(item)}
                  style={{ backgroundColor: cardBgColor }}
                  className="group cursor-pointer h-full rounded-2xl border border-slate-500/20 overflow-hidden flex flex-col shadow-lg hover:border-sky-400/50 transition-all"
                >
                  <div className="relative h-60 sm:h-64 overflow-hidden bg-slate-950">
                    <img
                      src={item.media.thumbnailUrl || item.media.url}
                      alt={item.post.headline}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                    {/* Top Media Type & Eyewitness Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white backdrop-blur-md"
                        style={{
                          backgroundColor:
                            item.media.type === 'video'
                              ? breakingColor
                              : item.media.type === 'panorama_360'
                              ? '#10B981'
                              : 'rgba(15, 23, 42, 0.85)',
                        }}
                      >
                        {item.media.type === 'video' && <Play className="w-3 h-3 fill-current" />}
                        {item.media.type === 'panorama_360' && <Compass className="w-3.5 h-3.5" />}
                        {item.media.type === 'image' && <Camera className="w-3 h-3" />}
                        {item.media.type === 'video'
                          ? `4K VIDEO • ${item.media.durationSeconds || 30}s`
                          : item.media.type === 'panorama_360'
                          ? '360° 3D SCENE'
                          : 'RAW PRESS PHOTO'}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-950/80 text-emerald-400 border border-emerald-400/30 backdrop-blur-md">
                        <ShieldCheck className="w-3 h-3" /> {item.post.forensics.authenticityScore}% C2PA
                      </span>
                    </div>

                    {/* Floating 3D Location & Headline Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="flex items-center gap-1.5 text-xs text-sky-300 font-semibold mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{item.post.locationName}</span>
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base line-clamp-2 leading-snug">
                        {item.post.headline}
                      </h3>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-3.5 flex items-center justify-between text-xs mt-auto">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.author?.avatarUrl}
                        alt={item.author?.displayName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="font-semibold truncate">{item.author?.displayName}</span>
                    </div>
                    <div className="flex items-center gap-3 opacity-75">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {(item.post.viewCount / 1000).toFixed(1)}K
                      </span>
                      <span
                        className="font-bold hover:underline"
                        style={{ color: primaryColor }}
                      >
                        Inspect 3D ↗
                      </span>
                    </div>
                  </div>
                </div>
              </Tilt3DCard>
            </div>
          );
        })}
      </div>

      {/* Cinema Lightbox Theatre Modal */}
      {lightboxItem && (
        <div
          onClick={() => setLightboxItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl rounded-2xl bg-slate-900 text-white border border-white/15 overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                <MapPin className="w-4 h-4" />
                <span>{lightboxItem.post.locationName}</span>
                <span>•</span>
                <span className="text-emerald-400">
                  C2PA Authenticity: {lightboxItem.post.forensics.authenticityScore}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="p-1.5 rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {lightboxItem.media.type === 'panorama_360' ? (
                <Panorama360Viewer
                  imageUrl={lightboxItem.media.url}
                  caption={lightboxItem.media.caption}
                  locationName={lightboxItem.post.locationName}
                />
              ) : lightboxItem.media.type === 'video' ? (
                <video
                  src={lightboxItem.media.url}
                  poster={lightboxItem.media.thumbnailUrl}
                  controls
                  autoPlay
                  className="w-full max-h-[460px] rounded-xl bg-black"
                />
              ) : (
                <img
                  src={lightboxItem.media.url}
                  alt={lightboxItem.post.headline}
                  className="w-full max-h-[460px] object-contain rounded-xl bg-black"
                />
              )}

              <div>
                <h2 className="text-lg sm:text-xl font-extrabold">{lightboxItem.post.headline}</h2>
                <p className="text-sm text-slate-300 mt-1">{lightboxItem.post.bodyText}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

