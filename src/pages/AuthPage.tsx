import React, { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Camera,
  Check,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Upload,
  User as UserIcon,
  UserPlus,
} from 'lucide-react';
import { User } from '../types';
import {
  checkLoginRateLimit,
  checkPasswordStrength,
  inspectWAFPayload,
  recordLoginFailure,
  recordLoginSuccess,
} from '../utils/security';
import { api } from '../services/api';

interface AuthPageProps {
  users: User[];
  currentUser?: User | null;
  primaryColor: string;
  cardBgColor: string;
  isDark: boolean;
  onSelectUser: (user: User) => void;
  onCreateUser: (newUser: User) => void;
  onSignOut?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  users,
  currentUser,
  primaryColor,
  cardBgColor,
  isDark,
  onSelectUser,
  onCreateUser,
  onSignOut,
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
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const regAvatarInputRef = useRef<HTMLInputElement>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) return;
    setForgotLoading(true);
    try {
      const res = await api.forgotPassword(forgotIdentifier);
      setForgotMessage(res.message);
    } catch (err: any) {
      setForgotMessage(err.message || 'Unable to process reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const search = loginEmail.trim().toLowerCase();
    const cleanHandle = search.replace(/^@/, '');

    // 0. WAF & L7 Intrusion Inspection
    const wafCheck = inspectWAFPayload(`${loginEmail} ${loginPassword}`);
    if (wafCheck.isBlocked) {
      setLoginError(wafCheck.reason || 'Blocked by Web Application Firewall (WAF)');
      return;
    }

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

    try {
      const res = await api.login(search, loginPassword);
      recordLoginSuccess(search);
      setLoginError(null);
      onSelectUser(res.user);
      navigate(
        res.user.role === 'admin' || res.user.role === 'super_admin'
          ? '/admin'
          : res.user.verificationTier === 'journalist' || res.user.role === 'editor'
          ? '/studio'
          : '/dashboard'
      );
    } catch (err: any) {
      // Fallback to local user lookup if API server is not reached yet
      const matched = users.find(
        (u) =>
          u.email.toLowerCase() === search ||
          u.username.toLowerCase() === cleanHandle
      );

      if (matched && matched.password && matched.password === loginPassword) {
        recordLoginSuccess(search);
        setLoginError(null);
        onSelectUser(matched);
        navigate(
          matched.role === 'admin' || matched.role === 'super_admin'
            ? '/admin'
            : matched.verificationTier === 'journalist' || matched.role === 'editor'
            ? '/studio'
            : '/dashboard'
        );
        return;
      }

      const failStatus = recordLoginFailure(search);
      setLoginError(
        failStatus.locked
          ? `Too many failed attempts. Login locked for ${failStatus.retryAfterSeconds}s.`
          : err.message || 'Invalid username/email or password.'
      );
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
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

    // 0. WAF & L7 Intrusion Inspection
    const wafCheck = inspectWAFPayload(`${name} ${cleanHandle} ${cleanEmail} ${bureau}`);
    if (wafCheck.isBlocked) {
      setRegisterError(wafCheck.reason || 'Blocked by Web Application Firewall (WAF)');
      return;
    }

    // 1. Strict 8+ Character Password with Figures & Specials Policy
    const strength = checkPasswordStrength(password);
    if (!strength.passed) {
      setRegisterError(
        'Password does not meet required security standards: At least 8 characters, with uppercase, lowercase, numbers/figures, and special characters (!@#$%^&*) required.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setRegisterError('Passwords do not match. Please re-enter your password.');
      return;
    }

    const isCreator = accountRole === 'creator';
    const effectiveAvatar =
      avatarPreview.trim() ||
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="100%" height="100%" fill="%230284c7"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="52" font-weight="700">${encodeURIComponent((name[0] || 'U').toUpperCase())}</text></svg>`;

    try {
      const res = await api.register({
        displayName: name,
        username: cleanHandle,
        email: cleanEmail,
        password: password,
        role: isCreator ? 'journalist' : 'reader',
        avatarUrl: effectiveAvatar,
        location: bureau.trim() || 'London, UK',
      });
      onCreateUser(res.user);
      navigate(isCreator ? '/studio' : '/dashboard');
    } catch (err: any) {
      // Local fallback
      const newUser: User = {
        id: `user-${Date.now()}`,
        username: cleanHandle,
        displayName: name,
        email: cleanEmail,
        password: password,
        avatarUrl: effectiveAvatar,
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
      navigate(isCreator ? '/studio' : '/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-12">
      {/* LEFT AUTHENTICATION FORM COLUMN */}
      <div className="lg:col-span-6 flex flex-col justify-start space-y-6 p-6 sm:p-12 lg:p-16">
        <div className="flex items-center justify-end">
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

        <div className="max-w-md w-full mx-auto my-auto py-6 space-y-6">
          {currentUser && currentUser.id !== 'guest' && currentUser.status === 'active' && (
            <div className={`p-5 rounded-2xl border text-center space-y-3.5 shadow-lg ${
              isDark ? 'border-sky-500/30 bg-sky-500/10 text-slate-100' : 'border-sky-200 bg-sky-50 text-slate-900'
            }`}>
              <div className="flex items-center justify-center gap-3">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-sky-400"
                />
                <div className="text-left min-w-0">
                  <div className="font-bold text-sm truncate">{currentUser.displayName}</div>
                  <div className="text-xs opacity-75 truncate">@{currentUser.username} • {currentUser.email}</div>
                </div>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">
                You are currently signed in. To change user, please sign out first.
              </p>
              <div className="flex items-center justify-center gap-2.5 pt-1">
                <Link
                  to={currentUser.role === 'admin' || currentUser.role === 'super_admin' ? '/admin' : '/dashboard'}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  Go to Dashboard
                </Link>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-colors"
                  >
                    Sign Out Completely
                  </button>
                )}
              </div>
            </div>
          )}

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
                  <label className="block font-medium opacity-80 mb-1.5">
                    Email or Username (@handle)
                  </label>
                  <div className="relative group">
                    <Mail
                      className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-colors ${
                        isDark ? 'text-slate-300 group-focus-within:text-sky-400' : 'text-slate-500 group-focus-within:text-sky-600'
                      }`}
                    />
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="Enter your email or @username"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                        isDark
                          ? 'bg-slate-900 text-white border border-slate-700 focus:border-sky-400 placeholder:text-slate-400'
                          : 'bg-white text-slate-900 border border-slate-300 focus:border-sky-500 placeholder:text-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-medium opacity-80">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(true);
                        setForgotIdentifier(loginEmail.trim());
                        setForgotMessage(null);
                      }}
                      className="text-[11px] opacity-75 hover:opacity-100 hover:underline transition-opacity"
                      style={{ color: primaryColor }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock
                      className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-colors ${
                        isDark ? 'text-slate-300 group-focus-within:text-sky-400' : 'text-slate-500 group-focus-within:text-sky-600'
                      }`}
                    />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="Enter your password"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                        isDark
                          ? 'bg-slate-900 text-white border border-slate-700 focus:border-sky-400 placeholder:text-slate-400'
                          : 'bg-white text-slate-900 border border-slate-300 focus:border-sky-500 placeholder:text-slate-400 shadow-sm'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 z-10 p-1 rounded-md transition-colors ${
                        isDark ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-black/5'
                      }`}
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
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile preview"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-sky-400/40"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm select-none border ${
                        isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {displayName.trim() ? displayName.trim().charAt(0).toUpperCase() : <UserIcon className="w-5 h-5 opacity-60" />}
                    </div>
                  )}
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
                <label className="block font-medium opacity-80 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setRegisterError(null);
                  }}
                  placeholder="e.g. Julian Vance"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                    isDark
                      ? 'bg-slate-900/90 text-white border border-slate-700/80 focus:border-sky-400 placeholder:text-slate-500'
                      : 'bg-white text-slate-900 border border-slate-300 focus:border-sky-500 placeholder:text-slate-400 shadow-sm'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium opacity-80 mb-1.5">
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
                    className={`w-full px-4 py-2.5 rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                      isDark
                        ? 'bg-slate-900/90 text-white border border-slate-700/80 focus:border-sky-400 placeholder:text-slate-500'
                        : 'bg-white text-slate-900 border border-slate-300 focus:border-sky-500 placeholder:text-slate-400 shadow-sm'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-medium opacity-80 mb-1.5">City / Location</label>
                  <input
                    type="text"
                    value={bureau}
                    onChange={(e) => setBureau(e.target.value)}
                    placeholder="e.g. London, UK"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                      isDark
                        ? 'bg-slate-900/90 text-white border border-slate-700/80 focus:border-sky-400 placeholder:text-slate-500'
                        : 'bg-white text-slate-900 border border-slate-300 focus:border-sky-500 placeholder:text-slate-400 shadow-sm'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium opacity-80 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setRegisterError(null);
                  }}
                  placeholder="name@domain.com"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                    isDark
                      ? 'bg-slate-900/90 text-white border border-slate-700/80 focus:border-sky-400 placeholder:text-slate-500'
                      : 'bg-white text-slate-900 border border-slate-300 focus:border-sky-500 placeholder:text-slate-400 shadow-sm'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium opacity-80 mb-1.5">Password *</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setRegisterError(null);
                      }}
                      placeholder="At least 8 characters (mixed case, number, special)"
                      className={`w-full pl-3 pr-9 py-2.5 rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                        isDark
                          ? 'bg-slate-900 text-white border border-slate-700 focus:border-sky-400 placeholder:text-slate-400'
                          : 'bg-white text-slate-900 border border-slate-300 focus:border-sky-500 placeholder:text-slate-400 shadow-sm'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((prev) => !prev)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1 rounded-md transition-colors ${
                        isDark ? 'text-slate-200 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-black/5'
                      }`}
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="opacity-60">Security Level:</span>
                        <span
                          className="font-bold"
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
                          {checkPasswordStrength(password).passed && ' (Enterprise Compliant)'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-500/20 rounded-full overflow-hidden">
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

                      {/* Live Security Criteria Checklist */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono">
                        <span
                          className={`flex items-center gap-1 ${
                            checkPasswordStrength(password).criteria.minLength
                              ? 'text-emerald-400 font-semibold'
                              : 'opacity-50'
                          }`}
                        >
                          {checkPasswordStrength(password).criteria.minLength ? '✓' : '○'} 8+ characters
                        </span>
                        <span
                          className={`flex items-center gap-1 ${
                            checkPasswordStrength(password).criteria.hasUppercase &&
                            checkPasswordStrength(password).criteria.hasLowercase
                              ? 'text-emerald-400 font-semibold'
                              : 'opacity-50'
                          }`}
                        >
                          {checkPasswordStrength(password).criteria.hasUppercase &&
                          checkPasswordStrength(password).criteria.hasLowercase
                            ? '✓'
                            : '○'}{' '}
                          Upper &amp; lower case
                        </span>
                        <span
                          className={`flex items-center gap-1 ${
                            checkPasswordStrength(password).criteria.hasNumber
                              ? 'text-emerald-400 font-semibold'
                              : 'opacity-50'
                          }`}
                        >
                          {checkPasswordStrength(password).criteria.hasNumber ? '✓' : '○'} Number / figure
                        </span>
                        <span
                          className={`flex items-center gap-1 ${
                            checkPasswordStrength(password).criteria.hasSpecial
                              ? 'text-emerald-400 font-semibold'
                              : 'opacity-50'
                          }`}
                        >
                          {checkPasswordStrength(password).criteria.hasSpecial ? '✓' : '○'} Special char (!@#$)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-medium opacity-80 mb-1.5">Confirm Password *</label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setRegisterError(null);
                    }}
                    placeholder="Repeat password"
                    className={`w-full px-3 py-2.5 rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                      isDark
                        ? 'bg-slate-900/90 text-white border border-slate-700/80 focus:border-sky-400 placeholder:text-slate-500'
                        : 'bg-white text-slate-900 border border-slate-300 focus:border-sky-500 placeholder:text-slate-400 shadow-sm'
                    }`}
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

        <div className="flex items-center justify-center text-xs pt-4 border-t border-slate-500/15">
          <span className="opacity-50">Pulse News Network • Editorial Standards &amp; Privacy Architecture</span>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-lg font-bold">Password Recovery</h3>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotMessage(null);
                }}
                className="text-xs opacity-60 hover:opacity-100"
              >
                Close
              </button>
            </div>

            <p className="text-xs opacity-75 leading-relaxed">
              Enter your email address or @username. If an account is found, a secure single-use reset instruction will be dispatched.
            </p>

            <form onSubmit={handleForgotSubmit} className="space-y-3 pt-1">
              <input
                type="text"
                required
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
                placeholder="Enter email or username"
                className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />

              {forgotMessage && (
                <div className="p-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs">
                  {forgotMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotMessage(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-500/20 hover:bg-slate-500/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  {forgotLoading ? 'Processing...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
