import { useState, useEffect } from 'react';

export function useAniSkip(malId, episodeNumber, episodeLength = 0) {
  const [skipTimes, setSkipTimes] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Clear skipTimes asynchronously to prevent the "cascading renders" warning
    // This also correctly clears previous episode's skip times while fetching
    setTimeout(() => {
      if (isMounted) setSkipTimes(null);
    }, 0);

    if (!malId || !episodeNumber) {
      return () => {
        isMounted = false;
      };
    }

    const fetchSkipTimes = async () => {
      try {
        // AniSkip API v2 expects episodeLength to be a query parameter, but 0 usually works to get all available
        const url = `https://api.aniskip.com/v2/skip-times/${malId}/${episodeNumber}?types[]=ed&types[]=op&episodeLength=${episodeLength}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch AniSkip');
        const data = await res.json();
        
        if (data && data.found) {
          const newSkipTimes = {};
          if (data.results) {
            const op = data.results.find(r => r.skipType === 'op');
            const ed = data.results.find(r => r.skipType === 'ed');
            
            if (op && op.interval) {
              newSkipTimes.op = [op.interval.startTime, op.interval.endTime];
            }
            if (ed && ed.interval) {
              newSkipTimes.ed = [ed.interval.startTime, ed.interval.endTime];
            }
          }
          if (isMounted) {
            setSkipTimes(Object.keys(newSkipTimes).length > 0 ? newSkipTimes : null);
          }
        } else {
          if (isMounted) setSkipTimes(null);
        }
      } catch (err) {
        console.warn('[AniSkip] Error fetching skip times:', err);
        if (isMounted) setSkipTimes(null);
      }
    };

    fetchSkipTimes();

    return () => {
      isMounted = false;
    };
  }, [malId, episodeNumber, episodeLength]);

  return skipTimes;
}
