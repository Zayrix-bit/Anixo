import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const LAUNCH_DATE = new Date('2026-07-15T00:00:00+05:30').getTime();

const W2GNoticeBanner = () => {
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('w2g_notice_dismissed') === 'true';
  });

  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft());

  function getTimeLeft() {
    const diff = Math.max(0, LAUNCH_DATE - Date.now());
    return {
      d: Math.floor(diff / (1000 * 60 * 60 * 24)),
      h: Math.floor((diff / (1000 * 60 * 60)) % 24),
      m: Math.floor((diff / (1000 * 60)) % 60),
      s: Math.floor((diff / 1000) % 60),
    };
  }

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('w2g_notice_dismissed', 'true');
  };

  if (dismissed) return null;

  const pad = (n) => String(n).padStart(2, '0');

  const TimeBox = ({ value, label }) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: '36px',
    }}>
      <span style={{
        fontFamily: "'Inter', monospace",
        fontSize: '18px',
        fontWeight: 700,
        color: '#fff',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>{pad(value)}</span>
      <span style={{
        fontSize: '8px',
        color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontWeight: 600,
        marginTop: '2px',
      }}>{label}</span>
    </div>
  );

  return (
    <div className="max-w-[1720px] mx-auto px-2 md:px-4 mt-4">
      <div className="w2g-banner">
        <div className="w2g-banner-inner">
          {/* Left: Text */}
          <div className="w2g-text-container">
            <div className="w2g-live-dot" />
            <div style={{ minWidth: 0 }}>
              <p className="w2g-text">
                <strong style={{ color: '#fff', fontWeight: 700 }}>Watch2Gether</strong>{' '}
                is coming watch anime in sync.
              </p>
            </div>
          </div>

          {/* Separator */}
          <div className="w2g-separator" />

          {/* Right: Countdown */}
          <div className="w2g-countdown-container">
            {[
              { value: timeLeft.d, label: 'days' },
              { value: timeLeft.h, label: 'hrs' },
              { value: timeLeft.m, label: 'min' },
              { value: timeLeft.s, label: 'sec' },
            ].map((item, i) => (
              <React.Fragment key={item.label}>
                {i > 0 && <span style={{ color: 'rgba(108,92,231,0.5)', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>:</span>}
                <TimeBox value={item.value} label={item.label} />
              </React.Fragment>
            ))}
          </div>

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
        .w2g-countdown-container {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
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
          .w2g-countdown-container {
            width: 100%;
            justify-content: space-between;
            padding-top: 4px;
            border-top: 1px solid rgba(108, 92, 231, 0.15);
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
          background: #6c5ce7;
          flex-shrink: 0;
          box-shadow: 0 0 8px rgba(108,92,231,0.6);
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
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px rgba(108,92,231,0.6); }
          50% { opacity: 0.5; transform: scale(0.85); box-shadow: 0 0 4px rgba(108,92,231,0.3); }
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
