import React, { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Check,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  Upload,
  User as UserIcon,
  UserPlus,
} from 'lucide-react';
import { User } from '../types';
import {
  checkLoginRateLimit,
  checkPasswordStrength,
  recordLoginFailure,
  recordLoginSuccess,
} from '../utils/security';

interface AuthPageProps {
  users: User[];
  currentUser: User;
  primaryColor: string;
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
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [bureau, setBureau] = useState('London, UK');
  const [accountRole, setAccountRole] = useState<'creator' | 'reader'>('reader');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  );
  const regAvatarInputRef = useRef<HTMLInputElement>(null);

  const handleRegAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const search = loginEmail.trim().toLowerCase();
    const cleanHandle = search.replace(/^@/, '');

    if (!search) {
      setLoginError('Please enter your email address or @username.');
      return;
    }

    // Rate Limiting & Brute-Force Check
    const rateStatus = checkLoginRateLimit(search);
    if (!rateStatus.allowed) {
      setLoginError(
        `Too many failed sign-in attempts. Account access is temporarily suspended for security. Please try again in ${rateStatus.retryAfterSeconds} seconds.`
      );
      return;
    }

    const matched = users.find(
      (u) =>
        u.email.toLowerCase() === search ||
        u.username.toLowerCase() === cleanHandle
    );

    if (!matched) {
      const failStatus = recordLoginFailure(search);
      setLoginError(
        failStatus.locked
          ? `Too many failed attempts. Login locked for ${failStatus.retryAfterSeconds}s.`
          : `No account found with identifier "${loginEmail.trim()}". (${failStatus.retryAfterSeconds === 0 ? 'Attempts remaining before lockout' : ''})`
      );
      return;
    }

    // Password validation: match user password if set, or accept password123 / password length >= 4
    const validPassword = matched.password
      ? loginPassword === matched.password
      : loginPassword === 'password123' || loginPassword.length >= 4;

    if (!validPassword) {
      const failStatus = recordLoginFailure(search);
      setLoginError(
        failStatus.locked
          ? `Too many incorrect attempts. Login locked for ${failStatus.retryAfterSeconds}s.`
          : 'Incorrect password. (Default password for demo accounts is: password123)'
      );
      return;
    }

    recordLoginSuccess(search);
    setLoginError(null);
    onSelectUser(matched);
    navigate(
      matched.role === 'admin'
        ? '/admin'
        : matched.verificationTier === 'journalist' || matched.role === 'moderator'
        ? '/studio'
        : '/'
    );
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    const name = displayName.trim();
    const cleanHandle = username.trim().toLowerCase().replace(/\s+/g, '_').replace(/^@/, '');
    const cleanEmail = email.trim().toLowerCase();

    if (!name) {
      setRegisterError('Please enter your full name.');
      return;
    }

    if (cleanHandle.length < 3) {
      setRegisterError('Username must be at least 3 characters long.');
      return;
    }

    // Ensure username is not already taken
    const existingByUsername = users.find(
      (u) => u.username.toLowerCase() === cleanHandle
    );
    if (existingByUsername) {
      setRegisterError(`The handle @${cleanHandle} is already registered. Please choose another username.`);
      return;
    }

    // Ensure email is not already registered
    const existingByEmail = users.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (existingByEmail) {
      setRegisterError(`An account with email ${cleanEmail} already exists. Please sign in instead.`);
      return;
    }

    if (password.length < 6) {
      setRegisterError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setRegisterError('Passwords do not match. Please re-enter your password.');
      return;
    }

    const isCreator = accountRole === 'creator';
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: cleanHandle,
      displayName: name,
      email: cleanEmail,
      password: password,
      avatarUrl: avatarPreview,
      bio: isCreator
        ? 'Accredited Journalist & Creator publishing verified field dispatches on Pulse News.'
        : 'Verified Reader & Community Contributor on Pulse News.',
      location: bureau.trim() || 'London, UK',
      role: isCreator ? 'moderator' : 'user',
      status: 'active',
      verificationTier: isCreator ? 'journalist' : 'verified_citizen',
      trustScore: isCreator ? 0.95 : 0.92,
      joinedAt: new Date().toISOString().slice(0, 10),
      followersCount: 0,
      reportsCount: 0,
    };

    onCreateUser(newUser);
    navigate(isCreator ? '/studio' : '/');
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
                ? 'Join accredited correspondents and readers sharing verified breaking news and eyewitness reporting.'
                : 'Sign in with your email or username to access your feed, bookmarks, and dispatches.'}
            </p>
          </div>

          {!isRegister ? (
            <div className="space-y-6">
              {/* Standard Email + Password Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium opacity-75 mb-1.5">
                    Email or Username (@handle)
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
                      placeholder="e.g. kenji_takahashi or kenji@pulsenews.global"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-medium opacity-75">Password</label>
                    <span className="text-[11px] opacity-60">Default: password123</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 opacity-45 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                      title={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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

              {/* Discreet Credential Test Fillers (Safely populates input fields) */}
              <div className="pt-4 border-t border-slate-500/15 space-y-2">
                <div className="flex items-center justify-between text-[11px] opacity-60">
                  <span>Demo Test Credentials</span>
                  <span>Click to populate form</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('kenji_takahashi');
                      setLoginPassword('password123');
                      setLoginError(null);
                    }}
                    className="p-2 rounded-xl border border-slate-500/15 hover:border-slate-500/35 bg-slate-500/[0.03] text-left transition-colors"
                  >
                    <div className="font-semibold text-[11px] text-sky-400 truncate">Kenji T.</div>
                    <div className="text-[10px] opacity-55 truncate">Journalist</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('amina_eyewitness');
                      setLoginPassword('password123');
                      setLoginError(null);
                    }}
                    className="p-2 rounded-xl border border-slate-500/15 hover:border-slate-500/35 bg-slate-500/[0.03] text-left transition-colors"
                  >
                    <div className="font-semibold text-[11px] text-emerald-400 truncate">Amina O.</div>
                    <div className="text-[10px] opacity-55 truncate">Reader</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('commander_chief');
                      setLoginPassword('password123');
                      setLoginError(null);
                    }}
                    className="p-2 rounded-xl border border-slate-500/15 hover:border-slate-500/35 bg-slate-500/[0.03] text-left transition-colors"
                  >
                    <div className="font-semibold text-[11px] text-amber-400 truncate">Elena V.</div>
                    <div className="text-[10px] opacity-55 truncate">Admin</div>
                  </button>
                </div>
              </div>

              <div className="text-center text-xs opacity-65">
                Don&apos;t have an account yet?{' '}
                <Link to="/register" className="font-semibold hover:underline" style={{ color: primaryColor }}>
                  Create an account
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              {/* Profile Picture Upload for New Account */}
              <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-500/20 bg-slate-500/[0.04]">
                <input
                  ref={regAvatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleRegAvatarChange}
                  className="hidden"
                />
                <div
                  onClick={() => regAvatarInputRef.current?.click()}
                  className="relative group cursor-pointer shrink-0"
                  title="Upload profile picture"
                >
                  <img
                    src={avatarPreview}
                    alt="Profile preview"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-sky-400/40"
                  />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-slate-950 shadow"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Camera className="w-3 h-3" />
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-xs">Profile Photo</div>
                  <div className="text-[11px] opacity-60">
                    Upload a custom picture or avatar
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => regAvatarInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-slate-500/25 hover:bg-slate-500/10 font-medium inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
              </div>

              <div>
                <label className="block font-medium opacity-75 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setRegisterError(null);
                  }}
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
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setRegisterError(null);
                    }}
                    placeholder="e.g. julian_vance"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block font-medium opacity-75 mb-1.5">City / Location</label>
                  <input
                    type="text"
                    value={bureau}
                    onChange={(e) => setBureau(e.target.value)}
                    placeholder="e.g. London, UK"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium opacity-75 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setRegisterError(null);
                  }}
                  placeholder="name@domain.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium opacity-75 mb-1.5">Password *</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setRegisterError(null);
                      }}
                      placeholder="At least 6 characters"
                      className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="opacity-60">Strength:</span>
                        <span
                          className="font-semibold"
                          style={{
                            color:
                              checkPasswordStrength(password).score <= 1
                                ? '#f43f5e'
                                : checkPasswordStrength(password).score === 2
                                ? '#f59e0b'
                                : checkPasswordStrength(password).score === 3
                                ? '#38bdf8'
                                : '#10b981',
                          }}
                        >
                          {checkPasswordStrength(password).label}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-slate-500/20 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${Math.max(15, (checkPasswordStrength(password).score / 4) * 100)}%`,
                            backgroundColor:
                              checkPasswordStrength(password).score <= 1
                                ? '#f43f5e'
                                : checkPasswordStrength(password).score === 2
                                ? '#f59e0b'
                                : checkPasswordStrength(password).score === 3
                                ? '#38bdf8'
                                : '#10b981',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-medium opacity-75 mb-1.5">Confirm Password *</label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setRegisterError(null);
                    }}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-sm focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              {/* Account Type Selection (Only Reader or Journalist - No Admin) */}
              <div>
                <label className="block font-medium opacity-75 mb-1.5">
                  Account Type & Privileges
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAccountRole('reader')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      accountRole === 'reader'
                        ? 'border-sky-400 bg-sky-500/15 ring-1 ring-sky-400/40'
                        : 'border-slate-500/20 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs">Reader & Contributor</span>
                      {accountRole === 'reader' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <div className="text-[11px] opacity-65 mt-1 leading-snug">
                      Follow newsrooms, bookmark articles, join comment discussions & verify eyewitness context
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountRole('creator')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      accountRole === 'creator'
                        ? 'border-sky-400 bg-sky-500/15 ring-1 ring-sky-400/40'
                        : 'border-slate-500/20 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs">Journalist / Creator</span>
                      {accountRole === 'creator' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <div className="text-[11px] opacity-65 mt-1 leading-snug">
                      Publish breaking dispatches, attach C2PA telemetry & access Creator Studio
                    </div>
                  </button>
                </div>
              </div>

              {registerError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs">
                  {registerError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-semibold text-sm text-slate-950 flex items-center justify-center gap-2 shadow-sm transition-opacity hover:opacity-95"
                style={{ backgroundColor: primaryColor }}
              >
                <UserPlus className="w-4 h-4" /> Create Account
              </button>

              <div className="text-center text-xs opacity-65 pt-1">
                Already registered?{' '}
                <Link to="/login" className="font-semibold hover:underline" style={{ color: primaryColor }}>
                  Sign in here
                </Link>
              </div>
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
