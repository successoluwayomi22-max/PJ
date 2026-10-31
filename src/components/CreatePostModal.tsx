import React, { useRef, useState } from 'react';
import {
  Camera,
  Compass,
  FileText,
  Film,
  Link2,
  MapPin,
  Navigation,
  Radio,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { MediaItem, NewsPost, PostCategory, User } from '../types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  primaryColor: string;
  breakingColor: string;
  onCreatePost: (newPost: NewsPost) => void;
}

const CITY_PRESETS = [
  { name: 'Shibuya, Tokyo, Japan', lat: 35.658, lng: 139.7016 },
  { name: 'Midtown Manhattan, New York, USA', lat: 40.7549, lng: -73.984 },
  { name: 'Westminster, London, UK', lat: 51.5007, lng: -0.1246 },
  { name: 'Victoria Island, Lagos, Nigeria', lat: 6.4281, lng: 3.4219 },
  { name: 'Champs-Élysées, Paris, France', lat: 48.8698, lng: 2.3075 },
  { name: 'Circular Quay, Sydney, Australia', lat: -33.8615, lng: 151.2108 },
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  primaryColor,
  breakingColor,
  onCreatePost,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEyewitness, setIsEyewitness] = useState(true);
  const [headline, setHeadline] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [category, setCategory] = useState<PostCategory>('breaking');
  const [tagsInput, setTagsInput] = useState('#Breaking, #Eyewitness');
  const [locationName, setLocationName] = useState('Shibuya, Tokyo, Japan');
  const [coords, setCoords] = useState({ lat: 35.658, lng: 139.7016 });
  const [privacyLevel, setPrivacyLevel] = useState<'exact' | 'city'>('exact');
  const [externalUrl, setExternalUrl] = useState('');
  const [gpsDetecting, setGpsDetecting] = useState(false);

  const [mediaList, setMediaList] = useState<MediaItem[]>([
    {
      id: 'init-media-1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1000&auto=format&fit=crop&q=80',
      caption: 'Live field capture attached with C2PA metadata',
    },
  ]);

  if (!isOpen) return null;

  const handleDetectGps = () => {
    setGpsDetecting(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lng = Number(pos.coords.longitude.toFixed(4));
          setCoords({ lat, lng });
          setLocationName(`GPS Verified (${lat}°, ${lng}°)`);
          setGpsDetecting(false);
        },
        () => {
          // Fallback to random global hub if permission denied
          const pick = CITY_PRESETS[Math.floor(Math.random() * CITY_PRESETS.length)];
          setCoords({ lat: pick.lat, lng: pick.lng });
          setLocationName(pick.name);
          setGpsDetecting(false);
        },
        { timeout: 4000 }
      );
    } else {
      setGpsDetecting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      setMediaList((prev) => [
        ...prev,
        {
          id: `upload-${Date.now()}-${Math.random()}`,
          type: isVideo ? 'video' : 'image',
          url,
          caption: `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
          durationSeconds: isVideo ? 45 : undefined,
        },
      ]);
    });
  };

  const handleAiEnhance = () => {
    if (!headline.trim()) {
      setHeadline('Live Eyewitness Report: Clean Energy & Autonomous Transit Hub Unveiled');
    } else {
      setHeadline(
        headline.charAt(0).toUpperCase() +
          headline.slice(1).replace(/\.$/, '') +
          ' — Confirmed On-Scene'
      );
    }
    if (!bodyText.trim()) {
      setBodyText(
        'On-the-ground verification from local correspondents and sensors confirms rapid deployment across the central district with full C2PA telemetry.'
      );
    }
  };

  const handleSubmit = (asDraft: boolean) => {
    if (!headline.trim()) return;
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const newPost: NewsPost = {
      id: `post-${Date.now()}`,
      authorId: currentUser.id,
      headline: headline.trim(),
      bodyText:
        bodyText.trim() ||
        'Breaking citizen journalism report submitted with verified location and timestamp metadata.',
      aiSummary: [
        `Reported directly from ${locationName} by ${currentUser.displayName}.`,
        isEyewitness
          ? 'Eyewitness Mode enabled: Hardware GPS & C2PA timestamp cryptographically verified.'
          : 'Community news report indexed for real-time feed verification.',
        `Categorized under ${category.toUpperCase()} with ${mediaList.length} media attachment(s).`,
      ],
      category,
      status: asDraft ? 'draft' : 'published',
      tags: parsedTags.length ? parsedTags : ['#BreakingNews'],
      isEyewitness,
      isBreakingPinned: false,
      externalSourceUrl: externalUrl.trim() || undefined,
      locationName:
        privacyLevel === 'city' ? locationName.split(',').slice(-2).join(',').trim() || locationName : locationName,
      latitude: coords.lat,
      longitude: coords.lng,
      privacyLevel,
      media: mediaList,
      upvotes: 1,
      downvotes: 0,
      commentCount: 0,
      viewCount: 1,
      shareCount: 0,
      velocityPer15m: isEyewitness ? 4.2 : 2.1,
      createdAt: new Date().toISOString(),
      forensics: {
        authenticityScore: isEyewitness ? 99 : 88,
        exifVerified: true,
        gpsWeatherMatch: true,
        deepfakeProbability: 1,
        recycledFootageCheck: 'Original Capture',
        deviceSignature: isEyewitness
          ? 'Pulse Eyewitness C2PA Hardware Enclave • GPS Locked'
          : 'Web Studio Upload • Verified Session',
      },
    };

    onCreatePost(newPost);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 text-slate-100 border border-white/15 shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span
              className="p-2 rounded-xl text-white"
              style={{ backgroundColor: isEyewitness ? breakingColor : primaryColor }}
            >
              <Radio className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-base">Create News Report</h3>
              <p className="text-xs text-slate-400">
                Publish verified citizen journalism, 4K video, or 360° spatial scenes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* 1. EYEWITNESS MODE TOGGLE */}
          <div
            onClick={() => setIsEyewitness((v) => !v)}
            className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-center justify-between ${
              isEyewitness
                ? 'border-rose-500/60 bg-rose-500/15'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${
                  isEyewitness ? 'bg-rose-500 animate-ping' : 'bg-slate-500'
                }`}
              />
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                  Eyewitness On-The-Scene Mode: {isEyewitness ? 'ACTIVE' : 'OFF'}
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Attaches cryptographic C2PA device timestamp, GPS coordinates & +1.5x Feed Priority Boost
                </p>
              </div>
            </div>
            <div
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                isEyewitness ? 'bg-rose-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isEyewitness ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* 2. HEADLINE + AUTO-FILL TEMPLATE */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span>Headline / What is happening? *</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAiEnhance}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/25 text-indigo-300 border border-indigo-400/40 hover:bg-indigo-500/35 transition-colors"
                >
                  <FileText className="w-3 h-3" /> Auto-Fill Template
                </button>
                <span className={headline.length > 140 ? 'text-rose-400' : 'text-slate-400'}>
                  {headline.length}/140
                </span>
              </div>
            </div>
            <input
              type="text"
              maxLength={140}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., Flash flood disrupts metro traffic at Central Station..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-white/15 text-sm font-bold focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* 3. CONTEXT / BODY DETAILS */}
          <div>
            <label className="block text-xs font-semibold mb-1.5">
              Add Context / Eyewitness Details
            </label>
            <textarea
              rows={3}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Describe what you are seeing, timeline of events, and verified facts..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-white/15 text-sm focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* 4. MEDIA UPLOAD AREA (Video, Photo, 360° Scene) */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span>Media Attachments (4K Video, Photo Carousel, 360° Scene)</span>
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
                className="inline-flex items-center gap-1 text-sky-400 hover:underline"
              >
                <Upload className="w-3.5 h-3.5" /> Upload from Device
              </button>
            </div>

            {/* Quick Sample Media Buttons */}
            <div className="flex flex-wrap gap-2 mb-2.5">
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
                        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
                      caption: '4K Night Aerial Eyewitness Feed',
                      durationSeconds: 34,
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs"
              >
                <Film className="w-3.5 h-3.5 text-rose-400" /> + Add Sample 4K Video
              </button>

              <button
                type="button"
                onClick={() =>
                  setMediaList((prev) => [
                    ...prev,
                    {
                      id: `img-${Date.now()}`,
                      type: 'image',
                      url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1000&auto=format&fit=crop&q=80',
                      caption: 'High-Resolution Press Photojournalism Frame',
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs"
              >
                <Camera className="w-3.5 h-3.5 text-sky-400" /> + Add Sample Press Photo
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
                      caption: '360° Interactive Spatial Street Capture',
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400" /> + Add 360° Spatial Scene
              </button>
            </div>

            {/* Attached Media Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {mediaList.map((item) => (
                <div
                  key={item.id}
                  className="relative group rounded-xl overflow-hidden border border-white/15 bg-slate-950 h-24"
                >
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.caption}
                    className="w-full h-full object-cover opacity-85"
                  />
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-slate-950/85 text-[10px] font-bold uppercase">
                    {item.type === 'panorama_360' ? '360° Panorama' : item.type === 'video' ? 'Video' : 'Photo'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMediaList((prev) => prev.filter((m) => m.id !== item.id))}
                    className="absolute top-1.5 right-1.5 p-1 rounded bg-rose-600 text-white opacity-90 hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 5. LOCATION DETECTOR & PRIVACY SETTING */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" /> Location & PostGIS Coordinates
              </label>
              <button
                type="button"
                onClick={handleDetectGps}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/40 text-xs font-semibold hover:bg-sky-500/30"
              >
                <Navigation className="w-3 h-3" />
                {gpsDetecting ? 'Detecting GPS...' : 'Auto-Detect Current GPS'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-white/15 text-xs font-semibold"
              />
              <select
                onChange={(e) => {
                  const found = CITY_PRESETS.find((c) => c.name === e.target.value);
                  if (found) {
                    setLocationName(found.name);
                    setCoords({ lat: found.lat, lng: found.lng });
                  }
                }}
                value={CITY_PRESETS.some((c) => c.name === locationName) ? locationName : ''}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-white/15 text-xs"
              >
                <option value="" disabled>
                  Quick-Select Global City Hub...
                </option>
                {CITY_PRESETS.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name} ({city.lat}°, {city.lng}°)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">Location Privacy Level:</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={privacyLevel === 'exact'}
                    onChange={() => setPrivacyLevel('exact')}
                  />
                  <span>Exact District Pin</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={privacyLevel === 'city'}
                    onChange={() => setPrivacyLevel('city')}
                  />
                  <span>City-Only (Anonymize Street)</span>
                </label>
              </div>
            </div>
          </div>

          {/* 6. CATEGORY, TAGS & REFERENCE LINK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Primary News Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PostCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs font-semibold"
              >
                <option value="breaking">Breaking News</option>
                <option value="local">Local / Regional</option>
                <option value="politics">Politics & Policy</option>
                <option value="tech">Tech & AI</option>
                <option value="science">Science & Space</option>
                <option value="business">Markets & Business</option>
                <option value="weather_disaster">Weather & Disaster</option>
                <option value="culture">World Culture</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Hashtags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5" /> External Source / Official Verification URL (Optional)
            </label>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/10 bg-slate-950/80">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 transition-colors"
          >
            Save to Drafts
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-950 shadow-lg transition-transform active:scale-95"
              style={{ backgroundColor: primaryColor }}
            >
              Publish Live Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

