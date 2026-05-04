import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useNavigate } from "react-router-dom";

export default function AnimeCard({ anime }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);
  const [imgError, setImgError] = useState(false);
  const { getTitle } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: "100px", // Load slightly before it enters the screen
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) observer.unobserve(cardRef.current);
    };
  }, []);

  if (!anime) return null;

  // Logic for accurate episode progress: released / total
  const totalEpisodes = anime.episodes || "?";
  let releasedEpisodes = 0;

  // IMPROVED LOGIC: Even if status is missing, if nextAiringEpisode exists, it's RELEASING
  const isReleasing = anime.status === "RELEASING" || !!anime.nextAiringEpisode;

  if (isReleasing) {
    if (anime.nextAiringEpisode) {
      // For airing anime, released is (next episode - 1)
      releasedEpisodes = Math.max(0, anime.nextAiringEpisode.episode - 1);
    } else {
      // If we don't have airing info (AniList down), show ? to avoid lying
      releasedEpisodes = "?";
    }
  } else {
    // For finished or not yet released, use the total episodes field
    releasedEpisodes = anime.episodes || 0;
  }

  // For Anikai results, we often don't have total episodes, so showing "12/12" is misleading if it's airing.
  // If it's Anikai and we only have one number, we'll treat it as current count.
  const showTotal = !anime.isAnikai && totalEpisodes !== "?";
  const format = anime.format || "TV";

  return (
    <div
      ref={cardRef}
      className={`w-full cursor-pointer group flex flex-col transition-[opacity,transform] duration-500 ease-out will-change-[opacity,transform] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
      onClick={() => {
        const resumeParams = anime.isProgress ? `&ep=${anime.episode}&t=${anime.currentTime}` : "";
        navigate(`/watch/${anime.id}${anime.isMAL ? "?mal=true" : "?"}${resumeParams}`);
      }}
    >
      {/* Poster image area with wrapping for jutting tags */}
      <div className="relative">
        {/* Stacked Tags (Aligned to Left Corner) */}
        {!anime.isProgress && (
          <div className="absolute -top-1 left-0 flex flex-col items-start z-40 gap-1">
            <div className="bg-red-600 text-white text-[9px] font-black px-1.5 py-[3px] flex items-center justify-center min-w-[28px]">
              {format}
            </div>
          </div>
        )}

        {/* 18+ Badge (Top Right Corner - Professional Red) */}
        {(anime.isAdult || anime.ageRating === "R" || anime.rating?.includes("18")) && (
          <div className="absolute top-1.5 right-1.5 z-40 bg-red-600/90 text-white text-[10px] font-black px-1.5 py-[2px] rounded-[4px] shadow-lg flex items-center justify-center border border-white/10 tracking-widest">
            18+
          </div>
        )}

        {/* Poster image container */}
        <div className="relative w-full aspect-[2/3] overflow-hidden rounded-2xl bg-[#181818] border border-white/5 shadow-lg group-hover:shadow-2xl transition-[transform,shadow] duration-500 group-hover:-translate-y-1" style={{ transform: 'translateZ(0)' }}>
          {isVisible && !imgError ? (
            <img
              src={anime.coverImage?.extraLarge || anime.coverImage?.large}
              alt={getTitle(anime.title)}
              loading="lazy"
              onError={() => setImgError(true)}
              onLoad={(e) => e.target.classList.remove("opacity-0")}
              className="w-full h-full object-cover opacity-0 transition-[opacity,transform] duration-700 ease-out group-hover:scale-105"
            />
          ) : !isVisible ? (
            <div className="w-full h-full bg-[#111] animate-pulse" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#111] text-white/10 p-4 text-center">
              <svg className="w-8 h-8 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Missing Cover</span>
            </div>
          )}

          {/* Gradient Overlay removed as requested */}

          {/* Continue Watching Overlay - Sleek Premium Design */}
          {anime.isProgress && (
            <>
              {/* Bottom Gradient for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-30" />
              
              <div className="absolute inset-x-0 bottom-0 p-3 pb-4 z-40 flex flex-col gap-1 pointer-events-none">
                <h3 className="text-[13px] font-bold text-white line-clamp-1 tracking-tight">
                  {getTitle(anime.title)}
                </h3>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest">
                    Episode {anime.episode}
                  </span>
                  <span className="text-[10px] text-white/60 font-semibold">
                    {Math.floor(anime.currentTime / 60)}m left
                  </span>
                </div>
              </div>

              {/* Real-time Progress Bar at Absolute Bottom */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-50">
                 <div 
                   className="h-full bg-red-600 rounded-r-full" 
                   style={{ 
                     width: `${anime.duration ? Math.min(100, (anime.currentTime / anime.duration) * 100) : Math.min(100, (anime.currentTime / 1440) * 100)}%` 
                   }}
                 />
              </div>
            </>
          )}

          {/* Hover overlay with Play Icon */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-50">
            <div className="bg-white text-black p-3 rounded-2xl scale-75 group-hover:scale-100 transition-transform duration-500 shadow-2xl">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section (For non-progress items) */}
      {!anime.isProgress && (
        <>
          <div className="flex justify-center -mt-[14px] relative z-40">
            <div className="flex items-stretch bg-[#0a0a0a] rounded-[4px] border border-white/10 overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
              <span className="text-[9px] font-black bg-red-600 text-white px-2 uppercase tracking-tighter flex items-center justify-center">EP</span>
              <div className="px-2 py-1 flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-white">{releasedEpisodes || "0"}</span>
                {showTotal && (
                  <span className="text-[10px] font-bold text-white/30">/ {totalEpisodes}</span>
                )}
              </div>
            </div>
          </div>
          <div className="w-full mt-3 text-center px-1">
            <h3 className="text-[13px] font-medium text-white/80 group-hover:text-white transition-colors line-clamp-2 leading-tight uppercase tracking-tight">
              {getTitle(anime.title)}
            </h3>
          </div>
        </>
      )}
    </div>
  );
}
