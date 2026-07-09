import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CacheIssueBanner({ isOpen, onClose, onOpenCacheGuide }) {
    // Initialize synchronously to avoid flicker on first render
    const [imgSrc, setImgSrc] = useState(() => {
        return localStorage.getItem('cached_problem_img') || "/problem.jpg";
    });

    useEffect(() => {
        // Fetch and cache the image if not already cached
        if (!localStorage.getItem('cached_problem_img')) {
            fetch('/problem.jpg')
                .then(res => res.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result;
                        try {
                            localStorage.setItem('cached_problem_img', base64data);
                            setImgSrc(base64data);
                        } catch (e) {
                            console.error("Could not save image to localStorage:", e);
                        }
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(err => console.error("Failed to fetch problem image:", err));
        }
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative bg-[#1A1D24] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-w-[500px] w-full max-h-[95vh] animate-in zoom-in-95 duration-300">
                
                {/* Large Image on top */}
                <div className="w-full bg-black border-b border-white/10 relative shrink-0">
                    <img src={imgSrc} alt="Error Screen" className="w-full h-auto object-contain max-h-[180px] sm:max-h-[280px]" />
                    <button 
                        onClick={onClose}
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
                    </span>
                    
                    <button 
                        onClick={() => {
                            onClose();
                            onOpenCacheGuide();
                        }}
                        className="w-full text-sm font-bold bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-lg transition-colors shrink-0"
                    >
                        See How To Fix It Permanently
                    </button>
                </div>
            </div>
        </div>
    );
}
