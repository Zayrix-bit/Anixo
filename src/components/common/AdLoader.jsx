import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Dynamically loads/unloads global ad scripts (AdSense + Popunder)
 * based on the current route.
 * Ads are NOT loaded on the Portal ("/") or Community ("/community") pages.
 */
export default function AdLoader() {
  const location = useLocation();

  useEffect(() => {
    const isCommunityPage =
      location.pathname === "/community" ||
      location.pathname.startsWith("/community/");

    const isPortalPage = location.pathname === "/";
    const isAdFreePage = isPortalPage || isCommunityPage;

    // AdSense
    if (isAdFreePage) {
      const adsenseScript = document.getElementById("adsense-global");
      if (adsenseScript) adsenseScript.remove();
    } else if (!document.getElementById("adsense-global")) {
      const adsense = document.createElement("script");
      adsense.id = "adsense-global";
      adsense.async = true;
      adsense.src =
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1545867307724937";
      adsense.setAttribute("crossorigin", "anonymous");
      document.head.appendChild(adsense);
    }

    // Popunder
    if (isAdFreePage) {
      const popunderScript = document.getElementById("popunder-global");
      if (popunderScript) popunderScript.remove();
    } else if (!document.getElementById("popunder-global")) {
      const popunder = document.createElement("script");
      popunder.id = "popunder-global";

      const hostname = window.location.hostname;
      popunder.src = hostname.includes("anixo.buzz")
        ? "https://dependedunmoved.com/ec/2a/ef/ec2aef82b9deb69e372b3c911ce24252.js"
        : "https://dependedunmoved.com/4f/1b/2f/4f1b2fdd5cf3e2306bcfee1c78e77468.js";

      document.body.appendChild(popunder);
    }
  }, [location.pathname]);

  return null;
}
