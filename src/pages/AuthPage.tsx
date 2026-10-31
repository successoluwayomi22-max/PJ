import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Lock,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { User } from '../types';

interface AuthPageProps {
  users: User[];
  currentUser: User;
  primaryColor: string;
  secondaryAiColor: string;
  cardBgColor: string;
  isDark: boolean;
  onSelectUser: (user: User) => void;
  onCreateUser: (newUser: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  users,
  currentUser,
  primaryColor,
  cardBgColor,
  isDark,
  onSelectUser,
  onCreateUser,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isRegister = location.pathname === '/register';

  // Login credentials state
  const [loginEmail, setLoginEmail] = useState(currentUser.email);
  const [loginPassword, setLoginPassword] = useState('••••••••••••');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bureau, setBureau] = useState('London, UK');
  const [tier, setTier] = useState<'verified_citizen' | 'journalist'>('journalist');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = users.find(
      (u) =>
        u.email.toLowerCase() === loginEmail.trim().toLowerCase() ||
        u.username.toLowerCase() === loginEmail.trim().toLowerCase().replace(/^@/, '')
    );
    if (matched) {
      onSelectUser(matched);
      navigate(matched.role === 'admin' ? '/admin' : '/');
    } else {
      setLoginError('Account not found. Try one of the verified accounts below or create a new account.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !username.trim()) return;
    const handle = username.trim().toLowerCase().replace(/\s+/g, '_').replace(/^@/, '');
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: handle,
      displayName: displayName.trim(),
      email: email.trim() || `${handle}@pulsenews.org`,
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bio: 'Verified Correspondent & Contributor on Pulse News.',
      location: bureau,
      role: 'user',
      status: 'active',
      verificationTier: tier,
      trustScore: 0.92,
      joinedAt: new Date().toISOString().slice(0, 10),
      followersCount: 1,
      reportsCount: 0,
    };
    onCreateUser(newUser);
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-12">
      {/* LEFT AUTHENTICATION FORM COLUMN */}
      <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium opacity-65 hover:opacity-100 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" /> Back to News Feed
          </Link>

          <div className="flex items-center gap-1.5 p-1 rounded-full border border-slate-500/15 bg-slate-500/[0.04] text-xs font-medium">
            <Link
              to="/login"
              className={`px-4 py-1.5 rounded-full transition-colors ${
                !isRegister
                  ? isDark
                    ? 'bg-white text-slate-950 font-semibold'
                    : 'bg-slate-900 text-white font-semibold'
                  : 'opacity-65 hover:opacity-100'
              }`}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className={`px-4 py-1.5 rounded-full transition-colors ${
                isRegister
                  ? isDark
                    ? 'bg-white text-slate-950 font-semibold'
                    : 'bg-slate-900 text-white font-semibold'
                  : 'opacity-65 hover:opacity-100'
              }`}
            >
              Create Account
            </Link>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto my-8 space-y-6">
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-xs sm:text-sm opacity-65 mt-2 leading-relaxed">
              {isRegister
                ? 'Join journalists, researchers, and readers sharing verified breaking news and eyewitness reporting.'
                : 'Sign in with your email or switch directly between Reader, Journalist, and Admin accounts.'}
            </p>
          </div>

          {!isRegister ? (
            <div className="space-y-6">
              {/* Standard Email + Password Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium opacity-75 mb-1.5">
                    Email or Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 opacity-45 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="elena@pulsenews.org or @elena_rostova"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-medium opacity-75">Password</label>
                    <span className="text-[11px] opacity-60">Encrypted Session</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 opacity-45 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-semibold text-sm text-slate-950 shadow-sm transition-opacity hover:opacity-95"
                  style={{ backgroundColor: primaryColor }}
                >
                  Sign In
                </button>
              </form>

              {/* Quick Switch Accounts */}
              <div className="space-y-2.5 pt-4 border-t border-slate-500/15">
                <div className="text-[11px] font-semibold uppercase tracking-wider opacity-55">
                  Instant Account Switcher (Journalist / Admin / Citizen)
                </div>
                <div className="space-y-2">
                  {users.map((u) => {
                    const active = u.id === currentUser.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          navigate(u.role === 'admin' ? '/admin' : '/');
                        }}
                        style={{ backgroundColor: cardBgColor }}
                        className={`cursor-pointer p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                          active
                            ? 'border-sky-400/70'
                            : 'border-slate-500/15 hover:border-slate-500/35'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={u.avatarUrl}
                            alt={u.displayName}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs truncate">
                                {u.displayName}
                              </span>
                              {u.role === 'admin' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400">
                                  Admin
                                </span>
                              )}
                              {u.verificationTier === 'journalist' && u.role !== 'admin' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-sky-500/15 text-sky-400">
                                  Journalist
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] opacity-60 truncate">
                              @{u.username} • {u.location}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400">
                              <Check className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium opacity-60 hover:opacity-100">
                              Switch <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium opacity-75 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Julian Vance"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium opacity-75 mb-1.5">
                    Username (@handle) *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="julian_vance"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block font-medium opacity-75 mb-1.5">City / Location</label>
                  <input
                    type="text"
                    value={bureau}
                    onChange={(e) => setBureau(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium opacity-75 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block font-medium opacity-75 mb-1.5">Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium opacity-75 mb-1.5">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTier('journalist')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      tier === 'journalist'
                        ? 'border-sky-400 bg-sky-500/10'
                        : 'border-slate-500/20 opacity-70'
                    }`}
                  >
                    <div className="font-semibold text-xs">Journalist / Creator</div>
                    <div className="text-[11px] opacity-65 mt-0.5">
                      Publish articles, videos & reports
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTier('verified_citizen')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      tier === 'verified_citizen'
                        ? 'border-sky-400 bg-sky-500/10'
                        : 'border-slate-500/20 opacity-70'
                    }`}
                  >
                    <div className="font-semibold text-xs">Reader & Contributor</div>
                    <div className="text-[11px] opacity-65 mt-0.5">
                      Follow topics, comment & share local news
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-semibold text-sm text-slate-950 flex items-center justify-center gap-2 shadow-sm transition-opacity hover:opacity-95"
                style={{ backgroundColor: primaryColor }}
              >
                <UserPlus className="w-4 h-4" /> Create Account
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-between text-xs opacity-50 pt-4 border-t border-slate-500/15">
          <span>Pulse News Network</span>
          <span>Privacy • Editorial Standards</span>
        </div>
      </div>

      {/* RIGHT EDITORIAL PHOTOJOURNALISM SHOWCASE */}
      <div className="lg:col-span-6 relative bg-slate-950 text-white overflow-hidden hidden lg:flex flex-col justify-between p-12 border-l border-white/10">
        <img
          src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1400&auto=format&fit=crop&q=85"
          alt="Editorial Newsroom"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />

        <div className="relative z-10 flex items-center justify-between text-xs font-medium text-slate-300">
          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md">
            Independent Global Reporting
          </span>
          <span className="text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Verified Sources & Community Notes
          </span>
        </div>

        <div className="relative z-10 max-w-lg space-y-4">
          <p className="font-editorial text-2xl sm:text-3xl text-white leading-snug font-medium">
            &ldquo;Real-time reporting from accredited correspondents and eyewitnesses around the world—curated for clarity, depth, and truth.&rdquo;
          </p>
          <div className="flex items-center gap-6 pt-2 text-xs text-slate-300">
            <div>
              <div className="font-bold text-white text-base">24/7</div>
              <div className="opacity-70">Live Breaking Wire</div>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <div className="font-bold text-white text-base">6 Languages</div>
              <div className="opacity-70">Instant Reader Translation</div>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <div className="font-bold text-white text-base">100%</div>
              <div className="opacity-70">Transparent Sourcing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
