import React, { useEffect, useState } from 'react';
import {
  Check,
  Cookie,
  Info,
  Lock,
  RotateCcw,
  Shield,
  Sliders,
  X,
} from 'lucide-react';

export interface CookiePreferences {
  strictlyNecessary: boolean; // Always true
  functional: boolean;
  analytics: boolean;
  advertising: boolean;
}

const STORAGE_KEY = 'pulse_cookie_consent_v2';

export const CookieConsentBanner: React.FC<{
  primaryColor: string;
  isDark: boolean;
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
}> = ({ primaryColor, isDark, isOpenExternal, onCloseExternal }) => {
  const [hasConsented, setHasConsented] = useState<boolean>(true);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    strictlyNecessary: true,
    functional: true,
    analytics: false,
    advertising: false,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences(parsed.preferences || {
          strictlyNecessary: true,
          functional: true,
          analytics: false,
          advertising: false,
        });
        setHasConsented(true);
      } else {
        setHasConsented(false);
      }
    } catch {
      setHasConsented(false);
    }
  }, []);

  // Sync external open trigger (e.g. from footer link or Privacy Policy)
  useEffect(() => {
    if (isOpenExternal) {
      setIsCustomizeOpen(true);
    }
  }, [isOpenExternal]);

  const saveConsent = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 2,
          timestamp: new Date().toISOString(),
          preferences: prefs,
        })
      );
    } catch {
      // ignore
    }
    setPreferences(prefs);
    setHasConsented(true);
    setIsCustomizeOpen(false);
    if (onCloseExternal) onCloseExternal();
  };

  const handleAcceptAll = () => {
    saveConsent({
      strictlyNecessary: true,
      functional: true,
      analytics: true,
      advertising: true,
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      strictlyNecessary: true,
      functional: false,
      analytics: false,
      advertising: false,
    });
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
  };

  // If customize modal is open (either from banner or persistent footer trigger)
  if (isCustomizeOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 ${
            isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-white border-black/10 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-950 shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial text-xl font-bold tracking-tight">
                  Cookie &amp; Privacy Preferences
                </h3>
                <p className="text-xs opacity-60">Manage your data and tracking consent</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCustomizeOpen(false);
                if (onCloseExternal) onCloseExternal();
              }}
              className="p-2 rounded-xl opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs divide-y divide-slate-500/15 max-h-[60vh] overflow-y-auto pr-1">
            {/* 1. Strictly Necessary */}
            <div className="pt-2 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-emerald-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Strictly Necessary (Always Active)</span>
                </div>
                <p className="opacity-70 text-[11px] leading-relaxed">
                  Required for user authentication, security tokens, session management, and CSRF protection. Cannot be disabled.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 shrink-0">
                REQUIRED
              </span>
            </div>

            {/* 2. Functional */}
            <div className="pt-3 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold">Functional Cookies</div>
                <p className="opacity-70 text-[11px] leading-relaxed">
                  Remembers your language choice (e.g. English, Español, 日本語), light/dark theme preference, and audio narration speeds.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, functional: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>

            {/* 3. Analytics */}
            <div className="pt-3 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold">Performance &amp; Diagnostics Telemetry</div>
                <p className="opacity-70 text-[11px] leading-relaxed">
                  Collects aggregated, non-identifying V8 heap memory metrics and CDN cache hit ratios to improve global latency.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>

            {/* 4. Advertising */}
            <div className="pt-3 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold">Personalized Topic Recommendations</div>
                <p className="opacity-70 text-[11px] leading-relaxed">
                  Tailors your &ldquo;For You&rdquo; dispatch stream based on news categories you read most.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={preferences.advertising}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, advertising: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleRejectNonEssential}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-500/30 hover:bg-slate-500/10 text-xs font-semibold transition-colors"
            >
              Reject All Optional
            </button>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveCustom}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-950 shadow-md transition-opacity hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Persistent floating trigger pill when consent has already been given
  if (hasConsented) {
    return (
      <button
        type="button"
        onClick={() => setIsCustomizeOpen(true)}
        className="fixed bottom-4 left-4 z-40 p-2.5 rounded-full bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-950 border border-white/15 dark:border-black/10 shadow-lg backdrop-blur-md opacity-75 hover:opacity-100 transition-all flex items-center gap-2 text-xs font-medium"
        title="Open Cookie &amp; Privacy Preferences"
        aria-label="Manage Cookie Settings"
      >
        <Cookie className="w-4 h-4" />
        <span className="hidden md:inline text-[11px]">Privacy Settings</span>
      </button>
    );
  }

  // Initial Banner Display
  return (
    <aside
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-5 rounded-3xl bg-slate-900/95 text-white border border-white/15 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300 space-y-4"
    >
      <div className="flex items-start gap-3.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-950 shrink-0 shadow"
          style={{ backgroundColor: primaryColor }}
        >
          <Cookie className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-editorial text-base font-bold tracking-tight">
            Privacy &amp; Cookie Consent
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Pulse News uses strictly necessary cookies to keep you signed in and optional functional cookies to remember your preferences. We never sell your personal data.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleAcceptAll}
          className="w-full py-2.5 rounded-xl text-xs font-extrabold text-slate-950 shadow-md transition-opacity hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          Accept All
        </button>
        <button
          type="button"
          onClick={handleRejectNonEssential}
          className="w-full py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/15 transition-colors"
        >
          Essential Only
        </button>
        <button
          type="button"
          onClick={() => setIsCustomizeOpen(true)}
          className="w-full py-2.5 rounded-xl text-xs font-semibold opacity-75 hover:opacity-100 transition-opacity"
        >
          Customize
        </button>
      </div>
    </aside>
  );
};

