import React, { useState } from 'react';
import {
  CheckCircle2,
  Globe,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Radio,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { NewsPost, User } from '../types';

interface LoginViewProps {
  users: User[];
  currentUser: User;
  posts: NewsPost[];
  primaryColor: string;
  breakingColor: string;
  cardBgColor: string;
  onSelectUser: (user: User) => void;
  onCreateUser: (newUser: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  currentUser,
  posts,
  primaryColor,
  breakingColor,
  cardBgColor,
  onSelectUser,
  onCreateUser,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('London, UK');
  const [accountType, setAccountType] = useState<'verified_citizen' | 'journalist'>('verified_citizen');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !username.trim()) return;
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: username.trim().toLowerCase().replace(/\s+/g, '_'),
      displayName: displayName.trim(),
      email: email.trim() || `${username}@pulsenews.org`,
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bio: 'Citizen Reporter & Eyewitness Contributor on Pulse News Network.',
      location,
      role: 'user',
      status: 'active',
      verificationTier: accountType,
      trustScore: 0.88,
      joinedAt: new Date().toISOString().slice(0, 10),
      followersCount: 1,
      reportsCount: 0,
    };
    onCreateUser(newUser);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[78vh]">
      {/* LEFT PANEL: AUTHENTICATION & 1-CLICK PERSONA SWITCHER */}
      <div
        style={{ backgroundColor: cardBgColor }}
        className="lg:col-span-5 p-6 sm:p-8 rounded-3xl border border-slate-500/20 flex flex-col justify-between shadow-xl"
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-400">
              <KeyRound className="w-3.5 h-3.5" /> Identity & Credentials Portal
            </div>
            <div className="flex rounded-xl bg-slate-500/10 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  mode === 'signin' ? 'bg-sky-500 text-slate-950' : 'opacity-70'
                }`}
              >
                Switch Role
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  mode === 'register' ? 'bg-sky-500 text-slate-950' : 'opacity-70'
                }`}
              >
                New Reporter
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {mode === 'signin'
                ? 'Choose Your Active Newsroom Role'
                : 'Register Citizen Reporter Pass'}
            </h1>
            <p className="text-xs sm:text-sm opacity-75 mt-1">
              {mode === 'signin'
                ? 'Switch instantly between Super-Admin God Mode, Verified Field Journalist, or Citizen Eyewitness to test all permissions.'
                : 'Create a cryptographic C2PA reporter profile to publish eyewitness videos and vote on Community Notes.'}
            </p>
          </div>

          {mode === 'signin' ? (
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider opacity-65">
                Instant 1-Click Account Switcher
              </div>
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => onSelectUser(u)}
                    className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'border-sky-400 bg-sky-500/15 shadow-md'
                        : 'border-slate-500/20 bg-slate-500/5 hover:bg-slate-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={u.avatarUrl}
                        alt={u.displayName}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-sky-400/40"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm truncate">{u.displayName}</span>
                          {u.role === 'admin' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
                              GOD-MODE ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-xs opacity-70 truncate">
                          @{u.username} • {u.location} • Trust: {Math.round(u.trustScore * 100)}%
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-500/20 hover:bg-slate-500/30'
                      }`}
                    >
                      {isCurrent ? 'Active' : 'Use Role'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">Full Display Name *</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., David Okafor"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/10 border border-slate-500/25"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold mb-1">Handle (@username) *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="david_press"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/10 border border-slate-500/25"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Primary City / Bureau</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/10 border border-slate-500/25"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@newsroom.org"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/10 border border-slate-500/25"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Select Initial Verification Track</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('verified_citizen')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      accountType === 'verified_citizen'
                        ? 'border-sky-400 bg-sky-500/15'
                        : 'border-slate-500/20'
                    }`}
                  >
                    <div className="font-bold">Citizen Eyewitness</div>
                    <div className="text-[11px] opacity-70 mt-0.5">
                      Post on-the-scene videos & GPS reports
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('journalist')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      accountType === 'journalist'
                        ? 'border-sky-400 bg-sky-500/15'
                        : 'border-slate-500/20'
                    }`}
                  >
                    <div className="font-bold">Field Journalist</div>
                    <div className="text-[11px] opacity-70 mt-0.5">
                      Publish investigative stories & notes
                    </div>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-extrabold text-slate-950 shadow-lg flex items-center justify-center gap-2 mt-2"
                style={{ backgroundColor: primaryColor }}
              >
                <UserPlus className="w-4 h-4" /> Create Verified Account & Enter Feed
              </button>
            </form>
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-slate-500/15 flex items-center justify-between text-xs opacity-75">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> Hardware Passkey & C2PA Protected
          </span>
          <span>React v19.3 Full-Stack Auth</span>
        </div>
      </div>

      {/* RIGHT PANEL: 3D TILTED LIVE NEWS MARQUEE GALLERY (Inspired by react.dev Community Showcase) */}
      <div className="lg:col-span-7 relative rounded-3xl overflow-hidden border border-slate-500/25 bg-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between min-h-[500px]">
        {/* Background Radial Glow */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: primaryColor }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-25"
          style={{ backgroundColor: breakingColor }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold">
            <Globe className="w-3.5 h-3.5 text-sky-400" /> 3D Live Newsroom Showcase
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> 99.4% C2PA Verified Stream
          </span>
        </div>

        {/* 3D Perspective Tilted Card Grid */}
        <div
          className="relative z-10 my-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
          style={{
            transform: 'perspective(1100px) rotateX(10deg) rotateY(-9deg) rotateZ(2deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {posts.slice(0, 4).map((post, idx) => (
            <div
              key={post.id}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-md transition-transform duration-500 hover:scale-105"
              style={{
                transform: `translateZ(${(idx % 2 === 0 ? 24 : 10)}px)`,
              }}
            >
              <div className="relative h-32 rounded-xl overflow-hidden mb-2.5">
                <img
                  src={post.media[0]?.thumbnailUrl || post.media[0]?.url}
                  alt={post.headline}
                  className="w-full h-full object-cover"
                />
                <span
                  className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white flex items-center gap-1"
                  style={{ backgroundColor: post.isEyewitness ? breakingColor : primaryColor }}
                >
                  <Radio className="w-2.5 h-2.5" />
                  {post.isEyewitness ? 'EYEWITNESS' : post.category.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] text-sky-400 font-semibold truncate flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{post.locationName}</span>
              </div>
              <h3 className="text-xs font-bold line-clamp-2 mt-0.5">{post.headline}</h3>
            </div>
          ))}
        </div>

        <div className="relative z-10 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-sky-400 shrink-0" />
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider">
                Truth-Weighted Citizen Journalism
              </div>
              <p className="text-xs text-slate-300">
                Every eyewitness video and Community Note is ranked by verified accuracy, not clickbait.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Active Session: @{currentUser.username}
          </div>
        </div>
      </div>
    </div>
  );
};

