import React from 'react';
import { usePopunder } from '../../context/PopunderContext';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../context/ConfirmationContext';
import { useAuth } from '../../context/AuthContext';

export function PopunderControlButton() {
  const { isPopunderDisabled, timeLeft, disablePopunderForHour } = usePopunder();
  const { showToast } = useToast();
  const { showConfirmation } = useConfirmation();
  const { user } = useAuth();

  const handlePauseAds = async () => {
    if (!user) {
      showToast('Please login to pause ads', 'error');
      return;
    }
    const confirmed = await showConfirmation(
      'Pause Ads',
      'Are you sure you want to pause ads for 1 hour?',
    );
    if (confirmed) {
      disablePopunderForHour();
      showToast('Ads disabled for 1 hour!', 'success');
    }
  };

  if (isPopunderDisabled) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-green-900/20 border border-green-500/20">
        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
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
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-200 active:scale-95 ${
        !user 
          ? 'bg-white/5 border-white/10 cursor-not-allowed' 
          : 'bg-red-900/20 border-red-500/20 hover:bg-red-800/30'
      }`}
      title={!user ? 'Please login to pause ads' : 'Turn off popunder ads for 1 hour'}
      disabled={!user}
    >
      <svg className={`w-4 h-4 ${!user ? 'text-white/40' : 'text-red-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 1.5H5.25A2.25 2.25 0 0 0 3 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 20.25V7.5" />
        <path d="M14.25 1.5v6h6" />
        <path d="M9.75 9.75h4.5v4.5h-4.5z" />
      </svg>
      <span className={`text-xs font-medium ${!user ? 'text-white/40' : 'text-white/80'}`}>
        {!user ? 'Login to pause' : 'Pause ads'}
      </span>
    </button>
  );
}
