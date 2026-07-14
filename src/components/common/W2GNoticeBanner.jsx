import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, X, ArrowRight } from 'lucide-react';

const W2GNoticeBanner = () => {
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('w2g_notice_dismissed') === 'true';
  });

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('w2g_notice_dismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <div className="max-w-[1720px] mx-auto px-2 md:px-4 mt-4">
      <div className="relative flex items-center justify-between gap-4 py-3 px-4 rounded-xl bg-[#141028] border border-discord-400/20 shadow-lg">
        {/* Left: Text */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded bg-[#2b2d42] p-1">
            <img src="https://anilist.co/img/icons/icon.svg" alt="AniList" className="w-full h-full object-contain" />
          </div>
          <p className="text-sm text-gray-200 font-medium leading-snug">
            <span className="font-bold text-white mr-1.5">
              <span className="hidden sm:inline">System Update:</span>
              <span className="sm:hidden">Update:</span>
            </span>
            <span className="opacity-90 hidden sm:inline">The AniList Sync issue is now resolved. You can safely connect your account from the Settings page.</span>
            <span className="opacity-90 sm:hidden">AniList Sync is fixed!</span>
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <Link
            to="/settings"
            className="flex items-center gap-2 px-2.5 sm:px-4 py-1.5 rounded-lg bg-discord-400/10 text-discord-400 text-xs font-bold uppercase tracking-wider hover:bg-discord-400 hover:text-white transition-colors"
          >
            <span className="hidden sm:inline">Settings</span>
            <ArrowRight size={14} />
          </Link>
          
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default W2GNoticeBanner;
