import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PopunderContext = createContext();

export function PopunderProvider({ children }) {
  const [isPopunderDisabled, setIsPopunderDisabled] = useState(false);
  const [cooldownEndsAt, setCooldownEndsAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  // Load state from localStorage on mount
  useEffect(() => {
    const savedEndTime = localStorage.getItem('popunderCooldownEndsAt');
    if (savedEndTime) {
      const endTime = parseInt(savedEndTime, 10);
      if (Date.now() < endTime) {
        setIsPopunderDisabled(true);
        setCooldownEndsAt(endTime);
      } else {
        // Cooldown expired, clear storage
        localStorage.removeItem('popunderCooldownEndsAt');
      }
    }
  }, []);

  // Update time left every second
  useEffect(() => {
    if (!cooldownEndsAt) {
      setTimeLeft('');
      return;
    }

    const updateTimeLeft = () => {
      const now = Date.now();
      const diff = cooldownEndsAt - now;

      if (diff <= 0) {
        setIsPopunderDisabled(false);
        setCooldownEndsAt(null);
        setTimeLeft('');
        localStorage.removeItem('popunderCooldownEndsAt');
        return;
      }

      // Format time: HH:MM:SS or MM:SS
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [cooldownEndsAt]);

  // Global popup blocker
  useEffect(() => {
    if (!isPopunderDisabled) return;

    // Save original window.open
    const originalOpen = window.open;

    // Block all popups
    window.open = function() {
      console.log('Popup blocked by user request');
      return null;
    };

    // Also block click events that might trigger popups
    const blockPopups = (e) => {
      // We can't prevent all, but log it
      console.log('Popup attempt blocked');
    };

    // Also try to remove any ad scripts that might have loaded
    const removeAdScripts = () => {
      const adScripts = document.querySelectorAll('script[src*="dependedunmoved"], script[src*="highperformanceformat"]');
      adScripts.forEach(script => script.remove());
    };

    removeAdScripts();
    document.addEventListener('click', blockPopups, { capture: true });

    return () => {
      window.open = originalOpen;
      document.removeEventListener('click', blockPopups, { capture: true });
    };
  }, [isPopunderDisabled]);

  // Disable popunder for 1 hour
  const disablePopunderForHour = useCallback(() => {
    const oneHourMs = 60 * 60 * 1000;
    const endTime = Date.now() + oneHourMs;
    setIsPopunderDisabled(true);
    setCooldownEndsAt(endTime);
    localStorage.setItem('popunderCooldownEndsAt', endTime.toString());

    // Also try to remove existing ad scripts immediately
    const adScripts = document.querySelectorAll('script[src*="dependedunmoved"], script[src*="highperformanceformat"]');
    adScripts.forEach(script => script.remove());
  }, []);

  return (
    <PopunderContext.Provider value={{
      isPopunderDisabled,
      cooldownEndsAt,
      timeLeft,
      disablePopunderForHour
    }}>
      {children}
    </PopunderContext.Provider>
  );
}

export function usePopunder() {
  const context = useContext(PopunderContext);
  if (!context) {
    throw new Error('usePopunder must be used within a PopunderProvider');
  }
  return context;
}
