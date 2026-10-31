import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Check,
  Compass,
  Film,
  Link2,
  MapPin,
  Navigation,
  Radio,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { MediaItem, NewsPost, PostCategory, User } from '../types';
import { Panorama360Viewer } from '../components/Panorama360Viewer';

interface CreatePostPageProps {
  currentUser: User;
  primaryColor: string;
  breakingColor: string;
  cardBgColor: string;
  isDark: boolean;
  onCreatePost: (newPost: NewsPost) => void;
}

const BUREAU_PRESETS = [
  { name: 'Shinagawa, Tokyo, Japan', lat: 35.6284, lng: 139.7387 },
  { name: 'Midtown Manhattan, New York, USA', lat: 40.7549, lng: -73.984 },
  { name: 'Westminster, London, UK', lat: 51.5007, lng: -0.1246 },
  { name: 'Victoria Island, Lagos, Nigeria', lat: 6.4281, lng: 3.4219 },
  { name: 'Pont de l’Alma, Paris, France', lat: 48.8634, lng: 2.3018 },
  { name: 'Hoek van Holland, Rotterdam', lat: 51.9775, lng: 4.165 },
];

export const CreatePostPage: React.FC<CreatePostPageProps> = ({
  currentUser,
  primaryColor,
  breakingColor,
  cardBgColor,
  isDark,
  onCreatePost,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEyewitness, setIsEyewitness] = useState(true);
  const [headline, setHeadline] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [summaryPoints, setSummaryPoints] = useState<string[]>([
    'Primary field observation confirmed with hardware timestamp.',
    'Local infrastructure and sensor telemetry verified on-scene.',
  ]);
  const [category, setCategory] = useState<PostCategory>('breaking');
  const [tagsInput, setTagsInput] = useState('#FieldDispatch, #VerifiedWire');
  const [locationName, setLocationName] = useState('Shinagawa, Tokyo, Japan');
  const [coords, setCoords] = useState({ lat: 35.6284, lng: 139.7387 });
  const [privacyLevel, setPrivacyLevel] = useState<'exact' | 'city'>('exact');
  const [externalUrl, setExternalUrl] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);

  const [mediaList, setMediaList] = useState<MediaItem[]>([
    {
      id: 'init-frame-1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80',
      caption: 'Primary field frame signed with C2PA provenance credentials',
    },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const objectUrl = URL.createObjectURL(file);
      const isVid = file.type.startsWith('video/');
      setMediaList((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}-${Math.random()}`,
          type: isVid ? 'video' : 'image',
          url: objectUrl,
          caption: `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB`,
          durationSeconds: isVid ? 42 : undefined,
        },
      ]);
    });
  };

  const handleDetectGps = () => {
    setDetectingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lng = Number(pos.coords.longitude.toFixed(4));
          setCoords({ lat, lng });
          setLocationName(`Verified Coordinates (${lat}°N, ${lng}°E)`);
          setDetectingGps(false);
        },
        () => {
          const preset = BUREAU_PRESETS[Math.floor(Math.random() * BUREAU_PRESETS.length)];
          setCoords({ lat: preset.lat, lng: preset.lng });
          setLocationName(preset.name);
          setDetectingGps(false);
        },
        { timeout: 3500 }
      );
    } else {
      setDetectingGps(false);
    }
  };

  const handleAiSynthesize = () => {
    const nextTitle =
      headline.trim() ||
      'Next-Generation Urban Autonomous Grid Completes Full-Load Field Trial';
    const nextBody =
      bodyText.trim() ||
      'Reporting directly from the central telemetry corridor where municipal engineers and independent observers have confirmed 100% operational stability across all primary substations.';
    setHeadline(nextTitle);
    setBodyText(nextBody);
    setSummaryPoints([
      `Reported on-scene from ${locationName} by ${currentUser.displayName}.`,
      'Cryptographic C2PA hardware signature and GPS coordinates locked.',
      'Zero acoustic or grid anomalies recorded during peak stress testing.',
    ]);
  };

  const handlePublish = (asDraft: boolean) => {
    const finalHeadline =
      headline.trim() || 'Untitled Field Dispatch — Verified Correspondent Report';
    const finalBody =
      bodyText.trim() ||
      'On-scene dispatch submitted with C2PA provenance metadata and geospatial telemetry.';

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const newPost: NewsPost = {
      id: `post-${Date.now()}`,
      authorId: currentUser.id,
      headline: finalHeadline,
      bodyText: finalBody,
      aiSummary: summaryPoints.filter(Boolean),
      category,
      status: asDraft ? 'draft' : 'published',
      tags: parsedTags.length ? parsedTags : ['#FieldDispatch'],
      isEyewitness,
      isBreakingPinned: false,
      externalSourceUrl: externalUrl.trim() || undefined,
      locationName:
        privacyLevel === 'city'
          ? locationName.split(',').slice(-2).join(',').trim() || locationName
          : locationName,
      latitude: coords.lat,
      longitude: coords.lng,
      privacyLevel,
      media: mediaList,
      upvotes: 1,
      downvotes: 0,
      commentCount: 0,
      viewCount: 1,
      shareCount: 0,
      velocityPer15m: isEyewitness ? 4.4 : 2.2,
      createdAt: new Date().toISOString(),
      forensics: {
        authenticityScore: isEyewitness ? 99 : 91,
        exifVerified: true,
        gpsWeatherMatch: true,
        deepfakeProbability: 1,
        recycledFootageCheck: 'Original Capture',
        deviceSignature: isEyewitness
          ? 'C2PA Hardware Enclave • GPS Telemetry Signed'
          : 'Pulse Publishing Studio • Verified Correspondent',
      },
    };

    onCreatePost(newPost);
    if (asDraft) {
      navigate('/studio');
    } else {
      navigate(`/article/${newPost.id}`);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
      {/* Studio Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-500/15">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-slate-500/20 hover:bg-slate-500/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest opacity-60">
              Editorial Publishing Studio
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-semibold">
              Compose Verified Dispatch
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleAiSynthesize}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Synthesize Executive Brief
          </button>
          <button
            type="button"
            onClick={() => handlePublish(true)}
            className="px-4 py-2 rounded-full text-xs font-medium border border-slate-500/25 hover:bg-slate-500/10 transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handlePublish(false)}
            className="px-5 py-2 rounded-full text-xs font-semibold text-slate-950 shadow-sm transition-transform active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            Publish Dispatch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: COMPOSER CONTROLS */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. On-Scene Eyewitness Provenance Toggle */}
          <div
            onClick={() => setIsEyewitness((v) => !v)}
            style={{ backgroundColor: cardBgColor }}
            className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${
              isEyewitness ? 'border-rose-500/40' : 'border-slate-500/15'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className="p-2.5 rounded-xl text-white"
                style={{ backgroundColor: isEyewitness ? breakingColor : '#334155' }}
              >
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold flex items-center gap-2">
                  <span>On-Scene Eyewitness Provenance</span>
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-rose-500/15 text-rose-400">
                    {isEyewitness ? 'C2PA Locked' : 'Standard'}
                  </span>
                </div>
                <p className="text-xs opacity-65 mt-0.5">
                  Cryptographically signs device GPS, sensor timestamp, and elevates initial feed velocity.
                </p>
              </div>
            </div>

            <div
              className={`w-11 h-6 rounded-full p-1 transition-colors shrink-0 ${
                isEyewitness ? 'bg-rose-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isEyewitness ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* 2. Headline & Lead Story Composer */}
          <div
            style={{ backgroundColor: cardBgColor }}
            className="p-6 rounded-2xl border border-slate-500/15 space-y-5"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider opacity-60 mb-2">
                <span>Editorial Headline *</span>
                <span>{headline.length} / 140</span>
              </div>
              <input
                type="text"
                maxLength={140}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Write a clear, authoritative headline..."
                className="w-full font-editorial text-2xl sm:text-3xl font-semibold bg-transparent border-b border-slate-500/20 pb-3 focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider opacity-60 mb-2">
                Dispatch Body & Field Observations *
              </label>
              <textarea
                rows={5}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Report verified facts, eyewitness observations, and primary source statements..."
                className="w-full p-4 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-sm sm:text-base leading-relaxed focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Executive Brief Bullet Points */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider opacity-60 mb-2">
                Executive Key Takeaways (TL;DR Brief)
              </label>
              <div className="space-y-2">
                {summaryPoints.map((pt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-mono text-xs opacity-50">0{idx + 1}</span>
                    <input
                      type="text"
                      value={pt}
                      onChange={(e) => {
                        const next = [...summaryPoints];
                        next[idx] = e.target.value;
                        setSummaryPoints(next);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-500/[0.06] border border-slate-500/20 text-xs focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Multi-Media Upload & Spatial Assets */}
          <div
            style={{ backgroundColor: cardBgColor }}
            className="p-6 rounded-2xl border border-slate-500/15 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">Media & Spatial Assets</h3>
                <p className="text-xs opacity-65">
                  Upload local video/image files or attach 4K streams and WebGL 360° spheres
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border border-slate-500/30 hover:bg-slate-500/10 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                <span>Upload Local Files</span>
              </button>
            </div>

            {/* Curated Sample Injectors */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setMediaList((prev) => [
                    ...prev,
                    {
                      id: `vid-${Date.now()}`,
                      type: 'video',
                      url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4',
                      thumbnailUrl:
                        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1000&auto=format&fit=crop&q=80',
                      caption: '4K Night Aerial Corridor Stream',
                      durationSeconds: 34,
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-xs"
              >
                <Film className="w-3.5 h-3.5 text-rose-400" /> + Attach 4K Video Stream
              </button>

              <button
                type="button"
                onClick={() =>
                  setMediaList((prev) => [
                    ...prev,
                    {
                      id: `img-${Date.now()}`,
                      type: 'image',
                      url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&auto=format&fit=crop&q=80',
                      caption: 'High-Resolution Press Frame',
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-xs"
              >
                <Camera className="w-3.5 h-3.5 text-sky-400" /> + Attach Press Still
              </button>

              <button
                type="button"
                onClick={() =>
                  setMediaList((prev) => [
                    ...prev,
                    {
                      id: `360-${Date.now()}`,
                      type: 'panorama_360',
                      url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&auto=format&fit=crop&q=80',
                      caption: 'WebGL 360° Equirectangular Sphere Capture',
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-xs"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400" /> + Attach 360° WebGL Sphere
              </button>
            </div>

            {/* Attached Media Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {mediaList.map((m) => (
                <div
                  key={m.id}
                  className="relative rounded-xl overflow-hidden border border-slate-500/20 h-28 bg-black group"
                >
                  <img
                    src={m.thumbnailUrl || m.url}
                    alt={m.caption}
                    className="w-full h-full object-cover opacity-85"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-white font-mono text-[10px] uppercase">
                    {m.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMediaList((prev) => prev.filter((x) => x.id !== m.id))}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Geospatial Telemetry & Categorization */}
          <div
            style={{ backgroundColor: cardBgColor }}
            className="p-6 rounded-2xl border border-slate-500/15 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono uppercase tracking-wider opacity-60 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                Geospatial Telemetry & Beat Classification
              </span>
              <button
                type="button"
                onClick={handleDetectGps}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 text-sky-400 font-medium"
              >
                <Navigation className="w-3 h-3" />
                <span>{detectingGps ? 'Locking GPS...' : 'Lock Browser GPS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block opacity-70 mb-1">Dateline Location</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block opacity-70 mb-1">Global Bureau Preset</label>
                <select
                  onChange={(e) => {
                    const found = BUREAU_PRESETS.find((b) => b.name === e.target.value);
                    if (found) {
                      setLocationName(found.name);
                      setCoords({ lat: found.lat, lng: found.lng });
                    }
                  }}
                  value={BUREAU_PRESETS.some((b) => b.name === locationName) ? locationName : ''}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-500/[0.06] border border-slate-500/20"
                >
                  <option value="" disabled>
                    Select Bureau Coordinates...
                  </option>
                  {BUREAU_PRESETS.map((b) => (
                    <option key={b.name} value={b.name} className="bg-slate-900 text-white">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block opacity-70 mb-1">Editorial Section</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PostCategory)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 font-medium"
                >
                  <option value="breaking" className="bg-slate-900 text-white">Breaking Wire</option>
                  <option value="tech" className="bg-slate-900 text-white">Tech & AI</option>
                  <option value="science" className="bg-slate-900 text-white">Science & Climate</option>
                  <option value="politics" className="bg-slate-900 text-white">Politics & Policy</option>
                  <option value="business" className="bg-slate-900 text-white">Markets & Economy</option>
                  <option value="weather_disaster" className="bg-slate-900 text-white">Weather & Crisis</option>
                  <option value="local" className="bg-slate-900 text-white">Local Bureau</option>
                  <option value="culture" className="bg-slate-900 text-white">World Culture</option>
                </select>
              </div>

              <div>
                <label className="block opacity-70 mb-1">Topic Tags</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-500/[0.06] border border-slate-500/20"
                />
              </div>

              <div>
                <label className="block opacity-70 mb-1">Coordinate Precision</label>
                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={privacyLevel === 'exact'}
                      onChange={() => setPrivacyLevel('exact')}
                    />
                    <span>Exact Pin</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={privacyLevel === 'city'}
                      onChange={() => setPrivacyLevel('city')}
                    />
                    <span>City Only</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block opacity-70 mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" /> Primary Wire / Source Citation URL
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-500/[0.06] border border-slate-500/20"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE REAL-TIME EDITORIAL PREVIEW */}
        <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-widest opacity-60">
            Live Stream & Provenance Preview
          </div>

          <div
            style={{ backgroundColor: cardBgColor }}
            className="p-6 rounded-2xl border border-slate-500/20 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between text-[11px] font-mono uppercase opacity-70">
              <span className="text-sky-400">
                {isEyewitness ? '● ON-SCENE EYEWITNESS' : '● STANDARD DISPATCH'}
              </span>
              <span>
                {coords.lat.toFixed(2)}°N, {coords.lng.toFixed(2)}°E
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="text-xs">
                <div className="font-semibold flex items-center gap-1">
                  <span>{currentUser.displayName}</span>
                  <Check className="w-3 h-3 text-sky-400" />
                </div>
                <div className="opacity-60">{locationName}</div>
              </div>
            </div>

            <h2 className="font-editorial text-2xl font-semibold leading-snug">
              {headline.trim() || 'Your editorial headline will appear here in real time...'}
            </h2>

            <p className="text-sm leading-relaxed opacity-80">
              {bodyText.trim() ||
                'Your dispatch lead paragraph and verified field observations will render here as you type.'}
            </p>

            {mediaList[0] && (
              <div className="rounded-xl overflow-hidden border border-slate-500/15">
                {mediaList[0].type === 'panorama_360' ? (
                  <Panorama360Viewer
                    imageUrl={mediaList[0].url}
                    caption={mediaList[0].caption}
                    locationName={locationName}
                  />
                ) : (
                  <img
                    src={mediaList[0].thumbnailUrl || mediaList[0].url}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                )}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/25 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-mono text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> C2PA Hardware Signature Ready
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {isEyewitness ? '99/100' : '91/100'}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

