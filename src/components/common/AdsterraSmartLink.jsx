import React from 'react';

import { ADSTERRA_SMART_LINK } from '../../hooks/useAdsterraSmartLink';

export function AdsterraSmartLinkBanner() {
  return (
    <div className="w-full flex justify-center py-6 px-4 overflow-hidden">
      <div className="w-full max-w-[800px]">
        <a 
          href={ADSTERRA_SMART_LINK}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block w-full bg-[#090a0f] border-2 border-white/5 hover:border-white/20 p-8 md:p-10 text-center cursor-pointer transition-all duration-300 group"
        >
          <div className="text-[10px] uppercase font-black tracking-[0.4em] text-white/10 mb-4 group-hover:text-red-500/50 transition-colors">
            AD // REALITY CHECK
          </div>
          
          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white mb-2">
            You Get 0 Bitches.
          </h3>
          
          <p className="text-sm md:text-base text-white/40 mb-6 font-medium max-w-md mx-auto">
            Your posture is terrible, your sleep schedule is ruined, and your waifu isn't real. Click this link so we can at least profit off your pathetic existence.
          </p>
          
          <div className="inline-block bg-white text-black hover:bg-gray-200 font-black uppercase tracking-widest py-3 px-8 rounded-sm text-xs transition-transform duration-300 active:scale-95 group-hover:-translate-y-1">
            Accept Reality
          </div>
        </a>
      </div>
    </div>
  );
}
