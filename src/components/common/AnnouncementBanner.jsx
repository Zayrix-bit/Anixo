import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight, Crown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { backendApi } from '../../services/api';

// Helper to format localized relative time based on navigator locale
const getRelativeTime = (timestamp, locale = 'en') => {
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const elapsed = timestamp - Date.now();

    const msPerMinute = 60 * 1000;
    const msPerHour = 60 * msPerMinute;
    const msPerDay = 24 * msPerHour;
    const msPerMonth = 30 * msPerDay;
    const msPerYear = 365 * msPerDay;

    const absElapsed = Math.abs(elapsed);

    if (absElapsed < msPerMinute) {
      return rtf.format(Math.round(elapsed / 1000), 'second');
    } else if (absElapsed < msPerHour) {
      return rtf.format(Math.round(elapsed / msPerMinute), 'minute');
    } else if (absElapsed < msPerDay) {
      return rtf.format(Math.round(elapsed / msPerHour), 'hour');
    } else if (absElapsed < msPerMonth) {
      return rtf.format(Math.round(elapsed / msPerDay), 'day');
    } else if (absElapsed < msPerYear) {
      return rtf.format(Math.round(elapsed / msPerMonth), 'month');
    } else {
      return rtf.format(Math.round(elapsed / msPerYear), 'year');
    }
  } catch {
    const elapsed = Date.now() - timestamp;
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
};

const AnnouncementBanner = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(() => {
    return localStorage.getItem('dismissed_avatar_announcement') !== 'true';
  });
  const [adminProfile, setAdminProfile] = useState(null);

  useEffect(() => {
    if (!isVisible) return;
    
    // If logged-in user is the admin, do not fetch from network
    if (user && (user.profileId === '9b9046b5' || user.username === 'JEKOP' || user.role === 'admin')) {
      return;
    }

    const fetchAdmin = async () => {
      try {
        const res = await backendApi.get('/users/9b9046b5');
        if (res.data.success) {
          setAdminProfile(res.data.profile);
        }
      } catch (err) {
        console.error("Failed to fetch admin profile:", err);
      }
    };
    fetchAdmin();
  }, [isVisible, user]);

  const handleDismiss = () => {
    localStorage.setItem('dismissed_avatar_announcement', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const isAdminLoggedIn = user && (user.profileId === '9b9046b5' || user.username === 'JEKOP' || user.role === 'admin');
  const activeProfile = isAdminLoggedIn ? user : adminProfile;
  const adminName = activeProfile?.displayName || activeProfile?.username || "ELfen+JEKOP";
  const adminAvatar = activeProfile?.avatar || "/avatars/csm/img_1.jpg";

  const publishDate = new Date("2026-06-28T09:26:00Z");
  const relativeTime = getRelativeTime(publishDate.getTime(), typeof navigator !== 'undefined' ? navigator.language : 'en');

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 md:px-8 mb-6 mt-4 animate-in fade-in duration-300">
      <style>{`
        @keyframes banner-shake {
          0%, 88%, 100% { transform: rotate(0deg) scale(1); }
          90%, 94%, 98% { transform: rotate(-0.5deg) scale(1.005); }
          92%, 96% { transform: rotate(0.5deg) scale(1.005); }
        }
        @keyframes border-glow {
          0%, 100% { border-color: #27272a; box-shadow: 0 0 0px rgba(220, 38, 38, 0); }
          50% { border-color: rgba(220, 38, 38, 0.4); box-shadow: 0 0 15px rgba(220, 38, 38, 0.08); }
        }
        @keyframes btn-shimmer {
          0% { left: -150%; }
          50% { left: 150%; }
          100% { left: 150%; }
        }
        .animate-banner-shake-glow {
          animation: banner-shake 6s ease-in-out infinite, border-glow 4s ease-in-out infinite;
        }
        .shimmer-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          width: 60px;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          transform: skewX(-20deg);
          animation: btn-shimmer 3.5s ease-in-out infinite;
        }
      `}</style>
      <div className="relative overflow-hidden bg-[#121212] border border-zinc-800 rounded-xl p-5 flex flex-col lg:flex-row items-center justify-between gap-6 transition-all duration-300 animate-banner-shake-glow hover:border-red-500/20">

        {/* Left Accent Bar */}
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-red-600"></div>

        {/* Info & Avatar Showcase */}
        <div className="flex flex-col md:flex-row items-center gap-5 w-full lg:w-auto text-center md:text-left pl-2">

          {/* Admin DP */}
          <div className="relative shrink-0 select-none transition-all duration-300 hover:scale-105">
            <div className="w-13 h-13 rounded-full border-2 border-purple-500/80 overflow-hidden bg-zinc-900 shadow-md">
              <img src={adminAvatar} alt={adminName} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#121212] border border-zinc-800 rounded-full p-0.5 shadow-md flex items-center justify-center">
              <Crown size={9} className="text-purple-400" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1 flex-wrap">
              <span className="bg-purple-600/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase flex items-center gap-1">
                <Crown size={10} className="text-purple-400 animate-pulse" />
                Admin Update
              </span>
              <span className="text-zinc-500 text-xs font-semibold">
                By <span className="text-zinc-300 font-bold">{adminName}</span>
              </span>
              <span className="text-zinc-600 text-xs select-none">•</span>
              <span className="text-zinc-500 text-[11px] font-medium" title={publishDate.toLocaleString()}>
                {relativeTime}
              </span>
            </div>
            <h3 className="text-white font-bold text-[17px] leading-tight tracking-tight">
              Profile Avatars are now live!
            </h3>
            <p className="text-zinc-400 text-[13.5px] mt-0.5 max-w-[620px] leading-relaxed">
              I've added custom avatars (Chainsaw Man, Bleach, Boruto, and more) to customize your profile! More packs are coming soon. Go set yours in profile settings!
            </p>
          </div>
        </div>

        {/* Action Button & Close */}
        <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto justify-center lg:justify-end">
          <Link
            to={user ? "/profile" : "/home?login=true"}
            className="shimmer-btn relative overflow-hidden flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded transition-all duration-200 shadow-lg hover:shadow-red-600/10 active:scale-95 cursor-pointer"
          >
            <span>{user ? "Choose Avatar" : "Login to Choose"}</span>
            <ArrowRight size={14} />
          </Link>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-850 rounded transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default AnnouncementBanner;
