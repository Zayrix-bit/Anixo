import React from 'react';
import { usePopunder } from '../../context/PopunderContext';
import { useToast } from '../../context/ToastContext';

export function PopunderControlButton() {
  const { isPopunderDisabled, timeLeft, disablePopunderForHour } = usePopunder();
  const { showToast } = useToast();

  const handlePauseAds = () => {
    disablePopunderForHour();
    showToast('Ads disabled for 1 hour!', 'success');
  };

  if (isPopunderDisabled) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/20 border border-green-500/20">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs font-medium text-green-200">Ads off</span>
        {timeLeft && (
          <span className="text-xs font-mono text-green-300/70">{timeLeft}</span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handlePauseAds}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-900/20 border border-red-500/20 hover:bg-red-800/30 transition-all duration-200"
      title="Turn off popunder ads for 1 hour"
    >
      <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 1.5H5.25A2.25 2.25 0 0 0 3 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 20.25V7.5" />
        <path d="M14.25 1.5v6h6" />
        <path d="M9.75 9.75h4.5v4.5h-4.5z" />
      </svg>
      <span className="text-xs font-medium text-white/80">Pause ads</span>
    </button>
  );
}
