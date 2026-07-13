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
      <div className="w2g-banner">
        <div className="w2g-banner-inner">
          {/* Left: Text */}
          <div className="w2g-text-container">
            <div className="w2g-live-badge">
              <div className="w2g-live-dot" />
              <span className="w2g-live-text">LIVE</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="w2g-text flex flex-wrap items-center gap-2">
                <strong className="w2g-brand-text text-transparent bg-clip-text bg-gradient-to-r from-discord-400 to-purple-400">Watch2Gether</strong>
                <span className="text-[9px] bg-discord-600 text-white px-1.5 py-0.5 rounded-[4px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(88,101,242,0.4)] animate-pulse">BETA</span>
                <span className="opacity-90 ml-1 hidden sm:inline">Experience synchronized anime watching with friends!</span>
                <span className="opacity-90 ml-1 sm:hidden">Watch with friends!</span>
              </p>
            </div>
          </div>

          {/* Separator */}
          <div className="w2g-separator" />

          {/* Right: CTA */}
          <Link
            to="/watch2gether"
            className="w2g-cta group"
          >
            <Users size={14} className="group-hover:scale-110 transition-transform" />
            <span>Join Lobby</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="w2g-dismiss"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <style>{`
        .w2g-banner {
          position: relative;
          border-radius: 14px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(88,101,242,0.8), rgba(255,42,95,0.6), rgba(88,101,242,0.3));
          background-size: 300% 300%;
          animation: w2gBorderShift 4s ease infinite;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 15px rgba(88,101,242,0.2);
        }
        .w2g-banner-inner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          border-radius: 13px;
          background: linear-gradient(135deg, rgba(15,12,30,0.98) 0%, rgba(20,16,40,0.95) 100%);
          position: relative;
          overflow: hidden;
        }
        .w2g-text-container {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .w2g-live-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 42, 95, 0.15);
          border: 1px solid rgba(255, 42, 95, 0.3);
          padding: 4px 8px;
          border-radius: 20px;
          flex-shrink: 0;
        }
        .w2g-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ff2a5f;
          box-shadow: 0 0 8px #ff2a5f;
          animation: w2gLivePulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .w2g-live-text {
          color: #ff2a5f;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          line-height: 1;
        }
        .w2g-brand-text {
          font-weight: 800;
          font-size: 14px;
        }
        .w2g-text {
          margin: 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          line-height: 1.4;
        }
        .w2g-separator {
          width: 1px;
          height: 32px;
          background: rgba(88, 101, 242, 0.3);
          flex-shrink: 0;
        }
        .w2g-cta {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 10px;
          background: rgba(88, 101, 242, 0.15);
          border: 1px solid rgba(88, 101, 242, 0.4);
          color: #c7cdff;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: inset 0 0 0 0 rgba(88, 101, 242, 0);
        }
        .w2g-cta:hover {
          background: rgba(88, 101, 242, 0.9);
          color: #ffffff;
          border-color: rgba(88, 101, 242, 1);
          box-shadow: 0 0 20px rgba(88, 101, 242, 0.4);
          transform: translateY(-1px);
        }
        @media (max-width: 640px) {
          .w2g-banner-inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding: 14px 16px;
          }
          .w2g-separator {
            display: none;
          }
          .w2g-cta {
            width: 100%;
            justify-content: center;
          }
          .w2g-dismiss {
            position: absolute;
            top: 10px;
            right: 10px;
          }
        }
        .w2g-banner-inner::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: w2gShimmer 4s ease-in-out infinite;
          pointer-events: none;
        }
        .w2g-dismiss {
          background: none;
          border: none;
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          padding: 4px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          transition: all 0.2s;
          margin-left: 4px;
        }
        .w2g-dismiss:hover { color: #fff; transform: scale(1.1) rotate(90deg); }
        
        @keyframes w2gLivePulse {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px rgba(255,42,95,0.6); }
          50% { opacity: 0.5; transform: scale(0.85); box-shadow: 0 0 4px rgba(255,42,95,0.2); }
        }
        @keyframes w2gBorderShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes w2gShimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>
    </div>
  );
};

export default W2GNoticeBanner;
