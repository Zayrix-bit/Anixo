import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ChevronRight } from 'lucide-react';
import CacheGuideModal from './CacheGuideModal';

export default function CacheIssueBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const isDismissed = localStorage.getItem('cache_banner_dismissed');
        if (!isDismissed) {
            // Slight delay so it slides in nicely after initial load
            setTimeout(() => setIsVisible(true), 1500);
        }
    }, []);

    const dismissBanner = () => {
        setIsVisible(false);
        localStorage.setItem('cache_banner_dismissed', 'true');
    };

    return (
        <>
            {isVisible && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] animate-in zoom-in-95 fade-in duration-300 w-[95vw] sm:w-[92vw] max-w-[500px]">
                    <div className="bg-[#1A1D24] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                        
                        {/* Large Image on top */}
                        <div className="w-full bg-black border-b border-white/10 relative shrink-0">
                            <img src="/problem.jpg" alt="Error Screen" className="w-full h-auto object-contain max-h-[180px] sm:max-h-[280px]" />
                            <button 
                                onClick={dismissBanner}
                                className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white/70 hover:text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        {/* Text and Button below */}
                        <div className="p-4 sm:p-5 flex flex-col items-center text-center overflow-y-auto custom-scrollbar">
                            <span className="text-base sm:text-lg font-bold text-white mb-2">Facing this exact error?</span>
                            <span className="text-xs sm:text-sm text-white/50 mb-4 sm:mb-5 leading-relaxed">
                                If you see a black screen saying "Failed to fetch module", your browser is trying to load an old cached version of the site.
                                <br className="hidden sm:block"/><br className="hidden sm:block"/>
                                <span className="mt-2 sm:mt-0 block">
                                    You can fix this by clicking the button below, or anytime by clicking the <strong className="text-white/80">"Clear Cache Guide"</strong> link located in the website Footer.
                                </span>
                            </span>
                            
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="w-full text-sm font-bold bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-lg transition-colors shrink-0"
                            >
                                See How To Fix It Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CacheGuideModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </>
    );
}
