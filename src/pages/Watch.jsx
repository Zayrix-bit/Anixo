import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getAnimeDetails, getEpisodeTitles, getJikanAnimeDetails, getAnikaiDetails, getSecondaryEpisodeMeta, getMalSyncMapping, getAnikaiServers, PYTHON_API, ALLANIME_API } from "../services/api";
import { resolveAnikaiMatch, scoreMetadata } from "../services/anikaiMapping";
import { useLanguage } from "../context/LanguageContext";
import { useLoading } from "../context/LoadingContext";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import NextEpisodeBanner from "../components/common/NextEpisodeBanner";
import VideoPlayer from "../components/common/VideoPlayer";
import ArtPlayer from "../components/common/ArtPlayer";
import LoginModal from "../components/auth/LoginModal";
import { useAuth } from "../hooks/useAuth";
import { addToWatchlist, removeFromWatchlist, getWatchlist } from "../services/watchlistService";
import { updateProgress } from "../services/progressService";
import { Home as HomeIcon } from "lucide-react";
import { updateMetaTags, updateStructuredData, clearStructuredData } from "../utils/seo";

// Extracted Watch sub-components
import PlayerToolbar from "../components/watch/PlayerToolbar";
import EpisodeSidebar from "../components/watch/EpisodeSidebar";
import SeasonsSection from "../components/watch/SeasonsSection";
import AnimeDetailsSection from "../components/watch/AnimeDetailsSection";
import CharactersSection from "../components/watch/CharactersSection";
import CustomCommentSection from "../components/watch/CommentSection";
import ReportModal from "../components/watch/ReportModal";
import SkipTimeModal from "../components/watch/SkipTimeModal";


