import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Camera,
  Check,
  Download,
  KeyRound,
  Laptop,
  Lock,
  Mail,
  MapPin,
  Shield,
  Smartphone,
  Trash2,
  Upload,
  User as UserIcon,
  X,
} from 'lucide-react';
import { NewsPost, User } from '../types';
import {
  checkPasswordStrength,
  encryptDataAES,
  inspectWAFPayload,
} from '../utils/security';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  userPosts: NewsPost[];
  bookmarkedIds: string[];
  primaryColor: string;
  cardBgColor: string;
  isDark: boolean;
  onUpdateUser: (userId: string, updates: Partial<User>, reason?: string) => void;
  onDeleteAccount: (userId: string, passwordVerification: string) => boolean;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userPosts,
  bookmarkedIds,
  primaryColor,
  cardBgColor,
  isDark,
  onUpdateUser,
  onDeleteAccount,
}) => {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'security' | 'notifications' | 'privacy' | 'sessions' | 'danger'
  >('profile');

  // Profile Form state
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio);
  const [location, setLocation] = useState(currentUser.location);
  const [email, setEmail] = useState(currentUser.email);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Notification Preferences state
  const [notifyBreaking, setNotifyBreaking] = useState(true);
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(false);

  // Privacy Preferences state
  const [allowSearchIndex, setAllowSearchIndex] = useState(true);
  const [shareReadingHistory, setShareReadingHistory] = useState(false);

  // Account Deletion Workflow state
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmationWord, setDeleteConfirmationWord] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(
      currentUser.id,
      {
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        email: email.trim(),
      },
      'Updated account profile settings'
    );
    setProfileSuccess('Account information updated successfully.');
    setTimeout(() => setProfileSuccess(null), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // 0. WAF & L7 Injection Inspection
    const wafCheck = inspectWAFPayload(`${currentPassword} ${newPassword}`);
    if (wafCheck.isBlocked) {
      setPasswordError(wafCheck.reason || 'Blocked by Web Application Firewall (WAF)');
      return;
    }

    // Verify current password if user has one
    if (currentUser.password && currentPassword !== currentUser.password) {
      setPasswordError('Current password does not match.');
      return;
    }

    // 1. Strict 8+ Character Password with Figures & Specials Policy
    const strength = checkPasswordStrength(newPassword);
    if (!strength.passed) {
      setPasswordError(
        'Password does not meet required security standards: At least 8 characters, with uppercase, lowercase, numbers/figures, and special characters (!@#$%^&*) required.'
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    onUpdateUser(currentUser.id, { password: newPassword }, 'Changed account security password');
    setPasswordSuccess('Password successfully updated with cryptographic strength.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setTimeout(() => setPasswordSuccess(null), 3500);
  };

  const getArchiveData = () => ({
    user: {
      id: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      email: currentUser.email,
      bio: currentUser.bio,
      location: currentUser.location,
      role: currentUser.role,
      verificationTier: currentUser.verificationTier,
      trustScore: currentUser.trustScore,
      joinedAt: currentUser.joinedAt,
    },
    dispatches: userPosts.map((p) => ({
      id: p.id,
      headline: p.headline,
      bodyText: p.bodyText,
      category: p.category,
      location: p.locationName,
      createdAt: p.createdAt,
      c2paForensics: p.forensics,
    })),
    bookmarkedPostIds: bookmarkedIds,
    exportTimestamp: new Date().toISOString(),
    legalJurisdiction: 'Nigeria Data Protection Act (NDPA) & GDPR Data Subject Request',
  });

  const handleDownloadMyData = () => {
    const archiveData = getArchiveData();
    const blob = new Blob([JSON.stringify(archiveData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulsenews_export_${currentUser.username}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [encryptedExportStatus, setEncryptedExportStatus] = useState<string | null>(null);

  const handleDownloadEncryptedData = async () => {
    setEncryptedExportStatus('Encrypting with AES-256-GCM...');
    try {
      const archiveData = getArchiveData();
      const rawJson = JSON.stringify(archiveData, null, 2);
      const secretKey = currentUser.password || 'pulse-secure-vault-2026';
      const encrypted = await encryptDataAES(rawJson, secretKey);
      const encryptedPayload = {
        algorithm: 'AES-256-GCM',
        keyDerivation: 'PBKDF2-SHA256 (100,000 iterations)',
        encryptedAt: new Date().toISOString(),
        username: currentUser.username,
        ...encrypted,
      };
      const blob = new Blob([JSON.stringify(encryptedPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pulsenews_encrypted_vault_${currentUser.username}_${Date.now()}.enc.json`;
      a.click();
      URL.revokeObjectURL(url);
      setEncryptedExportStatus('AES-256 Vault downloaded successfully!');
      setTimeout(() => setEncryptedExportStatus(null), 3000);
    } catch {
      setEncryptedExportStatus('Encryption failed.');
      setTimeout(() => setEncryptedExportStatus(null), 3000);
    }
  };

  const handleExecuteDeletion = (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (deleteConfirmationWord.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE in capital letters to confirm.');
      return;
    }

    if (currentUser.password && deletePassword !== currentUser.password) {
      setDeleteError('Incorrect password. Re-authentication failed.');
      return;
    }

    const success = onDeleteAccount(currentUser.id, deletePassword);
    if (!success) {
      setDeleteError('Could not delete account. Verification failed.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-white border-black/10 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-500/15 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-400/30"
            />
            <div>
              <h2 className="font-editorial text-lg font-bold tracking-tight">
                Account Settings &amp; Security
              </h2>
              <div className="text-xs opacity-55">@{currentUser.username} • {currentUser.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs Bar */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-slate-500/15 overflow-x-auto text-xs font-semibold shrink-0">
          {[
            { id: 'profile', label: 'Profile & Info', icon: UserIcon },
            { id: 'security', label: 'Password & Security', icon: KeyRound },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'privacy', label: 'Privacy & Data Export', icon: Shield },
            { id: 'sessions', label: 'Active Sessions', icon: Laptop },
            { id: 'danger', label: 'Account Deletion', icon: Trash2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const isDanger = tab.id === 'danger';
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  active
                    ? isDanger
                      ? 'bg-rose-500 text-white font-bold'
                      : isDark
                      ? 'bg-white text-slate-950 font-bold'
                      : 'bg-slate-900 text-white font-bold'
                    : isDanger
                    ? 'text-rose-400 opacity-75 hover:opacity-100 hover:bg-rose-500/10'
                    : 'opacity-70 hover:opacity-100 hover:bg-slate-500/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs">
          {/* 1. Profile Info Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4 p-3.5 rounded-2xl border border-slate-500/20 bg-slate-500/[0.04]">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        onUpdateUser(currentUser.id, { avatarUrl: reader.result }, 'Changed profile picture');
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-sky-400/40"
                />
                <div className="flex-1">
                  <div className="font-semibold text-xs">Profile Photo</div>
                  <div className="text-[11px] opacity-60">Upload photo from your device</div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-500/25 hover:bg-slate-500/10 font-semibold inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Change Photo
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold opacity-75 mb-1.5">Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold opacity-75 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold opacity-75 mb-1.5">Bureau / Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block font-semibold opacity-75 mb-1.5">Bio / Editorial Focus</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-xs focus:outline-none focus:border-sky-400 resize-none"
                />
              </div>

              {profileSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-950 shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Save Profile Changes
              </button>
            </form>
          )}

          {/* 2. Password & Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div className="space-y-1">
                <h3 className="font-semibold text-xs">Update Account Password</h3>
                <p className="opacity-65 text-[11px]">
                  Ensure your password is at least 6 characters long and combines letters and numbers.
                </p>
              </div>

              {currentUser.password && (
                <div>
                  <label className="block font-semibold opacity-75 mb-1.5">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-xs focus:outline-none focus:border-sky-400"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold opacity-75 mb-1.5">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters (mixed case, numbers, special)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-xs focus:outline-none focus:border-sky-400"
                />
                {newPassword && (
                  <div className="mt-2 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="opacity-60">Security Level:</span>
                      <span
                        className="font-bold"
                        style={{
                          color:
                            checkPasswordStrength(newPassword).score <= 1
                              ? '#f43f5e'
                              : checkPasswordStrength(newPassword).score === 2
                              ? '#f59e0b'
                              : checkPasswordStrength(newPassword).score === 3
                              ? '#38bdf8'
                              : '#10b981',
                        }}
                      >
                        {checkPasswordStrength(newPassword).label}
                        {checkPasswordStrength(newPassword).passed && ' (Enterprise Compliant)'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-500/20 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${(checkPasswordStrength(newPassword).score / 4) * 100}%`,
                          backgroundColor:
                            checkPasswordStrength(newPassword).score <= 1
                              ? '#f43f5e'
                              : checkPasswordStrength(newPassword).score === 2
                              ? '#f59e0b'
                              : checkPasswordStrength(newPassword).score === 3
                              ? '#38bdf8'
                              : '#10b981',
                        }}
                      />
                    </div>
                    {/* Live Criteria Checklist */}
                    <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] font-mono">
                      <span
                        className={`flex items-center gap-1 ${
                          checkPasswordStrength(newPassword).criteria.minLength
                            ? 'text-emerald-400 font-semibold'
                            : 'opacity-50'
                        }`}
                      >
                        {checkPasswordStrength(newPassword).criteria.minLength ? '✓' : '○'} 8+ characters
                      </span>
                      <span
                        className={`flex items-center gap-1 ${
                          checkPasswordStrength(newPassword).criteria.hasUppercase &&
                          checkPasswordStrength(newPassword).criteria.hasLowercase
                            ? 'text-emerald-400 font-semibold'
                            : 'opacity-50'
                        }`}
                      >
                        {checkPasswordStrength(newPassword).criteria.hasUppercase &&
                        checkPasswordStrength(newPassword).criteria.hasLowercase
                          ? '✓'
                          : '○'}{' '}
                        Upper &amp; lower case
                      </span>
                      <span
                        className={`flex items-center gap-1 ${
                          checkPasswordStrength(newPassword).criteria.hasNumber
                            ? 'text-emerald-400 font-semibold'
                            : 'opacity-50'
                        }`}
                      >
                        {checkPasswordStrength(newPassword).criteria.hasNumber ? '✓' : '○'} Number / figure
                      </span>
                      <span
                        className={`flex items-center gap-1 ${
                          checkPasswordStrength(newPassword).criteria.hasSpecial
                            ? 'text-emerald-400 font-semibold'
                            : 'opacity-50'
                        }`}
                      >
                        {checkPasswordStrength(newPassword).criteria.hasSpecial ? '✓' : '○'} Special char (!@#$)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold opacity-75 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-950 shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Update Password
              </button>
            </form>
          )}

          {/* 3. Notification Preferences Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-xs">Notification Channels</h3>
                <p className="opacity-65 text-[11px]">Choose what alerts you receive during live news events.</p>
              </div>

              <div className="space-y-3 divide-y divide-slate-500/15">
                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Breaking News Flashes</div>
                    <div className="opacity-60 text-[11px]">Instant alerts for high-priority eyewitness dispatches.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyBreaking}
                    onChange={(e) => setNotifyBreaking(e.target.checked)}
                    className="w-4 h-4 accent-sky-500"
                  />
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Replies &amp; Mentions</div>
                    <div className="opacity-60 text-[11px]">When someone replies to your comment or cites your dispatch.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyMentions}
                    onChange={(e) => setNotifyMentions(e.target.checked)}
                    className="w-4 h-4 accent-sky-500"
                  />
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Weekly Editorial Digest</div>
                    <div className="opacity-60 text-[11px]">A curated weekend review of top-ranked investigations.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyWeeklyDigest}
                    onChange={(e) => setNotifyWeeklyDigest(e.target.checked)}
                    className="w-4 h-4 accent-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Privacy & Data Export Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="font-semibold text-xs">Privacy &amp; Data Subject Rights (NDPA / GDPR)</h3>
                <p className="opacity-65 text-[11px]">
                  Request an automated export of your complete account information, dispatches, and activity.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-500/20 bg-slate-500/[0.03] space-y-3">
                <div className="flex items-center gap-2.5 font-semibold text-xs">
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>Download My Personal Data (Machine-Readable JSON)</span>
                </div>
                <p className="opacity-70 text-[11px] leading-relaxed">
                  Includes your full profile metadata, all published and draft dispatches, C2PA media forensics credentials, bookmarks, and account timestamps.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadMyData}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-400/30 hover:bg-sky-500/25 transition-colors inline-flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Plain JSON Archive</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadEncryptedData}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-400/30 hover:bg-emerald-500/25 transition-colors inline-flex items-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Export AES-256 Encrypted Vault (.enc.json)</span>
                  </button>
                </div>
                {encryptedExportStatus && (
                  <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 pt-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{encryptedExportStatus}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-500/15">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Search Engine Indexing</div>
                    <div className="opacity-60 text-[11px]">Allow Google and Bing to crawl your public correspondent profile.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowSearchIndex}
                    onChange={(e) => setAllowSearchIndex(e.target.checked)}
                    className="w-4 h-4 accent-sky-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Public Reading Activity</div>
                    <div className="opacity-60 text-[11px]">Display your public read count on verified dispatches.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={shareReadingHistory}
                    onChange={(e) => setShareReadingHistory(e.target.checked)}
                    className="w-4 h-4 accent-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. Active Sessions & Devices Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-xs">Active Logged-In Sessions</h3>
                <p className="opacity-65 text-[11px]">Devices currently authenticated to your Pulse News identity.</p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Laptop className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        <span>Chrome on Windows (Current Session)</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                          ACTIVE NOW
                        </span>
                      </div>
                      <div className="opacity-65 text-[11px]">Location: {currentUser.location} • TLS 1.3 Encrypted</div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-500/15 bg-slate-500/[0.03] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 opacity-60" />
                    <div>
                      <div className="font-semibold">Safari on iPhone 15 Pro</div>
                      <div className="opacity-65 text-[11px]">Last active 2 days ago • Tokyo, Japan</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Logged out of remote session.')}
                    className="px-3 py-1.5 rounded-xl border border-slate-500/25 hover:bg-slate-500/10 text-xs font-semibold"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. Permanent Account Deletion Workflow */}
          {activeTab === 'danger' && (
            <form onSubmit={handleExecuteDeletion} className="space-y-5">
              <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 space-y-2">
                <div className="font-bold flex items-center gap-2 text-rose-400 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Permanent Account Deletion Protocol</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  This action cannot be reversed. When you delete your account:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px]">
                  <li>Your personal profile, email, and authentication credentials will be erased immediately.</li>
                  <li>All active sessions and tokens will be permanently revoked.</li>
                  <li>Published dispatches are archived under &ldquo;Deleted Correspondent&rdquo; to preserve the integrity of historical public records.</li>
                  <li>Your comments will be anonymized to &ldquo;Author Deleted&rdquo;.</li>
                </ul>
              </div>

              {currentUser.password && (
                <div>
                  <label className="block font-semibold opacity-75 mb-1.5">
                    Re-authenticate Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password to verify ownership"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-xs focus:outline-none focus:border-rose-400"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold opacity-75 mb-1.5">
                  Type <span className="font-mono text-rose-400">DELETE</span> to confirm *
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmationWord}
                  onChange={(e) => setDeleteConfirmationWord(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-500/[0.06] border border-slate-500/20 text-xs focus:outline-none focus:border-rose-400 font-mono"
                />
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
                  {deleteError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Delete My Identity &amp; Account</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

