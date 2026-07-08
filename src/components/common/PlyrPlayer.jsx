import React, { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr';
import Hls from 'hls.js';
import './plyr-custom.css';
import SubtitleSettingsMenu from './SubtitleSettingsMenu';

const PlyrPlayer = ({ 
  src, 
  type, 
  poster, 
  subtitles = [], 
  onEnded, 
  onTimeUpdate, 
  onReady, 
  initialTime = 0, 
  className, 
  skipTimes 
}) => {
  const videoRef = useRef(null);
  const plyrRef = useRef(null);
  const hlsRef = useRef(null);
  const observerRef = useRef(null);
  const containerRef = useRef(null);
  
  const [activeSkip, setActiveSkip] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Keep latest props in a ref so they don't trigger re-initialization
  const propsRef = useRef({ onEnded, onReady, onTimeUpdate, skipTimes, subtitles });
  useEffect(() => {
    propsRef.current = { onEnded, onReady, onTimeUpdate, skipTimes, subtitles };
  }, [onEnded, onReady, onTimeUpdate, skipTimes, subtitles]);

  useEffect(() => {
    if (!src || !videoRef.current) return;

    const video = videoRef.current;
    const isHls = type === 'hls' || src.includes('.m3u8');
    
    const initPlyr = () => {
      if (plyrRef.current) {
        plyrRef.current.destroy();
      }
      
      const qualityOptions = hlsRef.current ? [0, ...hlsRef.current.levels.map(l => l.height)] : [0];

      plyrRef.current = new Plyr(video, {
        controls: [
          'play-large', 'progress', 'play', 'mute', 'volume', 
          'current-time', 'duration', 'rewind', 'fast-forward', 
          'settings', 'pip', 'airplay', 'fullscreen'
        ],
        settings: ['captions', 'quality', 'speed'],
        quality: {
          default: 0,
          options: qualityOptions,
          forced: true,
          onChange: (newQuality) => {
            if (!hlsRef.current) return;
            if (newQuality === 0) {
              hlsRef.current.currentLevel = -1;
            } else {
              hlsRef.current.levels.forEach((level, idx) => {
                if (level.height === newQuality) hlsRef.current.currentLevel = idx;
              });
            }
          }
        },
        i18n: { qualityLabel: { 0: 'Auto' } },
        keyboard: { focused: true, global: true },
        tooltips: { controls: true, seek: true }
      });

      const injectSetting = () => {
        if (!plyrRef.current) return;
        const container = plyrRef.current.elements.container;
        if (!container) return;
        
        // Find the inner menu wrapper
        const homeMenu = container.querySelector('.plyr__menu__container [role="menu"]') || container.querySelector('.plyr__menu__container > div > div');
        if (!homeMenu) return;
        
        if (!homeMenu.querySelector('.custom-sub-btn')) {
          const btn = document.createElement('button');
          btn.type = 'button';
          // Added plyr__control--forward to render the native chevron arrow
          btn.className = 'plyr__control plyr__control--forward custom-sub-btn';
          btn.setAttribute('role', 'menuitem');
          btn.setAttribute('aria-haspopup', 'true');
          btn.innerHTML = `<span>Subtitle Settings<span class="plyr__menu__value">Custom</span></span>`;
          
          btn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            // Close Plyr's menu
            plyrRef.current.toggleControls(false);
            // Open our advanced custom menu
            setShowSettings(true);
          };
          
          // Insert after the first item (Quality/Captions) to make it look native
          if (homeMenu.children.length > 1) {
            homeMenu.insertBefore(btn, homeMenu.children[1]);
          } else {
            homeMenu.appendChild(btn);
          }
        }
      };

      plyrRef.current.on('ready', injectSetting);

      // Use a MutationObserver to re-inject if Plyr dynamically rebuilds the menu (e.g., Quality levels loaded)
      const controls = plyrRef.current.elements.controls;
      if (controls) {
        if (observerRef.current) observerRef.current.disconnect();
        const observer = new MutationObserver(() => injectSetting());
        observer.observe(controls, { childList: true, subtree: true });
        observerRef.current = observer;
      }

      if (initialTime > 0) {
        plyrRef.current.once('canplay', () => {
          plyrRef.current.currentTime = initialTime;
        });
      }

      plyrRef.current.on('ended', () => {
        if (propsRef.current.onEnded) propsRef.current.onEnded();
      });
      
      plyrRef.current.on('timeupdate', () => {
        if (propsRef.current.onTimeUpdate) {
          propsRef.current.onTimeUpdate(plyrRef.current.currentTime);
        }

        const currentSkipTimes = propsRef.current.skipTimes;
        if (!currentSkipTimes) {
          setActiveSkip(null);
          return;
        }

        const currentTime = plyrRef.current.currentTime;
        let currentSkipSegment = null;

        if (currentSkipTimes.op && currentTime >= currentSkipTimes.op[0] && currentTime <= currentSkipTimes.op[1]) {
          currentSkipSegment = { end: currentSkipTimes.op[1], label: 'Skip Intro' };
        } else if (currentSkipTimes.ed && currentTime >= currentSkipTimes.ed[0] && currentTime <= currentSkipTimes.ed[1]) {
          currentSkipSegment = { end: currentSkipTimes.ed[1], label: 'Skip Ending' };
        } else if (currentSkipTimes.recap && currentTime >= currentSkipTimes.recap[0] && currentTime <= currentSkipTimes.recap[1]) {
          currentSkipSegment = { end: currentSkipTimes.recap[1], label: 'Skip Recap' };
        }

        setActiveSkip(currentSkipSegment);
      });

      if (propsRef.current.onReady) propsRef.current.onReady();
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true
      });
      hlsRef.current = hls;

      hls.attachMedia(video);
      
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(src);
      });
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        initPlyr();
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else {
      video.src = src;
      initPlyr();
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (plyrRef.current) {
        plyrRef.current.destroy();
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [src, type, initialTime]);

  const handleSkip = () => {
    if (activeSkip && plyrRef.current) {
      plyrRef.current.currentTime = activeSkip.end;
      setActiveSkip(null);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-black rounded-[10px] overflow-hidden custom-subs-enabled ${className || ''}`}>
      <video
        ref={videoRef}
        crossOrigin="anonymous"
        playsInline
        poster={poster}
        className="w-full h-full"
      >
        {subtitles && subtitles.slice(0, 10).map((sub, i) => (
          <track
            key={i}
            kind="subtitles"
            label={sub.label || `Track ${i + 1}`}
            srcLang={sub.language || 'und'}
            src={sub.url || sub.file}
            default={sub.default || sub.isDefault || i === 0}
          />
        ))}
      </video>
      
      {showSettings && (
        <SubtitleSettingsMenu 
          onClose={() => setShowSettings(false)} 
          containerRef={containerRef} 
        />
      )}

      {activeSkip && (
        <div className="aniskip-btn show" onClick={handleSkip}>
          <span>{activeSkip.label}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4"></polygon>
            <line x1="19" y1="5" x2="19" y2="19"></line>
          </svg>
        </div>
      )}
    </div>
  );
};

export default PlyrPlayer;
