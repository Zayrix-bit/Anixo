import React, { useEffect, useRef } from 'react';

const ADSTERRA_SMART_LINK = "https://dependedunmoved.com/kyy99erhbc?key=644614ebc48ade4ce12a485a5a3cea3a";

export function AdsterraSmartLinkBanner() {
  const containerRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !containerRef.current) return;
    loadedRef.current = true;

    const container = containerRef.current;
    container.innerHTML = '';

    // Create Adsterra-style ad unit
    const adContainer = document.createElement('div');
    adContainer.style.width = '100%';
    adContainer.style.display = 'flex';
    adContainer.style.justifyContent = 'center';

    // Create a direct link button with Adsterra branding
    const linkButton = document.createElement('a');
    linkButton.href = ADSTERRA_SMART_LINK;
    linkButton.target = "_blank";
    linkButton.rel = "noopener noreferrer sponsored";
    linkButton.style.textDecoration = 'none';
    linkButton.style.width = '100%';
    linkButton.style.maxWidth = '800px';

    const bannerContent = document.createElement('div');
    bannerContent.className = "w-full bg-gradient-to-r from-discord-900/20 via-discord-800/30 to-discord-900/20 border border-discord-600/30 rounded-lg p-6 text-center cursor-pointer hover:border-discord-500/50 transition-all duration-300 hover:scale-[1.02]";
    
    const sponsoredLabel = document.createElement('div');
    sponsoredLabel.className = "text-[10px] uppercase tracking-widest text-white/30 mb-2";
    sponsoredLabel.textContent = "Sponsored";

    const title = document.createElement('h3');
    title.className = "text-xl font-bold text-white mb-2";
    title.textContent = "🔥 Exclusive Offer - Limited Time Only! 🔥";
    
    const subtitle = document.createElement('p');
    subtitle.className = "text-sm text-white/70 mb-3";
    subtitle.textContent = "Click now to discover amazing deals and content!";

    const ctaButton = document.createElement('div');
    ctaButton.className = "inline-block bg-discord-600 hover:bg-discord-700 text-white font-bold py-2 px-6 rounded-full text-sm transition-all duration-300 active:scale-95";
    ctaButton.textContent = "Explore Now";

    bannerContent.appendChild(sponsoredLabel);
    bannerContent.appendChild(title);
    bannerContent.appendChild(subtitle);
    bannerContent.appendChild(ctaButton);
    linkButton.appendChild(bannerContent);
    adContainer.appendChild(linkButton);
    container.appendChild(adContainer);

    return () => {
      loadedRef.current = false;
    };
  }, []);

  return (
    <div className="w-full flex justify-center py-6 overflow-hidden">
      <div ref={containerRef} className="w-full max-w-[1400px]" />
    </div>
  );
}

// Hook to open smart link programmatically (e.g., on episode change)
export function useAdsterraSmartLink() {
  const openSmartLink = () => {
    window.open(ADSTERRA_SMART_LINK, "_blank", "noopener,noreferrer");
  };

  return { openSmartLink };
}