import React, { useState, useEffect } from 'react';
import Hls from 'hls.js';
import './CustomPlyrMenu.css';

const CustomPlyrMenu = ({ plyr, hls, subtitles = [], onClose, onOpenAdvancedSubs }) => {
  const [activeTab, setActiveTab] = useState('captions'); // 'quality', 'captions', 'speed'
  
  const [currentQuality, setCurrentQuality] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [currentCaption, setCurrentCaption] = useState(-1);
  const [qualities, setQualities] = useState([]);
  const [autoQuality, setAutoQuality] = useState(null);

  useEffect(() => {
    if (!plyr) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentSpeed(plyr.speed || 1);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentCaption(plyr.currentTrack ?? -1);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentQuality(plyr.quality || 0);

    const updateQualities = () => {
      let qOpts = [0];
      if (hls && hls.levels && hls.levels.length > 0) {
        // use Set to remove duplicate heights if any, and sort descending
        const heights = Array.from(new Set(hls.levels.map(l => l.height))).sort((a, b) => b - a);
        qOpts = [0, ...heights];
      } else if (plyr.config?.quality?.options) {
        qOpts = plyr.config.quality.options;
      }
      setQualities(qOpts);
    };

    updateQualities();

    const handleLevelSwitched = (e, data) => {
      if (hls && hls.levels && hls.levels[data.level]) {
        setAutoQuality(hls.levels[data.level].height);
      }
    };

    if (hls) {
      hls.on(Hls.Events.MANIFEST_PARSED, updateQualities);
      hls.on(Hls.Events.LEVEL_UPDATED, updateQualities);
      hls.on(Hls.Events.LEVEL_SWITCHED, handleLevelSwitched);
      
      // Initial value if already switched
      if (hls.currentLevel !== -1 && hls.levels && hls.levels[hls.currentLevel]) {
        setAutoQuality(hls.levels[hls.currentLevel].height);
      }
    }

    const handleQuality = (e) => setCurrentQuality(e.detail.plyr.quality);
    const handleSpeed = (e) => setCurrentSpeed(e.detail.plyr.speed);
    const handleCaption = () => setCurrentCaption(plyr.currentTrack ?? -1);

    plyr.on('qualitychange', handleQuality);
    plyr.on('ratechange', handleSpeed);
    plyr.on('languagechange', handleCaption);
    plyr.on('captionsenabled', handleCaption);
    plyr.on('captionsdisabled', handleCaption);

    return () => {
      if (hls) {
        hls.off(Hls.Events.MANIFEST_PARSED, updateQualities);
        hls.off(Hls.Events.LEVEL_UPDATED, updateQualities);
        hls.off(Hls.Events.LEVEL_SWITCHED, handleLevelSwitched);
      }
      plyr.off('qualitychange', handleQuality);
      plyr.off('ratechange', handleSpeed);
      plyr.off('languagechange', handleCaption);
      plyr.off('captionsenabled', handleCaption);
      plyr.off('captionsdisabled', handleCaption);
    };
  }, [plyr, hls]);

  const handleSetQuality = (q) => {
    // eslint-disable-next-line react-hooks/immutability
    if (plyr) plyr.quality = q;
    
    if (hls) {
      if (q === 0) {
        // eslint-disable-next-line react-hooks/immutability
        hls.currentLevel = -1;
      } else {
        const levelIndex = hls.levels.findIndex(l => l.height === q);
        if (levelIndex !== -1) hls.currentLevel = levelIndex;
      }
    }
  };

  const handleSetSpeed = (s) => {
    // eslint-disable-next-line react-hooks/immutability
    if (plyr) plyr.speed = s;
  };

  const handleSetCaption = (index) => {
    if (!plyr) return;
    if (index === -1) {
      plyr.toggleCaptions(false);
    } else {
      plyr.toggleCaptions(true);
      // eslint-disable-next-line react-hooks/immutability
      plyr.currentTrack = index;
    }
    setCurrentCaption(index);
  };

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div className="custom-plyr-menu-wrapper" onClick={(e) => e.stopPropagation()}>
      <div className="custom-plyr-menu-header">
        <button className={activeTab === 'quality' ? 'active' : ''} onClick={() => setActiveTab('quality')} title="Quality">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </button>
        <button className={activeTab === 'captions' ? 'active' : ''} onClick={() => setActiveTab('captions')} title="Captions">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-4a1 1 0 011-1h3a1 1 0 011 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1a1 1 0 01-1 1h-3a1 1 0 01-1-1v-4a1 1 0 011-1h3a1 1 0 011 1v1z" />
          </svg>
        </button>
        <button className={activeTab === 'speed' ? 'active' : ''} onClick={() => setActiveTab('speed')} title="Speed">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0012 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
          </svg>
        </button>
        <button onClick={onClose} title="Close" className="close-btn" style={{ marginLeft: 'auto' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      <div className="custom-plyr-menu-content">
        {activeTab === 'quality' && (
          <ul className="custom-plyr-list">
            {qualities.map(q => (
              <li key={q}>
                <button 
                  className={currentQuality === q ? 'active' : ''} 
                  onClick={() => handleSetQuality(q)}
                >
                  <span className="radio-circle"></span>
                  {q === 0 ? `Auto${currentQuality === 0 && autoQuality ? ` (${autoQuality}p)` : ''}` : `${q}p`}
                  {q >= 720 && <span className="hd-tag">HD</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {activeTab === 'captions' && (
          <div className="custom-plyr-list-wrapper">
            <div className="advanced-subs-container">
              <button className="advanced-subs-btn" onClick={onOpenAdvancedSubs}>
                Settings
              </button>
            </div>
            <ul className="custom-plyr-list">
              <li>
                <button 
                  className={currentCaption === -1 ? 'active' : ''} 
                  onClick={() => handleSetCaption(-1)}
                >
                  <span className="radio-circle"></span>
                  Off
                </button>
              </li>
              {subtitles.map((sub, index) => (
                <li key={index}>
                  <button 
                    className={currentCaption === index ? 'active' : ''} 
                    onClick={() => handleSetCaption(index)}
                  >
                    <span className="radio-circle"></span>
                    {sub.label || sub.lang || sub.language || `Track ${index + 1}`}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'speed' && (
          <ul className="custom-plyr-list">
            {speedOptions.map(s => (
              <li key={s}>
                <button 
                  className={currentSpeed === s ? 'active' : ''} 
                  onClick={() => handleSetSpeed(s)}
                >
                  <span className="radio-circle"></span>
                  {s === 1 ? 'Normal' : `${s}x`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CustomPlyrMenu;
