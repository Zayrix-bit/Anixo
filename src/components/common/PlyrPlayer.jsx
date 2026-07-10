import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Plyr from 'plyr';
import Hls from 'hls.js';
import './plyr-custom.css';
import SubtitleSettingsMenu from './SubtitleSettingsMenu';
import CustomPlyrMenu from './CustomPlyrMenu';

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
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  const [showCustomMenu, setShowCustomMenu] = useState(false);
  const [plyrContainer, setPlyrContainer] = useState(null);
  const [plyrInstance, setPlyrInstance] = useState(null);
  const [hlsInstance, setHlsInstance] = useState(null);
  const [duration, setDuration] = useState(0);
  const [progressContainer, setProgressContainer] = useState(null);

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
          'settings', 'airplay', 'fullscreen'
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
        tooltips: { controls: false, seek: false },
        doubleClick: { togglesFullscreen: false },
        clickToPlay: false
      });
      setPlyrInstance(plyrRef.current);

      const injectSetting = () => {
        if (!plyrRef.current) return;
        const container = plyrRef.current.elements.container;
        if (!container) return;
        
        container.classList.add('hide-native-menu');
        
        const settingsBtn = container.querySelector('[data-plyr="settings"]');
        if (settingsBtn && !settingsBtn.dataset.customized) {
          settingsBtn.dataset.customized = 'true';
          settingsBtn.addEventListener('click', () => {
            // Toggle our custom menu
            setShowCustomMenu(prev => !prev);
            setShowSubtitleSettings(false);
          });
        }
        
        const progress = container.querySelector('.plyr__progress');
        if (progress && !progress.dataset.markerBound) {
          progress.dataset.markerBound = 'true';
          setProgressContainer(progress);
        }
      };

      plyrRef.current.on('ready', () => {
        injectSetting();
        if (plyrRef.current && plyrRef.current.elements.container) {
          setPlyrContainer(plyrRef.current.elements.container);
        }

        let lastControlsShownTime = 0;
        plyrRef.current.on('controlsshown', () => {
          lastControlsShownTime = Date.now();
          if (plyrRef.current.elements.container) {
            plyrRef.current.elements.container.classList.remove('force-hide-controls');
          }
        });

        // Custom tap handling (Single tap to toggle controls, Double tap to seek)
        const wrapper = plyrRef.current.elements.wrapper;
        if (wrapper && !wrapper.dataset.dblclickBound) {
          wrapper.dataset.dblclickBound = 'true';
          let lastClickTime = 0;
          let clickTimeout = null;
          
          // Prevent Plyr's native dblclick (which toggles fullscreen) robustly
          const container = plyrRef.current.elements.container;
          if (container) {
            container.addEventListener('dblclick', (e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
            }, true); // Use capture phase to intercept before Plyr
          }

          wrapper.addEventListener('click', (e) => {
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - lastClickTime;
            
            if (timeDiff > 0 && timeDiff < 300) {
              // Double click detected
              clearTimeout(clickTimeout);
              
              const showSeekEffect = (direction) => {
                wrapper.querySelectorAll('.seek-effect').forEach(el => el.remove());
                const effect = document.createElement('div');
                effect.className = `seek-effect seek-effect-${direction}`;
                const icon = direction === 'left' 
                  ? '<svg viewBox="0 0 24 24" fill="white"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>'
                  : '<svg viewBox="0 0 24 24" fill="white"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>';
                effect.innerHTML = `${icon}<span>10s</span>`;
                wrapper.appendChild(effect);
                setTimeout(() => {
                  if (effect.parentNode === wrapper) wrapper.removeChild(effect);
                }, 500);
              };

              const rect = wrapper.getBoundingClientRect();
              const x = e.clientX - rect.left;
              if (x < rect.width / 2) {
                plyrRef.current.rewind(10);
                showSeekEffect('left');
              } else {
                plyrRef.current.forward(10);
                showSeekEffect('right');
              }
            } else {
              // Single click (wait to see if it becomes a double click)
              clickTimeout = setTimeout(() => {
                if (plyrRef.current && plyrRef.current.elements.container) {
                  // If controls were shown in the last 500ms, it means Plyr's native touch 
                  // event JUST showed them due to this tap. We should keep them shown.
                  // If they were already showing for a while, this tap is meant to hide them.
                  if (Date.now() - lastControlsShownTime > 500) {
                    plyrRef.current.elements.container.classList.add('force-hide-controls');
                    plyrRef.current.toggleControls(false);
                  }
                }
              }, 300);
            }
            lastClickTime = currentTime;
          });
        }
      });

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
      
      plyrRef.current.on('loadedmetadata', () => {
        setDuration(plyrRef.current.duration);
      });
      plyrRef.current.on('durationchange', () => {
        setDuration(plyrRef.current.duration);
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

      plyrRef.current.on('enterfullscreen', () => {
        try {
          if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
            window.screen.orientation.lock('landscape').catch((e) => console.log('Orientation lock error:', e));
          }
        } catch (error) {
          console.log('Orientation API not supported', error);
        }
      });

      plyrRef.current.on('exitfullscreen', () => {
        try {
          if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
            window.screen.orientation.unlock();
          }
        } catch (error) {
          console.log('Orientation unlock error', error);
        }
      });

      if (propsRef.current.onReady) propsRef.current.onReady();
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 60, // Keep 60s buffered ahead
        maxMaxBufferLength: 600, // Hard limit to avoid memory bloat
        maxBufferSize: 60 * 1024 * 1024, // Max 60MB RAM usage
        enableWorker: true,
        lowLatencyMode: false,
        // Safe Slow Internet Optimizations
        fragLoadingTimeOut: 20000, 
        fragLoadingMaxRetry: 6, 
        fragLoadingRetryDelay: 1000, 
        levelLoadingTimeOut: 20000,
        levelLoadingMaxRetry: 6,
        // Removed capLevelToPlayerSize as it can break video if player size is temporarily 0 during render
      });
      hlsRef.current = hls;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHlsInstance(hls);

      hls.attachMedia(video);
      
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(src);
      });
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        initPlyr();
      });

      let networkErrorCount = 0;
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (networkErrorCount < 5) {
                networkErrorCount++;
                console.warn(`HLS Network Error, retrying... (${networkErrorCount}/5)`);
                hls.startLoad();
              } else {
                console.error("HLS Network Error limit reached.");
                hls.destroy(); // Give up to prevent infinite freeze
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("HLS Media Error, attempting recovery...");
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
      
      {showCustomMenu && plyrContainer && createPortal(
        <CustomPlyrMenu
          plyr={plyrInstance}
          hls={hlsInstance}
          subtitles={subtitles}
          onClose={() => setShowCustomMenu(false)}
          onOpenAdvancedSubs={() => {
            setShowCustomMenu(false);
            setShowSubtitleSettings(true);
          }}
        />,
        plyrContainer
      )}

      {showSubtitleSettings && plyrContainer && createPortal(
        <SubtitleSettingsMenu 
          onClose={() => setShowSubtitleSettings(false)} 
          onBack={() => {
            setShowSubtitleSettings(false);
            setShowCustomMenu(true);
          }}
          containerRef={containerRef} 
        />,
        plyrContainer
      )}

      {activeSkip && plyrContainer && createPortal(
        <div className="aniskip-btn show" onClick={handleSkip}>
          <span>{activeSkip.label}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4"></polygon>
            <line x1="19" y1="5" x2="19" y2="19"></line>
          </svg>
        </div>,
        plyrContainer
      )}
      
      {progressContainer && duration > 0 && skipTimes && createPortal(
        <>
          {skipTimes.op && (
            <div className="skip-marker op-marker" style={{
              left: `${(skipTimes.op[0] / duration) * 100}%`,
              width: `${((skipTimes.op[1] - skipTimes.op[0]) / duration) * 100}%`
            }} />
          )}
          {skipTimes.ed && (
            <div className="skip-marker ed-marker" style={{
              left: `${(skipTimes.ed[0] / duration) * 100}%`,
              width: `${((skipTimes.ed[1] - skipTimes.ed[0]) / duration) * 100}%`
            }} />
          )}
        </>,
        progressContainer
      )}
    </div>
  );
};

export default PlyrPlayer;
