import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight, Crown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AnnouncementBanner = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(() => {
    return localStorage.getItem('dismissed_avatar_announcement') !== 'true';
  });

  const handleDismiss = () => {
    localStorage.setItem('dismissed_avatar_announcement', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

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
        <div className="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto text-center md:text-left pl-2">
          
          {/* Avatar Cards Row */}
          <div className="flex items-center justify-center gap-2 shrink-0 select-none">
            <div className="w-12 h-12 rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900 shadow-md transition-all duration-300 hover:scale-110 hover:-rotate-3 hover:border-red-500 cursor-pointer">
              <img src="/avatars/csm/img_1.jpg" alt="Chainsaw Man" className="w-full h-full object-cover" />
            </div>
            <div className="w-12 h-12 rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900 shadow-md transition-all duration-300 hover:scale-110 hover:rotate-3 hover:border-red-500 cursor-pointer">
              <img src="/avatars/bleach/img_1.jpg" alt="Bleach" className="w-full h-full object-cover" />
            </div>
            <div className="w-12 h-12 rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900 shadow-md transition-all duration-300 hover:scale-110 hover:-rotate-3 hover:border-red-500 cursor-pointer">
              <img src="/avatars/baruto/img_1.jpg" alt="Boruto" className="w-full h-full object-cover" />
            </div>
            <div className="w-12 h-12 rounded-lg border border-zinc-800 flex items-center justify-center bg-zinc-900/60 shadow-md font-bold text-xs text-zinc-500 transition-all duration-300 hover:scale-105 cursor-pointer hover:text-red-500">
              +50
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5 flex-wrap">
              <span className="relative flex h-2 w-2 mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="bg-purple-600/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
                <Crown size={12} className="text-purple-400 animate-pulse" />
                Admin Update
              </span>
              <span className="bg-red-600/10 text-red-500 border border-red-500/20 px-2.5 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">
                New Feature
              </span>
            </div>
            <h3 className="text-white font-bold text-lg leading-tight tracking-tight">
              Profile Avatars are now live!
            </h3>
            <p className="text-zinc-400 text-sm mt-1 max-w-[650px] leading-relaxed">
              Hey guys! I've added the option to customize your profile with custom avatars. I've only uploaded a few starter packs (Chainsaw Man, Bleach, Boruto, etc.) for now, but I will be adding many more categories soon! Head over to your profile settings to choose yours.
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
