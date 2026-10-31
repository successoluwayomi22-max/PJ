import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  Download,
  FileText,
  Globe,
  Lock,
  Mail,
  Scale,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react';

interface PrivacyPolicyPageProps {
  primaryColor: string;
  cardBgColor: string;
  isDark: boolean;
  onOpenCookieSettings?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  primaryColor,
  cardBgColor,
  isDark,
  onOpenCookieSettings,
}) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('collection');

  const SECTIONS = [
    { id: 'collection', title: '1. Information We Collect', icon: Database },
    { id: 'purpose', title: '2. Legal Basis & How We Use Data', icon: Scale },
    { id: 'retention', title: '3. Data Retention & Archival', icon: FileText },
    { id: 'sharing', title: '4. Third Parties & Zero-Sale Policy', icon: Shield },
    { id: 'rights', title: '5. Your Rights (NDPA & GDPR)', icon: UserCheck },
    { id: 'security', title: '6. Cryptographic Security & C2PA', icon: Lock },
    { id: 'deletion', title: '7. Account Erasure & Deletion', icon: UserX },
    { id: 'contact', title: '8. Data Protection Officer (DPO)', icon: Mail },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-8">
      {/* Header Banner */}
      <div
        style={{ backgroundColor: cardBgColor }}
        className="p-6 sm:p-8 rounded-3xl border border-slate-500/15 relative overflow-hidden shadow-lg"
      >
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> NDPA &amp; GDPR Compliant Policy
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight">
            Privacy Policy &amp; Data Governance
          </h1>
          <p className="text-xs sm:text-sm opacity-70 leading-relaxed">
            Effective Date: October 31, 2026 • Version 2.4. Pulse News is committed to transparent, privacy-first journalism, strict provenance tracking, and full user sovereignty over personal data.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sticky Table of Contents Navigation */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-3">
          <div
            style={{ backgroundColor: cardBgColor }}
            className="p-4 rounded-2xl border border-slate-500/15 space-y-1"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-50 px-3 py-1.5">
              Policy Sections
            </div>
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? isDark
                        ? 'bg-white/10 text-white font-semibold'
                        : 'bg-slate-900 text-white font-semibold'
                      : 'opacity-70 hover:opacity-100 hover:bg-slate-500/[0.06]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{sec.title}</span>
                </a>
              );
            })}
          </div>

          {/* Quick Privacy Actions Card */}
          <div
            style={{ backgroundColor: cardBgColor }}
            className="p-5 rounded-2xl border border-slate-500/15 space-y-3 text-xs"
          >
            <div className="font-semibold text-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              <span>Direct Privacy Controls</span>
            </div>
            <p className="text-[11px] opacity-65 leading-relaxed">
              You maintain immediate control over your cookies, profile indexing, and data exports directly inside your session.
            </p>
            <div className="space-y-2 pt-1">
              {onOpenCookieSettings && (
                <button
                  type="button"
                  onClick={onOpenCookieSettings}
                  className="w-full py-2 px-3 rounded-xl border border-slate-500/25 hover:bg-slate-500/10 font-semibold text-left flex items-center justify-between transition-colors"
                >
                  <span>Manage Cookie Preferences</span>
                  <span className="opacity-50">→</span>
                </button>
              )}
              <Link
                to="/profile/current"
                className="block w-full py-2 px-3 rounded-xl border border-slate-500/25 hover:bg-slate-500/10 font-semibold text-left transition-colors"
              >
                <span>Account Privacy &amp; Data Export</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Detailed Policy Content */}
        <main className="lg:col-span-8 space-y-8 text-xs sm:text-sm leading-relaxed">
          {/* Section 1 */}
          <section
            id="collection"
            style={{ backgroundColor: cardBgColor }}
            className="p-6 sm:p-8 rounded-3xl border border-slate-500/15 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-base font-bold font-editorial">
              <Database className="w-4 h-4 text-sky-400" />
              <h2>1. Information We Collect</h2>
            </div>
            <p className="opacity-80">
              When you interact with the Pulse News platform, we collect only data necessary for authentic news delivery, community fact-verification, and security protection:
            </p>
            <ul className="list-disc pl-5 space-y-2 opacity-80 text-xs">
              <li>
                <strong>Identity &amp; Account Data:</strong> Your display name, chosen @username, verified email address, optional profile avatar, and bureau location.
              </li>
              <li>
                <strong>Public Editorial Content:</strong> Articles, field reports, photos, 4K videos, comments, and community fact-check notes you explicitly submit.
              </li>
              <li>
                <strong>C2PA Device Provenance (Optional Eyewitness Mode):</strong> Hardware device timestamps and GPS coordinates attached only when you choose to publish an eyewitness on-the-scene dispatch with cryptographic C2PA certification.
              </li>
              <li>
                <strong>Security &amp; Essential Session Telemetry:</strong> Anonymized V8 memory profiler logs, session tokens, and rate-limiting attempt counters to prevent denial-of-service and credential stuffing attacks.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section
            id="purpose"
            style={{ backgroundColor: cardBgColor }}
            className="p-6 sm:p-8 rounded-3xl border border-slate-500/15 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-base font-bold font-editorial">
              <Scale className="w-4 h-4 text-emerald-400" />
              <h2>2. Legal Basis &amp; How We Use Your Data</h2>
            </div>
            <p className="opacity-80">
              Under the <strong>Nigeria Data Protection Act 2023 (NDPA)</strong> and the <strong>EU General Data Protection Regulation (GDPR)</strong>, our processing is grounded strictly in lawful bases:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-500/15 bg-slate-500/[0.03] space-y-1">
                <div className="font-semibold text-sky-400">Contractual Necessity</div>
                <div className="opacity-75">
                  Delivering your personal feed, bookmarks, dispatches, and notifications.
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-500/15 bg-slate-500/[0.03] space-y-1">
                <div className="font-semibold text-emerald-400">Legitimate Journalistic Interest</div>
                <div className="opacity-75">
                  Archiving public-interest news reports and verifying media provenance.
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-500/15 bg-slate-500/[0.03] space-y-1">
                <div className="font-semibold text-purple-400">Explicit Consent</div>
                <div className="opacity-75">
                  Optional analytical cookies, location geo-tagging, and newsletter subscriptions.
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-500/15 bg-slate-500/[0.03] space-y-1">
                <div className="font-semibold text-amber-400">Security &amp; Fraud Prevention</div>
                <div className="opacity-75">
                  Sliding-window rate limits, anti-abuse spam detection, and tamper-evident audit logs.
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section
            id="retention"
            style={{ backgroundColor: cardBgColor }}
            className="p-6 sm:p-8 rounded-3xl border border-slate-500/15 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-base font-bold font-editorial">
              <FileText className="w-4 h-4 text-purple-400" />
              <h2>3. Data Retention &amp; Archival Policy</h2>
            </div>
            <p className="opacity-80">
              We retain personal data only for as long as necessary to fulfill the purposes outlined in this policy:
            </p>
            <ul className="list-disc pl-5 space-y-2 opacity-80 text-xs">
              <li>
                <strong>Active User Accounts:</strong> Retained until the user requests account deletion.
              </li>
              <li>
                <strong>Published News Articles:</strong> As an accredited journalistic network, published news dispatches of public record remain in our historical archive. Upon author deletion, articles are anonymized to protect the historical public record without retaining personal identity.
              </li>
              <li>
                <strong>Security Logs &amp; Telemetry:</strong> Sliding 30-day retention window, after which log buffers are automatically flushed.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section
            id="sharing"
            style={{ backgroundColor: cardBgColor }}
            className="p-6 sm:p-8 rounded-3xl border border-slate-500/15 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-base font-bold font-editorial">
              <Shield className="w-4 h-4 text-rose-400" />
              <h2>4. Third Parties &amp; Zero-Sale Policy</h2>
            </div>
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xs space-y-1.5">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>We Never Sell Personal Data</span>
              </div>
              <p className="opacity-90">
                Pulse News does not sell, rent, monetize, or trade your personal information, reading habits, or location data with data brokers or ad networks.
              </p>
            </div>
            <p className="opacity-80 text-xs">
              Data is shared only with verified infrastructure sub-processors strictly necessary to host the platform:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 opacity-80 text-xs">
              <li>Content Delivery Networks (CDNs) for high-speed edge caching.</li>
              <li>Secure transactional mail providers for account verification links.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section
            id="rights"
            style={{ backgroundColor: cardBgColor }}
            className="p-6 sm:p-8 rounded-3xl border border-slate-500/15 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-base font-bold font-editorial">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <h2>5. Your Rights Under NDPA &amp; GDPR</h2>
            </div>
            <p className="opacity-80 text-xs">
              Regardless of your citizenship, Pulse News extends full modern data protection rights to every registered user:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl border border-slate-500/15 bg-slate-500/[0.03]">
                <strong>Right to Access &amp; Portability:</strong> You can download a complete machine-readable JSON archive of your personal account, dispatches, and bookmarks from your profile.
              </div>
              <div className="p-3 rounded-xl border border-slate-500/15 bg-slate-500/[0.03]">
                <strong>Right to Rectification:</strong> Edit your name, bio, email, or profile photo at any time.
              </div>
              <div className="p-3 rounded-xl border border-slate-500/15 bg-slate-500/[0.03]">
                <strong>Right to Erasure (Deletion):</strong> Permanently delete your account with complete removal of personal credentials and session revocation.
              </div>
              <div className="p-3 rounded-xl border border-slate-500/15 bg-slate-500/[0.03]">
                <strong>Right to Withdraw Cookie Consent:</strong> Toggle or revoke functional and analytics cookie preferences at any time via the persistent Cookie Settings panel.
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section
            id="security"
            style={{ backgroundColor: cardBgColor }}
            className="p-6 sm:p-8 rounded-3xl border border-slate-500/15 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-base font-bold font-editorial">
              <Lock className="w-4 h-4 text-sky-400" />
              <h2>6. Cryptographic Security &amp; C2PA Telemetry</h2>
            </div>
            <p className="opacity-80 text-xs">
              All data transmitted to Pulse News is encrypted in transit using TLS 1.3. Eyewitness media attachments utilize cryptographic C2PA content credentials to ensure images and videos cannot be spoofed or altered without detection.
            </p>
          </section>

          {/* Section 7 */}
          <section
            id="deletion"
            style={{ backgroundColor: cardBgColor }}
            className="p-6 sm:p-8 rounded-3xl border border-slate-500/15 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-base font-bold font-editorial">
              <UserX className="w-4 h-4 text-rose-400" />
              <h2>7. Account Erasure &amp; Deletion Workflow</h2>
            </div>
            <p className="opacity-80 text-xs">
              Our automated deletion protocol adheres strictly to article retention standards:
            </p>
            <ol className="list-decimal pl-5 space-y-2 opacity-80 text-xs">
              <li>Requires password re-authentication to prevent unauthorized deletion.</li>
              <li>Revokes all active sessions, authentication tokens, and browser caches.</li>
              <li>Permanently deletes personal identifiers (email, password hash, personal bio).</li>
              <li>Anonymizes user comments and public contributions to preserve thread coherence.</li>
              <li>Records an immutable audit timestamp without retaining personal data.</li>
            </ol>
          </section>

          {/* Section 8 */}
          <section
            id="contact"
            style={{ backgroundColor: cardBgColor }}
            className="p-6 sm:p-8 rounded-3xl border border-slate-500/15 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-base font-bold font-editorial">
              <Mail className="w-4 h-4 text-emerald-400" />
              <h2>8. Contact Our Data Protection Officer (DPO)</h2>
            </div>
            <p className="opacity-80 text-xs">
              If you have any questions about this Privacy Policy, your rights under the NDPA or GDPR, or wish to file a formal request:
            </p>
            <div className="p-4 rounded-2xl border border-slate-500/15 bg-slate-500/[0.04] text-xs space-y-1 font-mono">
              <div><strong>Data Protection Officer:</strong> Pulse News Governance &amp; Ethics Board</div>
              <div><strong>Email:</strong> dpo@pulsenews.global</div>
              <div><strong>Headquarters:</strong> Lagos • London • Tokyo Global Bureau Network</div>
              <div><strong>Regulatory Liaison:</strong> Nigeria Data Protection Commission (NDPC) Compliance Registry</div>
            </div>
          </section>

          {/* Bottom Back Button */}
          <div className="pt-6 border-t border-slate-500/15 flex items-center justify-between">
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold border border-slate-500/25 hover:bg-slate-500/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <Link
              to="/"
              className="text-xs font-medium opacity-65 hover:opacity-100 hover:underline"
            >
              Return to News Feed
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