export default function Watch() {
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isMal = queryParams.get("mal") === "true";
  const initialEp = parseInt(queryParams.get("ep")) || 1;
  const initialTime = parseFloat(queryParams.get("t")) || 0;

  const { getTitle } = useLanguage();
  const { setPageLoading } = useLoading();

  const [activeEpisode, setActiveEpisode] = useState(initialEp);

  // --- Real Watch History Tracking ---
  const [watchedEpisodes, setWatchedEpisodes] = useState(() => {
    try {
      const saved = localStorage.getItem(`watched_${id}`);
      return saved ? JSON.parse(saved) : [initialEp];
    } catch { return [initialEp]; }
  });

  useEffect(() => {
    setWatchedEpisodes(prev => {
      if (prev.includes(activeEpisode)) return prev;
      const next = [...prev, activeEpisode];
      localStorage.setItem(`watched_${id}`, JSON.stringify(next));
      return next;
    });
  }, [activeEpisode, id]);

  const [episodeLayout, setEpisodeLayout] = useState("list"); // "grid" | "list" | "detailed"
  const [playerLang, setPlayerLang] = useState("sub");
  const [activeServer, setActiveServer] = useState(2);
  const [availableServers, setAvailableServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [allanimeId, setAllanimeId] = useState(null);
  const [videoQuality, setVideoQuality] = useState(() => {
    try { return localStorage.getItem("videoQuality") || "best"; } catch { return "best"; }
  });
  const [availableQualities, setAvailableQualities] = useState([]);

  // Watchlist integration
  const { user, setGlobalProgress, globalSettings, triggerAuthToast } = useAuth();
  const [backendWatchlist, setBackendWatchlist] = useState([]);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);

  useEffect(() => {
    if (user) {
      getWatchlist().then(res => {
        if (res.success) {
          setBackendWatchlist(res.watchlist);
        }
      });
    }
  }, [user]);

  // Reset Allanime ID on navigation
  useEffect(() => {
    setAllanimeId(null);
  }, [id]);

  const isBookmarked = backendWatchlist.some(item => item.animeId === String(id));

  // Safe localStorage helper
  const getSafeStorage = (key, defaultVal) => {
    try {
      const val = localStorage.getItem(key);
      if (!val) return defaultVal;
      return JSON.parse(val);
    } catch (err) {
      console.warn(`[Storage] Failed to parse key "${key}". Resetting to default.`, err);
      return defaultVal;
    }
  };

  // Persisted settings
  const [autoNext, setAutoNext] = useState(() => getSafeStorage("autoNext", true));
  const [autoPlay, setAutoPlay] = useState(() => getSafeStorage("autoPlay", true));

  const [episodePage, setEpisodePage] = useState(0);
  const [hasSub, setHasSub] = useState(false); // Strict: Hide until verified
  const [hasDub, setHasDub] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState("");
  const [isEpisodeSearchOpen, setIsEpisodeSearchOpen] = useState(false);

  // Sync Focus Mode to Body class for global styling overrides
  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add("focus-mode");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.body.classList.remove("focus-mode");
    }
    return () => document.body.classList.remove("focus-mode");
  }, [isFocusMode]);

  // Performance: In-memory caches
  const streamCache = useRef(new Map());


  // Modal states
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showWatchlistDropdown, setShowWatchlistDropdown] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [reportDetails, setReportDetails] = useState({
    issues: [],
    other: ""
  });
  const [userRating, setUserRating] = useState(() => getSafeStorage(`rating_${id}`, null));
  const [skipTimes, setSkipTimes] = useState(() => getSafeStorage(`skipTimes_${id}`, {}));

  // Sync settings to localStorage
  useEffect(() => localStorage.setItem("autoNext", JSON.stringify(autoNext)), [autoNext]);
  useEffect(() => localStorage.setItem("autoPlay", JSON.stringify(autoPlay)), [autoPlay]);
  useEffect(() => localStorage.setItem(`skipTimes_${id}`, JSON.stringify(skipTimes)), [skipTimes, id]);


  useEffect(() => {
    if (userRating) {
      localStorage.setItem(`rating_${id}`, JSON.stringify(userRating));
    }
  }, [userRating, id]);


  // Handle J/L key skipping based on user settings
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in a search box or input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const skipVal = globalSettings?.skipSeconds || 10;

      if (e.key.toLowerCase() === 'l') {
        // Skip Forward
        window.postMessage({ event: "skip", amount: skipVal }, "*");
      } else if (e.key.toLowerCase() === 'j') {
        // Skip Backward
        window.postMessage({ event: "skip", amount: -skipVal }, "*");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [globalSettings]);

  const EPISODES_PER_PAGE = 50;
  const GOGO_SLUG_OVERRIDES = {};

  // Sync with global settings
  useEffect(() => {
    if (globalSettings) {
      if (globalSettings.videoLanguage === 'Dub') {
        setPlayerLang('dub');
      } else if (globalSettings.videoLanguage === 'Soft Sub' || globalSettings.videoLanguage === 'Hard Sub') {
        setPlayerLang('sub');
      }

      if (globalSettings.autoPlay !== undefined) setAutoPlay(globalSettings.autoPlay);
      if (globalSettings.autoNext !== undefined) setAutoNext(globalSettings.autoNext);
    }
  }, [globalSettings]);

  // Reset active episode and page when navigating to a different anime/season
  useEffect(() => {
    setActiveEpisode(1);
    setEpisodePage(0);
  }, [id]);

  // Auto-jump to the correct page when active episode changes
  useEffect(() => {
    const targetPage = Math.floor((activeEpisode - 1) / EPISODES_PER_PAGE);
    setEpisodePage(targetPage);
  }, [activeEpisode]);

  // API Endpoints

  const [streamUrl, setStreamUrl] = useState("");
  const [streamData, setStreamData] = useState(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const [anikaiEpisodes, setAnikaiEpisodes] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  // Sync global page loader with iframe loading
  useEffect(() => {
    if (iframeLoaded || fetchError || (streamUrl && streamData && !streamData.iframe_url && !streamLoading)) {
      setPageLoading(false);
    }
  }, [iframeLoaded, fetchError, streamUrl, streamData, streamLoading, setPageLoading]);

  // Clean up loading state on unmount
  useEffect(() => {
    return () => setPageLoading(false);
  }, [setPageLoading]);

  // Reset iframe loading state whenever the URL changes
  useEffect(() => {
    if (streamUrl) {
      setIframeLoaded(false);
    } else {
      setIframeLoaded(true);
    }
  }, [streamUrl]);

  const { data: anime, isLoading } = useQuery({
    queryKey: ["animeDetails", id, isMal],
    queryFn: () => getAnimeDetails(id, isMal),
    enabled: !!id,
    staleTime: 0,
  });

  // --- DYNAMIC SEO & STRUCTURED DATA ---
  useEffect(() => {
    if (!anime) return;

    const title = getTitle(anime.title) || "Watch Anime";
    const coverImage = anime.bannerImage || anime.coverImage?.extraLarge || anime.coverImage?.large;
    const descText = anime.description ? anime.description.replace(/<[^>]+>/g, '').substring(0, 160) : "Watch this anime online for free in high quality.";
    
    // Update Meta Tags
    updateMetaTags({
      title: `${title} Episode ${activeEpisode}`,
      description: `Watch ${title} Episode ${activeEpisode} English Sub/Dub in High Quality. ${descText}`,
      image: coverImage,
      url: `/watch/${id}?ep=${activeEpisode}`
    });

    // Generate Schema.org structured data for this Episode
    const schema = {
      "@context": "https://schema.org",
      "@type": "TVEpisode",
      "episodeNumber": activeEpisode,
      "name": `Episode ${activeEpisode}`,
      "partOfSeries": {
        "@type": "TVSeries",
        "name": title,
        "image": coverImage,
        "description": descText,
        "url": `https://anixo.online/watch/${id}`
      }
    };
    
    updateStructuredData(schema);

    // Cleanup when leaving component
    return () => {
      clearStructuredData();
      updateMetaTags({
        title: "Watch Free Anime Online, Stream Subbed & Dubbed HD",
        description: "AniXo is the best website to watch anime online for free. Watch trending, popular, and new releases with SUB, DUB in HD quality. No Ads Guaranteed! WATCH NOW!",
        url: "/"
      });
    };
  }, [anime, activeEpisode, getTitle, id]);

  // --- Auto-fetch Skip Times from AniSkip (Auto OP/ED) ---
  useEffect(() => {
    // Only fetch if anime details exist and skip times for this episode aren't already loaded
    if (!anime || !activeEpisode || skipTimes[activeEpisode]) return;

    const fetchAniSkip = async () => {
      try {
        // AniSkip prefers AniList ID. If we have it in the anime object, use it.
        // anime.id is usually the AniList ID from our service.
        const targetId = anime.id;
        const isMalId = isMal && !anime.id; // Fallback if anime.id is missing but we have MAL id

        let apiUrl = `https://api.aniskip.com/v2/skip-times/${targetId}/${activeEpisode}?types[]=op&types[]=ed`;
        if (isMalId) {
          apiUrl = `https://api.aniskip.com/v2/skip-times/mal/${id}/${activeEpisode}?types[]=op&types[]=ed`;
        }

        const response = await axios.get(apiUrl);

        if (response.data && response.data.results) {
          const results = response.data.results;
          const op = results.find(r => r.skipType === 'op')?.interval;
          const ed = results.find(r => r.skipType === 'ed')?.interval;

          if (op || ed) {
            setSkipTimes(prev => ({
              ...prev,
              [activeEpisode]: {
                op: op ? [op.startTime, op.endTime] : null,
                ed: ed ? [ed.startTime, ed.endTime] : null
              }
            }));
            console.log(`[AniSkip] Found skip times for Episode ${activeEpisode}`, { op, ed });
          }
        }
      } catch {
        console.log(`[AniSkip] No skip times available for Ep ${activeEpisode}`);
      }
    };

    fetchAniSkip();
  }, [id, activeEpisode, skipTimes, anime, isMal]);

  // Search for Allanime ID + Instant SUB/DUB Detection
  const [allanimeSubCount, setAllanimeSubCount] = useState(0);
  const [allanimeDubCount, setAllanimeDubCount] = useState(0);

  useEffect(() => {
    if (!anime) return;
    
    const fetchAllanimeId = async () => {
      const searchTitle = anime.title?.english || anime.title?.romaji || anime.title?.native;
      const malId = anime.idMal || (isMal ? id : null);

      // --- STEP 1: Try Exact Mapping via MalSync (Industry Standard) ---
      if (malId) {
        try {
          const mapping = await getMalSyncMapping(malId);
          if (mapping && mapping.Sites && mapping.Sites.AllAnime) {
            const allAnimeKey = Object.keys(mapping.Sites.AllAnime)[0];
            const allAnimeData = mapping.Sites.AllAnime[allAnimeKey];
            if (allAnimeData && allAnimeData.identifier) {
              console.log(`[Allanime] Found exact MalSync mapping: ${allAnimeData.identifier}`);
              setAllanimeId(allAnimeData.identifier);
              // Also update counts if available
              setAllanimeSubCount(anime.episodes || 0); 
              return; // Success!
            }
          }
        } catch (err) {
          console.warn("[Allanime] MalSync mapping failed, falling back to search...", err);
        }
      }

      // --- STEP 2: Fallback to Keyword Search (with improved scoring) ---
      if (!searchTitle) return;
      
      try {
        const res = await axios.get(`${ALLANIME_API}/search`, { params: { query: searchTitle } });
        if (Array.isArray(res.data) && res.data.length > 0) {
          const targetTitle = searchTitle.toLowerCase();
          let bestMatch = res.data[0];
          let highestScore = -100;

          res.data.forEach(result => {
            const resultTitle = (result.title || "").toLowerCase();
            const resultEnglish = (result.title_english || "").toLowerCase();

            let score = 0;
            const words = targetTitle.split(/\s+/).filter(w => w.length > 2);
            words.forEach(word => {
              if (resultTitle.includes(word) || resultEnglish.includes(word)) {
                score += 5;
              }
            });

            // Exact match bonus
            if (resultTitle === targetTitle || resultEnglish === targetTitle) score += 50;

            // Strict Season Matching
            const targetSeason = targetTitle.match(/season\s+(\d+)/);
            const resultSeason = resultTitle.match(/season\s+(\d+)/) || resultEnglish.match(/season\s+(\d+)/);

            if (targetSeason && resultSeason) {
              if (targetSeason[1] === resultSeason[1]) score += 30;
              else score -= 50; // Wrong season!
            } else if (!targetSeason && resultSeason) {
              score -= 30; // Result is a season, but target isn't
            }

            // Length Penalty (prevents partial matches from winning)
            const lengthDiff = Math.abs(resultTitle.length - targetTitle.length);
            score -= (lengthDiff * 2);

            if (score > highestScore) {
              highestScore = score;
              bestMatch = result;
            }
          });

          setAllanimeId(bestMatch.id);
          setAllanimeSubCount(parseInt(bestMatch.episodes_sub) || 0);
          setAllanimeDubCount(parseInt(bestMatch.episodes_dub) || 0);
          console.log(`[Allanime] Best Search Match: ${bestMatch.title} (ID: ${bestMatch.id}) | Score: ${highestScore}`);
        }
      } catch (err) {
        console.warn("Allanime search failed:", err);
      }
    };

    fetchAllanimeId();
  }, [anime, ALLANIME_API, id, isMal]);

  // Fetch available qualities for Server 2 (AllAnime)
  const qualitiesCache = useRef({});
  useEffect(() => {
    if (activeServer !== 2 || !allanimeId || !activeEpisode) {
      setAvailableQualities([]);
      return;
    }
    const cacheKey = `${allanimeId}-${activeEpisode}-${playerLang}`;
    if (qualitiesCache.current[cacheKey]) {
      setAvailableQualities(qualitiesCache.current[cacheKey]);
      return;
    }
    const mode = playerLang === 'dub' ? 'dub' : 'sub';
    axios.get(`${ALLANIME_API}/qualities`, {
      params: { show_id: allanimeId, ep_no: activeEpisode, mode }
    })
      .then(res => {
        const q = res.data?.qualities || [];
        qualitiesCache.current[cacheKey] = q;
        setAvailableQualities(q);
        console.log(`[Qualities] Episode ${activeEpisode}: ${q.join(', ') || 'single quality only'}`);
      })
      .catch(() => setAvailableQualities([]));
  }, [activeServer, allanimeId, activeEpisode, playerLang, ALLANIME_API]);

  // ── PROGRESS: Save to backend handled by player time-tracking ──
  useEffect(() => {
    if (!user || !anime || !id) return;
    // We no longer pre-save 0:00 to avoid overwriting real progress.
    // Progress will be saved automatically by the player time-tracking.
  }, [user, anime, id, activeEpisode]);

  const lastCapturedTime = useRef(0);
  const lastCapturedDuration = useRef(null);

  // Robustly extract time from player messages
  useEffect(() => {
    const handleProgressCapture = (e) => {
      const data = e.data;
      if (!data) return;

      const getNum = (...vals) => {
        for (const val of vals) {
          const num = Number(val);
          if (!isNaN(num) && typeof num === 'number' && num >= 0) return num;
        }
        return null;
      };

      // Extract time from various known formats
      const time = getNum(
        data.currentTime, data.time, data.seconds, data.position,
        data.data?.currentTime, data.data?.position,
        data.value?.currentTime, data.value?.position
      );

      const duration = getNum(
        data.duration, data.totalTime,
        data.data?.duration, data.value?.duration
      );

      if (time !== null) lastCapturedTime.current = Math.floor(time);
      if (duration !== null) lastCapturedDuration.current = Math.floor(duration);
    };

    window.addEventListener("message", handleProgressCapture);
    return () => window.removeEventListener("message", handleProgressCapture);
  }, []);

  // ── PROGRESS: Save on page leave / tab close ──
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Instant save: track if we have any progress at all
      if (!user || !anime || !id || lastCapturedTime.current <= 0) return;

      const coverImg = anime?.coverImage?.large || anime?.coverImage?.extraLarge;
      const title = anime?.title?.english || anime?.title?.romaji || anime?.title?.native || 'Unknown';
      const token = localStorage.getItem('token');
      if (!token) return;

      // Use absolute URL for the background fetch to ensure it hits the backend-core
      // The backend-core is usually on port 5001 or proxied via /api
      const payload = JSON.stringify({
        animeId: String(id),
        episode: activeEpisode,
        currentTime: lastCapturedTime.current,
        duration: lastCapturedDuration.current,
        title,
        coverImage: coverImg
      });

      try {
        // Use the correct proxy path /progress/save which points to port 5001
        fetch('/progress/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: payload,
          keepalive: true
        });
      } catch {
        // Silently fail
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, anime, id, activeEpisode]);



  // 1. Compute Relations (Sequels/Prequels/Related)
  const relations = useMemo(() => {
    if (!anime) return [];
    return (anime.relations?.edges || [])
      .filter(edge => edge.node?.type === 'ANIME')
      .map(edge => edge.node)
      .filter(item => item && Number(item.id) !== Number(id))
      .slice(0, 12);
  }, [anime, id]);

  // 2. Compute Recommendations (You May Also Like)
  const recommendations = useMemo(() => {
    if (!anime) return [];
    return (anime.recommendations?.nodes || [])
      .map(node => node.mediaRecommendation)
      .filter(item => item && Number(item.id) !== Number(id))
      .slice(0, 24);
  }, [anime, id]);

  // SUB/DUB availability — instant detection via AllAnime episode counts
  useEffect(() => {
    if (!allanimeSubCount && !allanimeDubCount) {
      // AllAnime data not loaded yet, keep defaults
      return;
    }

    const subAvailable = allanimeSubCount >= activeEpisode;
    const dubAvailable = allanimeDubCount >= activeEpisode;

    setHasSub(subAvailable);
    setHasDub(dubAvailable);

    // Auto-switch language if current selection is unavailable
    if (playerLang === "dub" && !dubAvailable && subAvailable) setPlayerLang("sub");
    else if (playerLang === "sub" && !subAvailable && dubAvailable) setPlayerLang("dub");
  }, [activeEpisode, allanimeSubCount, allanimeDubCount, playerLang]);

  // MAL Episode Titles (lightweight — only for episode names)
  const { data: malEpisodes } = useQuery({
    queryKey: ["malEpisodes", anime?.idMal],
    queryFn: () => getEpisodeTitles(anime?.idMal),
    enabled: !!anime?.idMal,
    staleTime: 1000 * 60 * 60 * 24,
  });

  // MALSync Mapping for precise external IDs (Kitsu, etc)
  const { data: malsyncMapping } = useQuery({
    queryKey: ["malsyncMapping", anime?.idMal],
    queryFn: () => getMalSyncMapping(anime?.idMal),
    enabled: !!anime?.idMal,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const kitsuIdFromMapping = malsyncMapping?.Sites?.Kitsu ? Object.keys(malsyncMapping.Sites.Kitsu)[0] : null;

  const kitsuTitle = anime?.title?.english;
  const kitsuAltTitle = anime?.title?.romaji;
  const { data: kitsuEpisodes } = useQuery({
    queryKey: ["kitsuEpisodes", kitsuTitle, kitsuAltTitle, kitsuIdFromMapping],
    queryFn: () => getSecondaryEpisodeMeta(kitsuTitle, kitsuAltTitle, kitsuIdFromMapping),
    enabled: !!kitsuTitle || !!kitsuAltTitle || !!kitsuIdFromMapping,
    staleTime: 1000 * 60 * 60 * 24,
  });

  // 🚀 Multi-level detail fetching (Anikai > Jikan > Anilist) 🚀
  const searchTitle = anime?.title?.english || anime?.title?.romaji || anime?.title?.native;

  const { data: anikaiDetails } = useQuery({
    queryKey: ["anikaiDetails", searchTitle],
    queryFn: () => getAnikaiDetails(searchTitle),
    enabled: !!searchTitle,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const { data: jikanDetails } = useQuery({
    queryKey: ["jikanDetails", anime?.idMal],
    queryFn: () => getJikanAnimeDetails(anime?.idMal),
    enabled: !!anime?.idMal && !anikaiDetails,
    staleTime: 1000 * 60 * 60 * 24,
  });

  // Unified priority resolver: Anikai > Jikan > Anilist
  const resolvedInfo = useMemo(() => {
    const get = (field, ...fallbacks) => {
      const sources = [anikaiDetails];
      for (const src of sources) {
        if (src?.[field]) return src[field];
      }
      // Jikan uses different keys, handle mapping
      const jikanMap = {
        description: jikanDetails?.synopsis,
        country: jikanDetails?.demographics?.[0]?.name ? 'Japan' : null,
        premiered: jikanDetails?.season && jikanDetails?.year ? `${jikanDetails.season} ${jikanDetails.year}` : null,
        aired: jikanDetails?.aired?.string,
        episodes: jikanDetails?.episodes?.toString(),
        duration: jikanDetails?.duration,
        status: jikanDetails?.status,
        mal_score: jikanDetails?.score?.toString(),
        studios: jikanDetails?.studios?.map(s => s.name).join(", "),
        producers: jikanDetails?.producers?.map(p => p.name).join(", "),
        genres: jikanDetails?.genres?.map(g => g.name),
        rating: jikanDetails?.rating?.split(" - ")[0],
      };
      if (jikanMap[field]) return jikanMap[field];
      // Final fallback values
      for (const fb of fallbacks) {
        if (fb) return fb;
      }
      return null;
    };
    if (!anime) return {};
    return {
      description: get("description", anime.description),
      country: get("country", anime.countryOfOrigin === 'JP' ? 'Japan' : anime.countryOfOrigin),
      premiered: get("premiered", anime.seasonYear ? `${anime.season?.toLowerCase() || ''} ${anime.seasonYear}` : null),
      aired: get("aired", anime.startDate ? `${anime.startDate.month ? new Date(anime.startDate.year, anime.startDate.month - 1).toLocaleString('default', { month: 'short' }) : '?'} ${anime.startDate.day || '?'}, ${anime.startDate.year}` : null),
      episodes: get("episodes", anime.episodes?.toString()),
      duration: get("duration", anime.duration ? `${anime.duration} min` : null),
      status: get("status", anime.status?.replace(/_/g, ' ')?.toLowerCase()),
      mal_score: get("mal_score", anime.averageScore ? `${(anime.averageScore / 10).toFixed(2)}` : null),
      studios: get("studios", anime.studios?.nodes?.filter(s => s.isAnimationStudio)[0]?.name),
      producers: get("producers", anime.studios?.nodes?.filter(s => !s.isAnimationStudio).map(s => s.name).join(", ")),
      genres: get("genres", anime.genres),
      rating: get("rating"),
    };
  }, [anime, anikaiDetails, jikanDetails]);

  // Resolve current episode image for player background/loading placeholder
  const currentEpisodeImage = useMemo(() => {
    if (!anime) return null;
    const epData = malEpisodes?.find(e => e.mal_id === activeEpisode);
    const aniListEp = anime?.streamingEpisodes?.find(
      se => se.title && /Episode\s+(\d+)/i.test(se.title) && parseInt(se.title.match(/Episode\s+(\d+)/i)[1]) === activeEpisode
    ) || anime?.streamingEpisodes?.[activeEpisode - 1];

    // Priority:
    // 1. Kitsu (Best for unique screenshots)
    // 2. AniList Thumbnail (If not placeholder)
    // 3. Jikan / MAL
    // 4. Fallback to Anime Banner
    return (kitsuEpisodes?.[activeEpisode]?.image || kitsuEpisodes?.[String(activeEpisode)]?.image) ||
      aniListEp?.thumbnail ||
      epData?.images?.jpg?.image_url ||
      anime?.bannerImage ||
      anime?.coverImage?.extraLarge ||
      anime?.coverImage?.large;
  }, [anime, malEpisodes, activeEpisode, kitsuEpisodes]);


  useEffect(() => {
    const searchTitle = anime?.title?.english || anime?.title?.romaji || anime?.title?.native;
    if (!searchTitle) { setAnikaiEpisodes([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const searchResp = await axios.get(`${PYTHON_API}/api/anikai/search`, {
          params: { keyword: searchTitle },
        });
        if (cancelled) return;
        const results = searchResp.data?.results || [];
        if (!searchResp.data?.success || results.length === 0) {
          setAnikaiEpisodes([]);
          return;
        }
        const candidates = resolveAnikaiMatch(results, anime, playerLang);
        if (candidates.length === 0) {
          setAnikaiEpisodes([]);
          return;
        }

        // DEEP VERIFICATION: Fetch info for top candidates in parallel
        console.group(`[Mapping] Deep Resolving: ${anime.title?.english || id}`);
        const infoPromises = candidates.map(c =>
          axios.get(`${PYTHON_API}/api/anikai/info/${c.slug}`)
            .then(res => ({ ...c, info: res.data }))
            .catch(() => ({ ...c, info: null }))
        );

        const verificationResults = await Promise.all(infoPromises);
        if (cancelled) {
          console.groupEnd();
          return;
        }

        const finalScored = verificationResults.map(v => {
          const metaScore = v.info?.success ? scoreMetadata(anime, v.info) : 0;
          return { ...v, totalScore: (v.score || 0) + metaScore };
        });

        finalScored.sort((a, b) => b.totalScore - a.totalScore);
        const best = finalScored[0];

        // Log detailed scoring for transparency
        console.table(finalScored.map(f => ({
          Title: f.title,
          Initial: f.score,
          MetaBonus: f.totalScore - f.score,
          Total: f.totalScore,
          Year: f.info?.year,
          Eps: f.info?.episodes?.length
        })));
        console.groupEnd();

        const resolvedSlug = best.slug;
        const aniId = best.info?.ani_id;

        if (!best.info?.success || !aniId) {
          setAnikaiEpisodes([]);
          return;
        }
        const epsResp = await axios.get(`${PYTHON_API}/api/anikai/episodes/${aniId}`);
        if (cancelled) return;
        if (epsResp.data?.success && Array.isArray(epsResp.data.episodes)) {
          setAnikaiEpisodes(epsResp.data.episodes);
          console.log("[Anikai] Final Result: %s (%s) episodes=%d", best.title, resolvedSlug, epsResp.data.episodes.length);
        } else {
          setAnikaiEpisodes([]);
        }
      } catch (err) {
        console.error("Anikai deep resolve error:", err);
        if (!cancelled) setAnikaiEpisodes([]);
      }
    })();
    return () => { cancelled = true; };
  }, [anime, id, playerLang]);





  const episodesList = useMemo(() => {
    if (!anime) return [];
    let count = anime.episodes;

    // If the anime is still airing and we have nextAiringEpisode
    if (anime.nextAiringEpisode) {
      count = Math.max(1, anime.nextAiringEpisode.episode - 1);
    }

    // FALLBACK: If AniList is down/missing airing info, use our filtered MAL episodes count
    if (malEpisodes && malEpisodes.length > 0 && (anime.status === 'RELEASING' || !count)) {
      count = malEpisodes.length;
    }

    // For airing anime: use streamingEpisodes count as fallback
    if (!count && anime.status === 'RELEASING' && anime.streamingEpisodes?.length) {
      count = anime.streamingEpisodes.length;
    }
    if (!count) count = 12; // fallback if entirely unknown
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [anime, malEpisodes]);

  const filteredEpisodes = useMemo(() => {
    if (!episodeSearchQuery) return episodesList;
    const query = episodeSearchQuery.toLowerCase().trim();
    return episodesList.filter(ep => {
      const epStr = String(ep);
      const kitsuData = kitsuEpisodes?.[ep] || kitsuEpisodes?.[epStr];
      const jikanData = malEpisodes?.find(e => e.mal_id === ep);

      const title = (jikanData?.title || kitsuData?.title || "").toLowerCase();
      return epStr.includes(query) || title.includes(query);
    });
  }, [episodesList, episodeSearchQuery, kitsuEpisodes, malEpisodes]);

  // Clamp episodePage when filteredEpisodes changes (e.g. searching)
  useEffect(() => {
    const totalPages = Math.ceil(filteredEpisodes.length / EPISODES_PER_PAGE);
    if (episodePage >= totalPages && totalPages > 0) {
      setEpisodePage(totalPages - 1);
    } else if (filteredEpisodes.length === 0 && episodePage !== 0) {
      setEpisodePage(0);
    }
  }, [filteredEpisodes, episodePage, EPISODES_PER_PAGE]);

  const [stableSeasons, setStableSeasons] = useState([]);

  useEffect(() => {
    if (!anime) return;

    setStableSeasons(prev => {
      const isAlreadyInList = prev.some(s => s.id === anime.id || s.slug === anime.slug);

      if (isAlreadyInList) {
        return prev.map(s => ({
          ...s,
          isActive: (s.id === anime.id || s.slug === (anikaiDetails?.slug || anime.slug))
        }));
      }

      // Priority: Anikai Seasons (more accurate for the scraper)
      if (anikaiDetails?.seasons && anikaiDetails.seasons.length > 0) {
        return anikaiDetails.seasons.map(s => ({
          id: s.slug,
          slug: s.slug,
          title: {
            english: s.title,
            romaji: s.title
          },
          coverImage: {
            large: s.poster || anime.coverImage?.large,
            medium: s.poster || anime.coverImage?.medium
          },
          episodes: parseInt(s.episodes) || 0,
          format: "TV",
          isActive: s.isActive,
          relationToMain: s.isActive ? 'CURRENT' : 'ALTERNATIVE'
        }));
      }

      // Fallback: AniList Relations
      const items = [{
        ...anime,
        isActive: true,
        relationToMain: 'CURRENT'
      }];

      if (anime.relations?.edges) {
        anime.relations.edges.forEach(edge => {
          if (["TV"].includes(edge.node?.format)) {
            items.push({
              ...edge.node,
              isActive: false,
              relationToMain: edge.relationType
            });
          }
        });
      }

      const uniqueMap = new Map();
      items.forEach(item => {
        if (!uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, item);
        } else {
          if (item.isActive) {
            const existing = uniqueMap.get(item.id);
            existing.isActive = true;
            existing.relationToMain = 'CURRENT';
            uniqueMap.set(item.id, existing);
          }
        }
      });

      const uniqueItems = Array.from(uniqueMap.values()).filter(item => {
        // 1. Always keep the current active anime
        if (item.isActive) return true;

        // 2. Only allow specific relation types that define a "Season"
        const allowedRelations = ['PREQUEL', 'SEQUEL', 'PARENT', 'SIDE_STORY', 'ALTERNATIVE'];
        if (!allowedRelations.includes(item.relationToMain)) return false;

        // 3. Strict Title Check: Ensure it belongs to the same franchise
        // (Prevents "Dragon Ball" showing up in "One Piece" due to crossovers)
        const mainTitle = getTitle(anime.title).split(' ')[0].toLowerCase(); // e.g., "one"
        const itemTitle = getTitle(item.title).toLowerCase();

        // Keep if it contains the first word of the main title OR it's a direct sequel/prequel
        const isSequelPrequel = ['PREQUEL', 'SEQUEL'].includes(item.relationToMain);
        const isSimilarTitle = itemTitle.includes(mainTitle);

        return isSequelPrequel || isSimilarTitle;
      });

      uniqueItems.sort((a, b) => {
        const aMain = ['PREQUEL', 'SEQUEL', 'PARENT', 'CURRENT'].includes(a.relationToMain) || (!a.relationToMain && ['TV'].includes(a.format)) ? 0 : 1;
        const bMain = ['PREQUEL', 'SEQUEL', 'PARENT', 'CURRENT'].includes(b.relationToMain) || (!b.relationToMain && ['TV'].includes(b.format)) ? 0 : 1;

        if (aMain !== bMain) return aMain - bMain;

        const aY = a.startDate?.year || 9999;
        const bY = b.startDate?.year || 9999;
        if (aY !== bY) return aY - bY;
        const aM = a.startDate?.month || 12;
        const bM = b.startDate?.month || 12;
        if (aM !== bM) return aM - bM;
        const aD = a.startDate?.day || 31;
        const bD = b.startDate?.day || 31;
        return aD - bD;
      });

      return uniqueItems;
    });
  }, [anime, anikaiDetails, getTitle]);





  const handleToggleBackendWatchlist = () => {
    if (!user) return triggerAuthToast("Sign in to manage your watchlist");
    setShowWatchlistDropdown(!showWatchlistDropdown);
  };

  const handleUpdateWatchlistStatus = async (status) => {
    if (!user) return triggerAuthToast("Sign in to manage your watchlist");

    setIsWatchlistLoading(true);
    setShowWatchlistDropdown(false);
    try {
      if (status === "Remove") {
        const res = await removeFromWatchlist(id);
        if (res.success) setBackendWatchlist(res.watchlist);
      } else {
        const coverImg = anime.coverImage?.large || anime.coverImage?.extraLarge;
        const res = await addToWatchlist(String(id), getTitle(anime.title), coverImg, status);
        if (res.success) setBackendWatchlist(res.watchlist);
      }
    } catch (err) {
      console.error("Watchlist error:", err);
    } finally {
      setIsWatchlistLoading(false);
    }
  };



  const lastAutoNextTime = useRef(0);
  const autoNextRef = useRef(autoNext);
  useEffect(() => { autoNextRef.current = autoNext; }, [autoNext]);

  // Go to the next episode
  const goNextEpisode = useCallback(() => {
    const now = Date.now();
    if (now - lastAutoNextTime.current < 3000) return;
    lastAutoNextTime.current = now;

    setActiveEpisode(prev => {
      const next = prev + 1;
      if (next <= episodesList.length) {
        return next;
      }
      return prev;
    });
  }, [episodesList.length]);

  const goPrevEpisode = useCallback(() => {
    setActiveEpisode(prev => Math.max(1, prev - 1));
  }, []);

  const iframeRef = useRef(null);
  const lastProgressSync = useRef(0);

  // ── Megaplay Player Events Listener ──
  useEffect(() => {
    const handleMessage = (event) => {
      let data = event.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch {
          // Handle raw string events like "ended" or "complete"
          if (data === "ended" || data === "video_ended" || data === "complete") {
            if (autoNextRef.current) goNextEpisode();
          }
          return;
        }
      }

      if (!data) return;

      // 1. Handle Episode Completion (AutoNext)
      const isComplete =
        data.event === "complete" ||
        data.event === "onComplete" ||
        data.event === "ended" ||
        data.event === "finish" ||
        data.type === "complete" ||
        data.type === "ended" ||
        data.status === "completed" ||
        data.status === "finished" ||
        (data.event === "state" && data.data === "completed") ||
        data.message === "ended";

      if (isComplete) {
        if (autoNextRef.current) {
          console.info("[Player] Video ended, moving to next episode...");
          goNextEpisode();
        }
      }

      // AutoSkip Logic Removed


      // 3. Track Progress for Continue Watching
      // Robustly extract time and duration from various player message structures
      const getNum = (...vals) => {
        for (const val of vals) {
          const num = Number(val);
          if (!isNaN(num) && typeof num === 'number' && num > 0) return num;
        }
        return null;
      };

      const currentTime = getNum(
        data.currentTime, data.time, data.seconds, data.position,
        data.progress?.seconds, data.progress?.position,
        data.data?.currentTime, data.data?.position, data.data?.seconds,
        data.value?.currentTime, data.value?.position
      );

      const duration = getNum(
        data.duration, data.totalTime,
        data.progress?.duration,
        data.data?.duration,
        data.value?.duration
      );

      if (user && currentTime && currentTime > 0) {
        const now = Date.now();
        // Instant sync: update every 2 seconds instead of 10
        if (now - lastProgressSync.current > 2000) {
          lastProgressSync.current = now;
          const coverImg = anime?.coverImage?.large || anime?.coverImage?.extraLarge;

          updateProgress(String(id), activeEpisode, Math.floor(currentTime), duration ? Math.floor(duration) : null, getTitle(anime?.title), coverImg)
            .then(res => {
              if (res.success && res.progress) {
                setGlobalProgress(prev => {
                  const filtered = prev.filter(p => p.animeId !== String(id));
                  return [res.progress, ...filtered].slice(0, 100);
                });
              }
            })
            .catch(err => console.error("Failed to sync progress:", err));
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [goNextEpisode, skipTimes, activeEpisode, user, id, anime, getTitle, setGlobalProgress]); // Removed autoNext from deps, using autoNextRef instead for stability

  // ── Performance: Prefetch Next Episode ──
  const prefetchNextEpisode = useCallback(async (nextEpNum) => {
    if (!anikaiEpisodes.length || (activeServer !== 1 && activeServer !== 5)) return;

    const nextEp = anikaiEpisodes.find(e => String(e.number) === String(nextEpNum));
    if (!nextEp || streamCache.current.has(`${nextEp.id}-sub`)) return;

    try {
      // Use background fetch to avoid blocking main thread
      axios.get(`${PYTHON_API}/api/anikai/stream/${nextEp.id}`, {
        params: { lang: 'sub' }
      }).then(resp => {
        if (resp.data?.success && Array.isArray(resp.data.sources) && resp.data.sources.length > 0) {
          streamCache.current.set(`${nextEp.id}-sub`, resp.data);
          console.info(`[Prefetch] Cached Ep ${nextEpNum} (SUB)`);
        }
      }).catch(err => {
        console.warn(`[Prefetch] Failed for Ep ${nextEpNum}:`, err);
      });
    } catch (err) {
      console.error(`[Prefetch] Error for Ep ${nextEpNum}:`, err);
    }
  }, [anikaiEpisodes, activeServer]);

  // 🚀 Auto-select best sub-server when availableServers or activeServer changes 🚀
  useEffect(() => {
    if (!availableServers.length) return;

    if (activeServer === 1) {
      const s1 = availableServers.find(s =>
        (s.name.toLowerCase().includes('mega') || s.name.toLowerCase().includes('server 1')) &&
        (playerLang === 'dub' ? (s.lang || "").toLowerCase() === 'dub' : ["sub", "softsub", "hardsub", "raw"].includes((s.lang || "sub").toLowerCase()))
      );
      if (s1 && s1.link_id !== selectedServerId) setSelectedServerId(s1.link_id);
    } else if (activeServer === 5) {
      const s5 = availableServers.find(s => {
        const isFilemoon = s.name.toLowerCase().includes('filemoon') || s.name.toLowerCase().includes('server 5');
        const sLang = (s.lang || "sub").toLowerCase();
        const isMatch = playerLang === "sub"
          ? ["sub", "softsub", "hardsub", "raw"].includes(sLang)
          : sLang === "dub";
        return isFilemoon && isMatch;
      });
      if (s5 && s5.link_id !== selectedServerId) setSelectedServerId(s5.link_id);
    }
  }, [availableServers, activeServer, playerLang, selectedServerId]);

  // ── Stream Logic: Fetch iframe URL for the active episode ──
  useEffect(() => {
    let cancelled = false;

    const fetchStream = async () => {
      if (cancelled) return;

      console.info(`[Player] Fetching stream: Episode ${activeEpisode}, Lang: ${playerLang}, Server: ${activeServer}`);

      // --- OPTIMIZATION: Check Cache First (Only for Anikai Servers) ---
      if (activeServer === 1 || activeServer === 5) {
        const ep = anikaiEpisodes.find(e => String(e?.number) === String(activeEpisode));
        if (ep) {
          const token = ep.id;

          // Fetch available servers for this episode
          try {
            const servers = await getAnikaiServers(token);
            if (!cancelled) {
              setAvailableServers(servers);
              // If current selectedServerId is not in the new list, reset it
              if (selectedServerId && !servers.find(s => s.link_id === selectedServerId)) {
                setSelectedServerId(null);
              }
            }
          } catch (err) {
            console.warn("[Servers] Failed to fetch servers:", err);
          }

          const cacheKey = `${token}-${playerLang}-${selectedServerId || 'auto'}`;
          if (streamCache.current.has(cacheKey)) {
            const cachedData = streamCache.current.get(cacheKey);
            const url = cachedData.iframe_url || (cachedData.sources?.[0]?.url);
            // Verify cache matches requested language
            if (url && cachedData.lang === playerLang) {
              const finalUrl = `${url}#lang=${playerLang}`;
              setStreamData(cachedData);
              setStreamUrl(finalUrl);
              setStreamLoading(false);
              setFetchError(null);
              console.info(`[Player] ⚡ Instant Cache Hit for Ep ${activeEpisode}`);
              // Trigger prefetch for next one anyway
              if (activeEpisode < episodesList.length) prefetchNextEpisode(activeEpisode + 1);
              return;
            }
          }
        }
      }

      setStreamLoading(true);
      setPageLoading(true);
      setFetchError(null);
      setStreamUrl("");
      setStreamData(null);
      setIframeLoaded(false);

      try {
        let url = "";

        // --- SERVER 1: ANIKAI INTEGRATION (Optimized with Caching & Parallel Fetching) ---
        if (activeServer === 1) {
          if (!anikaiEpisodes || anikaiEpisodes.length === 0) {
            console.info("[Player] Anikai episodes not loaded yet, waiting...");
            return;
          }

          const ep = anikaiEpisodes.find(e => String(e?.number) === String(activeEpisode));
          if (!ep) {
            console.error(`[Player] Episode ${activeEpisode} not found. Available:`, anikaiEpisodes.map(e => e.number));
            setFetchError(`Episode ${activeEpisode} not found on Anikai.`);
            setStreamLoading(false);
            return;
          }

          const token = ep.id;
          const cacheKey = `${token}-${playerLang}-${selectedServerId || 'auto'}`;

          // Re-check cache inside try just in case, though we checked above
          if (streamCache.current.has(cacheKey)) {
            const cachedData = streamCache.current.get(cacheKey);
            setStreamData(cachedData);
            url = cachedData.iframe_url || (cachedData.sources?.[0]?.url);
          } else {
            // 2. Parallel Fetch: Request both SUB and DUB to populate cache and speed up toggle
            // But only await the requested language to show UI as fast as possible
            const fetchLang = (lang) => axios.get(`${PYTHON_API}/api/anikai/stream/${token}`, {
              params: {
                lang,
                strict: true,
                server_id: selectedServerId
              },
              timeout: 15000
            }).then(res => res.data).catch(() => null);

            // Start both in parallel
            const subPromise = fetchLang('sub');
            const dubPromise = fetchLang('dub');

            // Wait for requested language with a fallback to avoid crash
            const targetData = await (playerLang === 'sub' ? subPromise : dubPromise);

            if (cancelled) return;

            if (!targetData) {
              setFetchError(`Backend did not respond for ${playerLang.toUpperCase()}.`);
              setStreamLoading(false);
              return;
            }

            const hasContent = (Array.isArray(targetData.sources) && targetData.sources.length > 0) || targetData.iframe_url;

            if (targetData.success && hasContent) {
              streamCache.current.set(cacheKey, targetData);
              setStreamData(targetData);
              url = targetData.iframe_url || (targetData.sources?.[0]?.url);

              // Background: Populate other language cache
              const otherData = await (playerLang === 'sub' ? dubPromise : subPromise);
              const hasOtherContent = otherData?.success && ((Array.isArray(otherData.sources) && otherData.sources.length > 0) || otherData.iframe_url);
              if (hasOtherContent) {
                streamCache.current.set(`${token}-${playerLang === 'sub' ? 'dub' : 'sub'}`, otherData);
              }
            } else {
              setFetchError(`No ${playerLang.toUpperCase()} sources found for this episode.`);
              setStreamLoading(false);
              return;
            }
          }

          // 3. Trigger Prefetch for Next Episode
          if (activeEpisode < episodesList.length) {
            prefetchNextEpisode(activeEpisode + 1);
          }
        }

        // --- SERVER 4: MEGAPLAY INTEGRATION (MAL) ---
        else if (activeServer === 4) {
          if (anime?.idMal) {
            const langParam = playerLang.toLowerCase() === 'dub' ? 'dub' : 'sub';
            url = `https://megaplay.buzz/stream/mal/${anime.idMal}/${activeEpisode}/${langParam}`;
            setStreamData({ server_name: "SERVER 4 (MAL)", lang: langParam });
          } else {
            setFetchError("MAL ID not found for this anime. Try Server 3.");
          }
        }

        // --- SERVER 3: MEGAPLAY INTEGRATION (AniList) ---
        else if (activeServer === 3) {
          const langParam = playerLang.toLowerCase() === 'dub' ? 'dub' : 'sub';
          url = `https://megaplay.buzz/stream/ani/${id}/${activeEpisode}/${langParam}`;
          setStreamData({ server_name: "SERVER 3 (AniList)", lang: langParam });
        }

        // --- SERVER 5: ANIKAI FILEMOON ---
        else if (activeServer === 5) {
          if (!anikaiEpisodes || anikaiEpisodes.length === 0) return;
          const ep = anikaiEpisodes.find(e => String(e?.number) === String(activeEpisode));
          if (!ep) return;

          const token = ep.id;
          const cacheKey = `${token}-${playerLang}-${selectedServerId || 'auto'}`;

          if (streamCache.current.has(cacheKey)) {
            const cachedData = streamCache.current.get(cacheKey);
            setStreamData(cachedData);
            url = cachedData.iframe_url || (cachedData.sources?.[0]?.url);
          } else {
            const res = await axios.get(`${PYTHON_API}/api/anikai/stream/${token}`, {
              params: { lang: playerLang, strict: true, server_id: selectedServerId },
              timeout: 15000
            });
            if (res.data?.success) {
              streamCache.current.set(cacheKey, res.data);
              setStreamData(res.data);
              url = res.data.iframe_url || (res.data.sources?.[0]?.url);
            }
          }
        }

        // --- SERVER 2: ALLANIME INTEGRATION ---
        else if (activeServer === 2) {
          if (allanimeId) {
            const mode = playerLang.toLowerCase() === 'dub' ? 'dub' : 'sub';
            url = `${ALLANIME_API}/play?show_id=${allanimeId}&ep_no=${activeEpisode}&mode=${mode}&quality=${videoQuality}`;
            setStreamData({ server_name: "SERVER 2 (Allanime)", lang: mode, quality: videoQuality });
          } else {
            setFetchError("Allanime ID not resolved yet. Please wait or try another server.");
          }
        }



        if (url) {
          // Inject Autoplay and premium params
          try {
            const urlObj = new URL(url);
            if (autoPlay) {
              urlObj.searchParams.set("autoplay", "1");
              // Browser Policy: Autoplay is only allowed if the video is muted.
              // We mute it so it starts automatically as requested, and user can unmute.
              urlObj.searchParams.set("muted", "1");
            } else {
              urlObj.searchParams.set("muted", "0");
            }

            // FORCE REFRESH: Append a hash to ensure unique URL per language
            // This forces React to destroy the iframe and create a new one.
            const finalUrl = `${urlObj.toString()}#lang=${playerLang}`;
            setStreamUrl(finalUrl);
            console.log(`[Player] Final Stream URL injected into iframe: ${finalUrl}`);
          } catch {
            // Fallback for non-URL strings
            const finalUrl = `${url}#lang=${playerLang}`;
            setStreamUrl(finalUrl);
            console.log(`[Player] Final Stream URL (Fallback) injected: ${finalUrl}`);
          }
        } else {
          setFetchError("Stream link not found for this server.");
        }
      } catch (err) {
        setFetchError(err.response?.data?.error || "Failed to fetch stream.");
      } finally {
        setStreamLoading(false);
      }
    };

    fetchStream();

    return () => { cancelled = true; };
  }, [id, anime?.id, anime?.idMal, activeEpisode, playerLang, activeServer, selectedServerId, anikaiEpisodes, allanimeId, autoPlay, videoQuality, episodesList.length, prefetchNextEpisode, setPageLoading]);

  const handleReport = () => {
    setShowReportModal(true);
  };

  const submitReport = async () => {
    console.info(`[Report] Submitting report for Anime ID: ${id}, Episode: ${activeEpisode}`, reportDetails);
    
    // Simulate API call
    setReportSuccess(true);
    setShowReportModal(false);
    setReportDetails({ issues: [], other: "" });
    
    setTimeout(() => setReportSuccess(false), 5000);
  };

  const toggleReportIssue = (issue) => {
    setReportDetails(prev => ({
      ...prev,
      issues: prev.issues.includes(issue) 
        ? prev.issues.filter(i => i !== issue)
        : [...prev.issues, issue]
    }));
  };

  const handleSaveSkipTime = (episodeNum, start, end) => {
    setSkipTimes(prev => ({ ...prev, [episodeNum]: { start, end } }));
    setShowSkipModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center text-white p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Anime Not Found</h1>
        <p className="text-white/40 text-sm max-w-md">
          We couldn't retrieve the details for this anime (ID: {id}).
          This could be a connectivity issue with the AniList API or an invalid ID.
        </p>
        <div className="mt-8 p-4 bg-white/5 rounded border border-white/10 text-[10px] font-mono text-left">
          <p className="text-red-500 mb-1">// Debug Info</p>
          <p>ID: {id}</p>
          <p>API: {PYTHON_API || "Relative (Origin)"}</p>
          <p>Status: Loading Finished (No Data)</p>
        </div>
        <Link to="/home" className="mt-8 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors text-sm font-bold">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans text-white relative bg-transparent overflow-x-hidden ${isFocusMode ? "overflow-hidden" : ""}`}>
      {!isFocusMode && <Navbar />}

      {/* Focus Mode Curtain */}
      {isFocusMode && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[35] transition-all duration-700 animate-in fade-in cursor-pointer"
          onClick={() => setIsFocusMode(false)}
        />
      )}

      <main className={`${isFocusMode ? 'pt-0' : 'pt-[60px]'} max-w-[1720px] mx-auto px-2 lg:px-4 transition-all duration-500`}>

        {/* Main Media Grid */}
        <div className={`flex flex-col lg:grid lg:gap-6 ${isFocusMode ? 'lg:grid-cols-1' : 'lg:grid-cols-4'} transition-all duration-500 mt-4`}>

          {/* LEFT COLUMN: Player + Controls */}
          <div className={`${isFocusMode ? 'lg:col-span-1 fixed inset-0 z-40 flex flex-col items-center justify-center p-4 lg:p-12 pointer-events-none' : 'lg:col-span-3'}`}>

            {/* Breadcrumbs */}
            {!isFocusMode && (
              <div
                className="bg-[#121418] border-x border-t border-white/5 px-5 py-3 flex items-center justify-between"
                style={{ clipPath: 'polygon(15px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 15px)' }}
              >
                <nav className="flex items-center gap-2 text-[13px] font-medium text-white/40 overflow-x-auto whitespace-nowrap scrollbar-hide">
                  <Link to="/home" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <HomeIcon size={14} className="mb-0.5" />
                    Home
                  </Link>
                  <span className="text-white/10 font-light">/</span>
                  <span className="hover:text-white transition-colors uppercase cursor-pointer">{anime.format || "TV"}</span>
                  <span className="text-white/10 font-light">/</span>
                  <span className="text-white/60 truncate max-w-[200px] md:max-w-none">{getTitle(anime.title)}</span>
                </nav>
              </div>
            )}

            {/* Video Player Container */}
            <section className={`relative w-full aspect-video bg-[#000] overflow-hidden border-x border-white/5 shadow-2xl transition-all duration-500 ${isFocusMode ? 'max-w-[90vw] max-h-[85vh] pointer-events-auto ring-1 ring-white/10 rounded-sm' : ''}`}>
              {/* Loader & Error Overlay */}
              {((streamLoading || (streamUrl && !iframeLoaded)) || (!streamLoading && (!streamUrl || fetchError))) && (
                <div className="absolute inset-0 z-20 group">
                  <img
                    src={currentEpisodeImage}
                    alt="Poster"
                    key={activeEpisode}
                    className={`absolute inset-0 w-full h-full object-cover z-0 transition-all duration-700 animate-in fade-in fill-mode-both ${fetchError || (!streamLoading && !streamUrl) ? 'brightness-[0.7]' : 'brightness-[0.4]'}`}
                  />
                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 text-center">
                    {(streamLoading || (streamUrl && !iframeLoaded)) && activeServer !== 2 ? (
                      <div className="flex flex-col items-center gap-4 transition-all duration-300">
                        <div className="w-10 h-10 border-[3px] border-red-600 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(220,38,38,0.3)]"></div>
                        <p className="text-white/20 text-[8px] font-bold uppercase tracking-[0.3em] animate-pulse">Loading...</p>
                      </div>
                    ) : (
                      <div className="animate-in fade-in zoom-in-95 duration-300"><div /></div>
                    )}
                  </div>
                </div>
              )}

              {/* Player */}
              {streamUrl && (
                activeServer === 2 ? (
                  <ArtPlayer
                    skipTimes={skipTimes[activeEpisode]}
                    key={`${id}-${activeEpisode}-${activeServer}-${videoQuality}`}
                    src={streamUrl}
                    poster={anime?.coverImage?.extraLarge || anime?.coverImage?.large}
                    initialTime={initialTime}
                    videoQuality={videoQuality}
                    availableQualities={availableQualities}
                    onQualityChange={(q) => { setVideoQuality(q); localStorage.setItem("videoQuality", q); }}
                    onReady={() => setIframeLoaded(true)}
                    onEnded={() => {
                      if (autoNext && activeEpisode < episodesList.length) {
                        const nextEp = episodesList.find(e => e.number === activeEpisode + 1);
                        if (nextEp) setActiveEpisode(nextEp.number);
                      }
                    }}
                  />
                ) : streamData?.sources && Array.isArray(streamData.sources) && streamData.sources.length > 0 && !streamData?.iframe_url ? (
                  <VideoPlayer
                    skipTimes={skipTimes[activeEpisode]}
                    src={streamData.sources[0].url}
                    type={streamData.sources[0].type}
                    poster={anime?.coverImage?.extraLarge || anime?.coverImage?.large}
                    subtitles={streamData.subtitles || []}
                    initialTime={initialTime}
                    onReady={() => setIframeLoaded(true)}
                    onEnded={() => {
                      if (autoNext && activeEpisode < episodesList.length) {
                        const nextEp = episodesList.find(e => e.number === activeEpisode + 1);
                        if (nextEp) setActiveEpisode(nextEp.number);
                      }
                    }}
                  />
                ) : (
                  <iframe
                    ref={iframeRef}
                    key={`${activeServer}-${activeEpisode}-${playerLang}-${streamUrl}`}
                    src={streamUrl}
                    onLoad={() => setIframeLoaded(true)}
                    className={`w-full h-full border-0 transition-opacity duration-500 ${!iframeLoaded ? 'opacity-0' : 'opacity-100'}`}
                    allowFullScreen
                    scrolling="no"
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  />
                )
              )}
            </section>

            {/* Player Toolbar + Server Selector */}
            <PlayerToolbar
              isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode}
              autoNext={autoNext} setAutoNext={setAutoNext}
              autoPlay={autoPlay} setAutoPlay={setAutoPlay}
              activeEpisode={activeEpisode} episodesList={episodesList}
              goPrevEpisode={goPrevEpisode} goNextEpisode={goNextEpisode}
              playerLang={playerLang} setPlayerLang={setPlayerLang}
              hasSub={hasSub} hasDub={hasDub}
              activeServer={activeServer} setActiveServer={setActiveServer}
              isBookmarked={isBookmarked} isWatchlistLoading={isWatchlistLoading}
              handleToggleBackendWatchlist={handleToggleBackendWatchlist}
              showWatchlistDropdown={showWatchlistDropdown} setShowWatchlistDropdown={setShowWatchlistDropdown}
              backendWatchlist={backendWatchlist} handleUpdateWatchlistStatus={handleUpdateWatchlistStatus}
              id={id} handleReport={handleReport} reportSuccess={reportSuccess} user={user}
            />

            {/* Next Episode Banner */}
            {!isFocusMode && (
              <div className="border-t border-white/5 bg-[#0d0d0d]/50">
                <NextEpisodeBanner anime={anime} />
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Episodes Sidebar */}
          {!isFocusMode && (
            <EpisodeSidebar
              filteredEpisodes={filteredEpisodes}
              episodeLayout={episodeLayout} setEpisodeLayout={setEpisodeLayout}
              episodePage={episodePage} setEpisodePage={setEpisodePage}
              EPISODES_PER_PAGE={EPISODES_PER_PAGE}
              activeEpisode={activeEpisode} setActiveEpisode={setActiveEpisode}
              watchedEpisodes={watchedEpisodes}
              isEpisodeSearchOpen={isEpisodeSearchOpen} setIsEpisodeSearchOpen={setIsEpisodeSearchOpen}
              episodeSearchQuery={episodeSearchQuery} setEpisodeSearchQuery={setEpisodeSearchQuery}
              malEpisodes={malEpisodes} kitsuEpisodes={kitsuEpisodes} anime={anime}
            />
          )}
        </div>

        {/* Seasons */}
        {!isFocusMode && (
          <SeasonsSection stableSeasons={stableSeasons} getTitle={getTitle} />
        )}

        {/* Anime Details */}
        {!isFocusMode && (
          <AnimeDetailsSection
            anime={anime} resolvedInfo={resolvedInfo} getTitle={getTitle}
            id={id} activeServer={activeServer} streamUrl={streamUrl}
            userRating={userRating} setUserRating={setUserRating}
          />
        )}

        {/* Characters + Comments */}
        {!isFocusMode && (
          <section className="py-16 border-t border-white/5 space-y-20 animate-in fade-in duration-1000">
            <CharactersSection characters={anime.characters} />
            <CustomCommentSection
              animeId={id}
              animeTitle={getTitle(anime.title)}
              episode={activeEpisode}
              relations={relations}
              recommendations={recommendations}
            />
          </section>
        )}

      </main>

      {/* Footer */}
      {!isFocusMode && <Footer />}

      {/* Modals */}
      {showSkipModal && (
        <SkipTimeModal
          activeEpisode={activeEpisode}
          skipTimes={skipTimes}
          onSave={handleSaveSkipTime}
          onClose={() => setShowSkipModal(false)}
        />
      )}

      {/* Report Toast */}
      {reportSuccess && (
        <div className="fixed bottom-10 right-10 z-[100] flex items-center gap-4 bg-[#0a0a0a]/90 backdrop-blur-xl border border-green-500/30 text-white px-6 py-4 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-right duration-500">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <span className="text-green-500 text-lg">✓</span>
          </div>
          <div>
            <p className="text-[14px] font-bold text-white leading-tight">Thank You!</p>
            <p className="text-[11px] text-white/40 font-medium uppercase tracking-widest mt-1">Report submitted successfully</p>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          activeEpisode={activeEpisode}
          reportDetails={reportDetails}
          setReportDetails={setReportDetails}
          toggleReportIssue={toggleReportIssue}
          submitReport={submitReport}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
