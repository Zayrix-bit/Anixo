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
            <div className="w2g-live-dot" />
            <div style={{ minWidth: 0 }}>
              <p className="w2g-text flex flex-wrap items-center gap-1.5">
                <strong style={{ color: '#fff', fontWeight: 700 }}>Watch2Gether</strong>
                <span className="text-[9px] bg-discord-500 text-white px-1.5 py-0.5 rounded-[4px] font-bold uppercase tracking-wider">Beta</span>
                <span>is now live! Watch anime in sync with friends.</span>
              </p>
            </div>
          </div>

          {/* Separator */}
          <div className="w2g-separator" />

          {/* Right: CTA */}
          <Link
            to="/watch2gether"
            className="w2g-cta"
          >
            <Users size={14} />
            <span>Browse Rooms</span>
            <ArrowRight size={14} />
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
          background: linear-gradient(135deg, rgba(108,92,231,0.5), rgba(168,85,247,0.3), rgba(108,92,231,0.15));
          background-size: 200% 200%;
          animation: w2gBorderShift 4s ease infinite;
        }
        .w2g-banner-inner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          border-radius: 13px;
          background: linear-gradient(135deg, rgba(20,16,40,0.95) 0%, rgba(15,12,30,0.98) 100%);
          position: relative;
          overflow: hidden;
        }
        .w2g-text-container {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .w2g-text {
          margin: 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          font-family: 'Inter', sans-serif;
          font-weight: 400;
          line-height: 1.4;
        }
        .w2g-separator {
          width: 1px;
          height: 32px;
          background: rgba(108, 92, 231, 0.3);
          flex-shrink: 0;
        }
        .w2g-cta {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 10px;
          background: rgba(108, 92, 231, 0.15);
          border: 1px solid rgba(108, 92, 231, 0.3);
          color: #a78bfa;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .w2g-cta:hover {
          background: rgba(108, 92, 231, 0.25);
          color: #c4b5fd;
          border-color: rgba(108, 92, 231, 0.5);
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
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(108,92,231,0.06), transparent);
          animation: w2gShimmer 3s ease-in-out infinite;
        }
        .w2g-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
          box-shadow: 0 0 8px rgba(34,197,94,0.6);
          animation: w2gPulse 2s ease-in-out infinite;
        }
        .w2g-dismiss {
          background: none;
          border: none;
          color: rgba(255,255,255,0.2);
          cursor: pointer;
          padding: 4px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
          margin-left: 4px;
        }
        .w2g-dismiss:hover { color: rgba(255,255,255,0.7); }
        @keyframes w2gPulse {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px rgba(34,197,94,0.6); }
          50% { opacity: 0.5; transform: scale(0.85); box-shadow: 0 0 4px rgba(34,197,94,0.3); }
        }
        @keyframes w2gBorderShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes w2gShimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        @media (max-width: 480px) {
          .w2g-hide-mobile { display: none; }
          .w2g-banner-inner { gap: 10px; padding: 10px 12px; }
        }
      `}</style>
    </div>
  );
};

export default W2GNoticeBanner;
