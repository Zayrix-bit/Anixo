import React, { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr';
import Hls from 'hls.js';
import './plyr-custom.css';

const PlyrPlayer = ({ 
  src, type, poster, subtitles = [], onEnded, onTimeUpdate, onReady, 
  initialTime = 0, className, skipTimes
}) => {
  const videoRef = useRef(null);
  const plyrRef = useRef(null);
  const hlsRef = useRef(null);
  const [activeSkip, setActiveSkip] = useState(null);

  useEffect(() => {
    if (!src) return;

    const video = videoRef.current;
    if (!video) return;

    const isHls = type === 'hls' || src.includes('.m3u8');
    
    // Subtitles setup
    const defaultSub = subtitles.find(s => s.isDefault || s.lang?.toLowerCase().includes('en'));

    const initPlyr = () => {
      if (plyrRef.current) plyrRef.current.destroy();
      
      plyrRef.current = new Plyr(video, {
        controls: [
          'play-large', 'play', 'rewind', 'fast-forward', 
          'progress', 'current-time', 'duration', 
          'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
        ],
        settings: ['captions', 'quality', 'speed'],
        captions: { 
          active: !!defaultSub,
          language: defaultSub ? (defaultSub.lang?.substring(0, 2).toLowerCase() || 'en') : 'auto',
          update: false 
        },
        keyboard: { focused: true, global: true },
        tooltips: { controls: true, seek: true }
      });

      if (initialTime > 0) {
        plyrRef.current.once('canplay', () => {
          plyrRef.current.currentTime = initialTime;
        });
      }

      if (onEnded) plyrRef.current.on('ended', onEnded);
      if (onTimeUpdate) plyrRef.current.on('timeupdate', () => onTimeUpdate(plyrRef.current.currentTime));
      if (onReady) onReady();

      // AniSkip logic
      plyrRef.current.on('timeupdate', () => {
        if (!skipTimes) {
          setActiveSkip(null);
          return;
        }

        const currentTime = plyrRef.current.currentTime;
        let currentSkipSegment = null;

        if (skipTimes.op && skipTimes.op.length === 2 && currentTime >= skipTimes.op[0] && currentTime <= skipTimes.op[1]) {
          currentSkipSegment = { type: 'op', end: skipTimes.op[1], label: 'Skip Intro' };
        } else if (skipTimes.ed && skipTimes.ed.length === 2 && currentTime >= skipTimes.ed[0] && currentTime <= skipTimes.ed[1]) {
          currentSkipSegment = { type: 'ed', end: skipTimes.ed[1], label: 'Skip Ending' };
        } else if (skipTimes.recap && skipTimes.recap.length === 2 && currentTime >= skipTimes.recap[0] && currentTime <= skipTimes.recap[1]) {
          currentSkipSegment = { type: 'recap', end: skipTimes.recap[1], label: 'Skip Recap' };
        }

        setActiveSkip(currentSkipSegment);
      });
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        initPlyr();
      });

      // Robust Error Handling for Stream Stability
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("HLS Network Error, attempting to recover...", data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("HLS Media Error, attempting to recover...", data);
              hls.recoverMediaError();
              break;
            default:
              console.error("HLS Fatal Error, cannot recover.", data);
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
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      if (plyrRef.current) {
        plyrRef.current.destroy();
      }
    };
  }, [src, type, initialTime, onEnded, onReady, onTimeUpdate, skipTimes, subtitles]);

  const handleSkip = () => {
    if (activeSkip && plyrRef.current) {
      plyrRef.current.currentTime = activeSkip.end;
      setActiveSkip(null);
    }
  };

  return (
    <div className={`relative w-full h-full bg-black rounded-[10px] overflow-hidden ${className || ''}`}>
      <video
        ref={videoRef}
        crossOrigin="anonymous"
        playsInline
        poster={poster}
        className="w-full h-full"
      >
        {subtitles && subtitles.map((sub, idx) => (
          <track
            key={idx}
            kind="captions"
            label={sub.lang || `Subtitle ${idx + 1}`}
            srcLang={sub.lang ? sub.lang.substring(0, 2).toLowerCase() : 'en'}
            src={sub.url}
            default={sub.isDefault || (sub.lang?.toLowerCase().includes('en') && idx === 0)}
          />
        ))}
      </video>
      
      {activeSkip && (
        <div 
          className="aniskip-btn show"
          onClick={handleSkip}
        >
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
