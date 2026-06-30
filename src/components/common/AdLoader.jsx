import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePopunder } from '../../context/PopunderContext';

/**
 * Dynamically loads/unloads global ad scripts (AdSense + Popunder)
 * based on the current route. Ads are NOT loaded on the Portal page ("/").
 */
export default function AdLoader() {
  const location = useLocation();
  const { isPopunderDisabled } = usePopunder();

  useEffect(() => {
    // Don't load AdSense on portal page, but allow popunder
    if (location.pathname === "/") {
      // Remove AdSense if it was previously injected
      const adsenseScript = document.getElementById('adsense-global');
      if (adsenseScript) adsenseScript.remove();
    } else {
      // Load Google AdSense if not already loaded
      if (!document.getElementById('adsense-global')) {
        const adsense = document.createElement('script');
        adsense.id = 'adsense-global';
        adsense.async = true;
        adsense.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1545867307724937";
        adsense.setAttribute('crossorigin', 'anonymous');
        document.head.appendChild(adsense);
      }
    }

    // Load Popunder if not disabled by user and not already loaded
    if (!document.getElementById('popunder-global') && !isPopunderDisabled) {
      const popunder = document.createElement('script');
      popunder.id = 'popunder-global';
      const hostname = window.location.hostname;
      if (hostname.includes('anixo.buzz')) {
        popunder.src = "https://dependedunmoved.com/ec/2a/ef/ec2aef82b9deb69e372b3c911ce24252.js";
      } else {
        popunder.src = "https://dependedunmoved.com/4f/1b/2f/4f1b2fdd5cf3e2306bcfee1c78e77468.js";
      }
      document.body.appendChild(popunder);
    }

    // Remove popunder if it was loaded but user disabled it
    if (isPopunderDisabled) {
      const popunderScript = document.getElementById('popunder-global');
      if (popunderScript) popunderScript.remove();
    }
  }, [location.pathname, isPopunderDisabled]);

  return null;
}
