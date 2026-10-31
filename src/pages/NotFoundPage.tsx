import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, Newspaper } from 'lucide-react';

export const NotFoundPage: React.FC<{
  primaryColor: string;
  cardBgColor: string;
  isDark: boolean;
}> = ({ primaryColor, cardBgColor, isDark }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div
        style={{ backgroundColor: cardBgColor }}
        className="max-w-md w-full p-8 sm:p-10 rounded-3xl border border-slate-500/15 shadow-xl space-y-6"
      >
        <div
          className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-slate-950 shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <Newspaper className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase font-bold tracking-wider opacity-50">
            HTTP 404 • Resource Not Found
          </div>
          <h1 className="font-editorial text-3xl font-bold tracking-tight">
            Story or Route Does Not Exist
          </h1>
          <p className="text-xs opacity-70 leading-relaxed">
            The news dispatch, profile, or editorial bureau you requested may have been archived, moved, or temporarily unpublished.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <Link
            to="/"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 shadow transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Home Feed</span>
          </Link>
          <Link
            to="/explore"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-500/25 hover:bg-slate-500/10 transition-colors flex items-center justify-center gap-2"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore 3D Media</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

