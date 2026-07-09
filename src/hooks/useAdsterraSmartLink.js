export const ADSTERRA_SMART_LINK = "https://dependedunmoved.com/kyy99erhbc?key=644614ebc48ade4ce12a485a5a3cea3a";

// Hook to open smart link programmatically (e.g., on episode change)
export function useAdsterraSmartLink() {
  const openSmartLink = () => {
    // Try opening directly (works if called within a synchronous click handler)
    const newWin = window.open(ADSTERRA_SMART_LINK, "_blank", "noopener,noreferrer");
    
    // If blocked by browser's popup blocker (e.g. called from useEffect without user gesture)
    if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
      // Smart Fallback: wait for the user's very next click on the page to open it
      const fallbackOpener = () => {
        window.open(ADSTERRA_SMART_LINK, "_blank", "noopener,noreferrer");
        document.removeEventListener('click', fallbackOpener, { capture: true });
      };
      
      // Use capture: true and once: true so it triggers exactly once on their next interaction
      document.addEventListener('click', fallbackOpener, { capture: true, once: true });
    }
  };

  return { openSmartLink };
}
