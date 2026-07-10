import React, { useState, useEffect } from 'react';

const DEFAULT_SETTINGS = {
  fontColor: '#ffffff',
  fontOpacity: '1',
  fontSize: '24px',
  fontFamily: "'Inter', sans-serif",
  charEdge: '0px 0px 4px rgba(0,0,0,1), 0px 0px 6px rgba(0,0,0,1), 1.5px 1.5px 3px rgba(0,0,0,1), -1.5px -1.5px 3px rgba(0,0,0,1), 1.5px -1.5px 3px rgba(0,0,0,1), -1.5px 1.5px 3px rgba(0,0,0,1)',
  bgColor: 'transparent',
  windowColor: 'transparent',
  windowPadding: '0'
};

const SubtitleSettingsMenu = ({ onClose, onBack, containerRef }) => {
  const [activeMenu, setActiveMenu] = useState('main'); // 'main' or category name
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('anigo_advanced_subs_v2');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('anigo_advanced_subs_v2', JSON.stringify(settings));
    if (containerRef?.current) {
      const el = containerRef.current;
      el.style.setProperty('--sub-font-color', settings.fontColor);
      el.style.setProperty('--sub-font-opacity', settings.fontOpacity);
      el.style.setProperty('--sub-font-size', settings.fontSize);
      el.style.setProperty('--sub-font-family', settings.fontFamily);
      el.style.setProperty('--sub-char-edge', settings.charEdge);
      el.style.setProperty('--sub-bg-color', settings.bgColor);
      el.style.setProperty('--sub-window-color', settings.windowColor);
      el.style.setProperty('--sub-window-padding', settings.windowPadding);
    }
  }, [settings, containerRef]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setActiveMenu('main');
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setActiveMenu('main');
  };

  // --- Menu Configurations ---

  const MENUS = {
    fontColor: {
      title: 'Font Color',
      options: [
        { label: 'White', value: '#ffffff' },
        { label: 'Yellow', value: '#ffff00' },
        { label: 'Green', value: '#00ff00' },
        { label: 'Cyan', value: '#00ffff' },
        { label: 'Blue', value: '#0000ff' },
        { label: 'Magenta', value: '#ff00ff' },
        { label: 'Red', value: '#ff0000' },
        { label: 'Black', value: '#000000' }
      ]
    },
    fontOpacity: {
      title: 'Font Opacity',
      options: [
        { label: '25%', value: '0.25' },
        { label: '50%', value: '0.5' },
        { label: '75%', value: '0.75' },
        { label: '100%', value: '1' }
      ]
    },
    fontSize: {
      title: 'Font Size',
      options: [
        { label: '50%', value: '16px' },
        { label: '75%', value: '24px' },
        { label: '100%', value: '32px' },
        { label: '150%', value: '48px' },
        { label: '200%', value: '64px' }
      ]
    },
    fontFamily: {
      title: 'Font Family',
      options: [
        { label: 'Inter (Sans-Serif)', value: "'Inter', sans-serif" },
        { label: 'Arial', value: "Arial, sans-serif" },
        { label: 'Courier New', value: "'Courier New', monospace" },
        { label: 'Georgia', value: "Georgia, serif" },
        { label: 'Impact', value: "Impact, sans-serif" }
      ]
    },
    charEdge: {
      title: 'Character Edge',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Drop Shadow', value: '2px 2px 4px rgba(0,0,0,1)' },
        { label: 'Raised', value: '-1px -1px 0 #fff, 1px 1px 0 #000' },
        { label: 'Depressed', value: '1px 1px 0 #fff, -1px -1px 0 #000' },
        { label: 'Uniform (Stroke)', value: '0px 0px 4px rgba(0,0,0,1), 0px 0px 6px rgba(0,0,0,1), 1.5px 1.5px 3px rgba(0,0,0,1), -1.5px -1.5px 3px rgba(0,0,0,1), 1.5px -1.5px 3px rgba(0,0,0,1), -1.5px 1.5px 3px rgba(0,0,0,1)' }
      ]
    },
    bgColor: {
      title: 'Background Color',
      options: [
        { label: 'None', value: 'transparent' },
        { label: 'Black (Semi-Transparent)', value: 'rgba(0,0,0,0.75)' },
        { label: 'Black (Solid)', value: 'rgba(0,0,0,1)' },
        { label: 'White', value: 'rgba(255,255,255,0.75)' },
        { label: 'Red', value: 'rgba(255,0,0,0.75)' },
        { label: 'Blue', value: 'rgba(0,0,255,0.75)' }
      ]
    },
    windowColor: {
      title: 'Window Color',
      options: [
        { label: 'None', value: 'transparent', padding: '0' },
        { label: 'Black (Semi-Transparent)', value: 'rgba(0,0,0,0.5)', padding: '10px 20px' },
        { label: 'Black (Solid)', value: 'rgba(0,0,0,1)', padding: '10px 20px' }
      ]
    }
  };

  const currentMenuObj = MENUS[activeMenu];

  return (
    <div className="sub-settings-overlay" onClick={onClose}>
      <div className="sub-settings-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sub-settings-header">
          {activeMenu !== 'main' ? (
            <>
              <button onClick={() => setActiveMenu('main')} style={{ marginRight: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span>{currentMenuObj.title}</span>
            </>
          ) : (
            <>
              <button onClick={onBack} style={{ marginRight: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span>Subtitle Settings</span>
            </>
          )}
          <button style={{ marginLeft: 'auto' }} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="sub-settings-body">
          {activeMenu === 'main' ? (
            <>
              {Object.keys(MENUS).map(key => {
                const menu = MENUS[key];
                const currentOpt = menu.options.find(o => o.value === settings[key]) || menu.options[0];
                return (
                  <div key={key} className="sub-settings-item" onClick={() => setActiveMenu(key)}>
                    <span>{menu.title}</span>
                    <div className="sub-settings-val">
                      {currentOpt.label}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                );
              })}
              <button className="sub-settings-reset" onClick={resetSettings}>
                Reset
              </button>
            </>
          ) : (
            currentMenuObj.options.map(opt => (
              <div
                key={opt.label}
                className={`sub-settings-option ${settings[activeMenu] === opt.value ? 'selected' : ''}`}
                onClick={() => {
                  updateSetting(activeMenu, opt.value);
                  if (opt.padding !== undefined) {
                    setSettings(prev => ({ ...prev, windowPadding: opt.padding }));
                  }
                }}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default SubtitleSettingsMenu;
