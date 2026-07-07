import { useState, useEffect } from "react";

/**
 * useStreamFetch
 * Fetches the stream iframe URL based on active episode, language, and server.
 * Supports 5 servers: Megaplay (MAL), Megaplay (AniList), Tryembed, Vidnest, Anineko.
 * Manages streamUrl, streamData, loading, error, and iframe loaded states.
 */
export function useStreamFetch({
  id,
  anime,
  activeEpisode,
  playerLang,
  activeServer,
  autoPlay,
  setPageLoading,
  isMal,
  initialTime = 0,
}) {
  const [streamUrl, setStreamUrl] = useState("");
  const [streamData, setStreamData] = useState(null);
  const [streamLoading, setStreamLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Sync global page loader with iframe loading
  useEffect(() => {
    if (
      iframeLoaded ||
      fetchError ||
      (streamUrl && streamData && !streamData.iframe_url && !streamLoading)
    ) {
      setTimeout(() => setPageLoading(false), 0);
    }
  }, [iframeLoaded, fetchError, streamUrl, streamData, streamLoading, setPageLoading]);

  // Clean up loading state on unmount
  useEffect(() => {
    return () => setPageLoading(false);
  }, [setPageLoading]);

  // Reset iframe loading state whenever the URL changes
  useEffect(() => {
    setTimeout(() => {
      if (streamUrl) {
        setIframeLoaded(false);
      } else {
        setIframeLoaded(true);
      }
    }, 0);
  }, [streamUrl]);

  // ── Main stream fetch logic ──
  useEffect(() => {
    let cancelled = false;

    const fetchStream = async () => {
      if (cancelled) return;

      console.info(
        `[Player] Fetching stream: Episode ${activeEpisode}, Lang: ${playerLang}, Server: ${activeServer}`
      );

      setStreamLoading(true);
      setPageLoading(true);
      setFetchError(null);
      setStreamUrl("");
      setStreamData(null);
      setIframeLoaded(false);

      // Force a tiny delay to ensure the iframe is completely destroyed in the DOM
      await new Promise((resolve) => setTimeout(resolve, 50));

      try {
        let url = "";

        // --- SERVER 1: NEW ANIKO 2 ---
        let hasSources = false;
        if (activeServer === 1) {
          const langParam = playerLang.toLowerCase() === "dub" ? "dub" : "sub";
          const anilistId = anime?.id || (!isMal ? id : null);
          const aniko2Base = import.meta.env.VITE_ANIKO2_API;

          if (anilistId) {
            try {
              const res = await fetch(`${aniko2Base}/api/watch/${anilistId}/${langParam}/${activeEpisode}`);
              if (!res.ok) throw new Error("Failed to fetch Server 1");
              const data = await res.json();
              
              const audioKey = langParam === "sub" ? "ssub" : "sdub";
              const providerData = data[audioKey];
              
              if (providerData && providerData.streams && providerData.streams.length > 0) {
                const hasHls = providerData.streams.some(s => s.type === "hls");
                
                if (hasHls) {
                  setStreamData({
                    server_name: "SERVER 1 (New Aniko2)",
                    lang: langParam,
                    all_streams: providerData.streams,
                    subtitles: providerData.subtitles || []
                  });
                  hasSources = true;
                } else {
                  url = providerData.streams[0].url;
                  setStreamData({
                    server_name: "SERVER 1 (New Aniko2)",
                    lang: langParam,
                    all_streams: providerData.streams,
                    subtitles: providerData.subtitles || [],
                  });
                }
              } else {
                setFetchError("No valid video source found on Server 1.");
              }
            } catch {
              setFetchError("Error fetching from Server 1.");
            }
          } else {
            setFetchError("AniList ID is required for Server 1. Try another server.");
          }
        }

        // --- SERVER 2: MEGAPLAY (MAL ID) ---
        else if (activeServer === 2) {
          const langParam =
            playerLang.toLowerCase() === "dub" ? "dub" : "sub";
          const megaBase =
            import.meta.env.VITE_MEGAPLAY_URL || "";

          if (anime?.idMal || isMal) {
            const malId = anime?.idMal || id;
            url = `${megaBase}/stream/mal/${malId}/${activeEpisode}/${langParam}`;
            setStreamData({ server_name: "SERVER 2 (MAL)", lang: langParam });
          } else if (anime?.id || !isMal) {
            const anilistId = anime?.id || id;
            url = `${megaBase}/stream/ani/${anilistId}/${activeEpisode}/${langParam}`;
            setStreamData({
              server_name: "SERVER 2 (AniList-Fallback)",
              lang: langParam,
            });
          } else {
            setFetchError("Stream ID not found. Try another server.");
          }
        }

        // --- SERVER 3: ANIKO BACKUP ---
        else if (activeServer === 3) {
          const langParam = playerLang.toLowerCase() === "dub" ? "dub" : "sub";
          const anilistId = anime?.id || (!isMal ? id : null);
          const anikoBase = import.meta.env.VITE_ANIKO_API || "http://localhost:3000";

          if (anilistId) {
            try {
              const res = await fetch(`${anikoBase}/api/watch/${anilistId}/${langParam}/${activeEpisode}`);
              if (!res.ok) throw new Error("Failed to fetch Server 3");
              const data = await res.json();
              
              const audioKey = langParam === "sub" ? "ssub" : "sdub";
              const providerData = data[audioKey];
              
              if (providerData && providerData.streams && providerData.streams.length > 0) {
                const hasHls = providerData.streams.some(s => s.type === "hls");
                
                if (hasHls) {
                  setStreamData({
                    server_name: "SERVER 3 (Aniko)",
                    lang: langParam,
                    all_streams: providerData.streams,
                    subtitles: providerData.subtitles || []
                  });
                  hasSources = true;
                } else {
                  url = providerData.streams[0].url;
                  setStreamData({
                    server_name: "SERVER 3 (Aniko)",
                    lang: langParam,
                    all_streams: providerData.streams,
                    subtitles: providerData.subtitles || [],
                  });
                }
              } else {
                setFetchError("No valid video source found on Server 3.");
              }
            } catch {
              setFetchError("Error fetching from Server 3.");
            }
          } else {
            setFetchError("AniList ID is required for Server 3. Try another server.");
          }
        }

        // --- SERVER 4: MEGAPLAY (AniList ID) ---
        else if (activeServer === 4) {
          const langParam =
            playerLang.toLowerCase() === "dub" ? "dub" : "sub";
          const megaBase =
            import.meta.env.VITE_MEGAPLAY_URL || "";

          const anilistId = anime?.id || (!isMal ? id : null);

          if (anilistId) {
            url = `${megaBase}/stream/ani/${anilistId}/${activeEpisode}/${langParam}`;
            setStreamData({
              server_name: "SERVER 4 (AniList)",
              lang: langParam,
            });
          } else if (anime?.idMal || isMal) {
            const malId = anime?.idMal || id;
            url = `${megaBase}/stream/mal/${malId}/${activeEpisode}/${langParam}`;
            setStreamData({
              server_name: "SERVER 4 (MAL-Fallback)",
              lang: langParam,
            });
          } else {
            setFetchError("Stream ID not found. Try another server.");
          }
        }

        // --- SERVER 5: VIDNEST (AniList ID - Embed Anime) ---
        else if (activeServer === 5) {
          const langParam =
            playerLang.toLowerCase() === "dub" ? "dub" : "sub";
          const anilistId = anime?.id || (!isMal ? id : null);

          if (anilistId) {
            url = `https://vidnest.fun/anime/${anilistId}/${activeEpisode}/${langParam}`;
            setStreamData({
              server_name: "SERVER 5 (Vidnest)",
              lang: langParam,
            });
          } else {
            setFetchError(
              "AniList ID is required for Server 5. Try another server."
            );
          }
        }

        // --- SERVER 6: ANINEKO (Anivexa API HF Deployment) ---
        else if (activeServer === 6) {
          const langParam = playerLang.toLowerCase() === "dub" ? "dub" : "sub";
          const anilistId = anime?.id || (!isMal ? id : null);

          if (anilistId) {
            try {
              const res = await fetch(`https://anivexaapi-api.hf.space/watch/anineko/${anilistId}/${langParam}/anineko-${activeEpisode}`);
              if (!res.ok) throw new Error("Failed to fetch Server 6");
              const data = await res.json();
              const validStreams = data.streams?.filter(s => s.url && !s.url.includes(".json")) || [];
              if (validStreams.length > 0) {
                const iframeSource = validStreams.find(s => s.embed || s.type === "iframe" || s.type === "embed" || s.url.includes("embed"));
                const source = iframeSource || validStreams.find(s => s.quality === "1080p" || s.quality === "auto" || s.quality === "default") || validStreams[0];
                url = source.embed || (source.type === "embed" ? source.url : source.url);
                setStreamData({
                  server_name: "SERVER 6 (Anineko)",
                  lang: langParam,
                });
              } else {
                setFetchError("No valid video source found on Server 6.");
              }
            } catch {
              setFetchError("Error fetching from Server 6.");
            }
          } else {
            setFetchError("AniList ID is required for Server 6. Try another server.");
          }
        }

        // --- SERVER 7: TRYEMBED (AniList ID) ---
        else if (activeServer === 7) {
          const langParam =
            playerLang.toLowerCase() === "dub" ? "dub" : "sub";
          const anilistId = anime?.id || (!isMal ? id : null);

          if (anilistId) {
            const queryParams = [];
            if (autoPlay) {
              queryParams.push("autoplay=true");
            }
            queryParams.push("autoSkip=true");
            queryParams.push("autoNext=false");
            queryParams.push("lang-type=false");
            
            if (initialTime && initialTime > 0) {
              queryParams.push(`startAt=${Math.floor(initialTime)}`);
            }

            const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
            url = `https://tryembed.us.cc/embed/anime/${anilistId}/${activeEpisode}/${langParam}${queryString}`;

            setStreamData({
              server_name: "SERVER 7 (Tryembed)",
              lang: langParam,
            });
          } else {
            setFetchError(
              "AniList ID is required for Server 7. Try another server."
            );
          }
        }

        if (url) {
          if (activeServer === 2 || activeServer === 4) {
            // Inject Autoplay and premium params for Megaplay
            try {
              const urlObj = new URL(url);
              if (autoPlay) {
                urlObj.searchParams.set("autoplay", "1");
                urlObj.searchParams.set("muted", "1");
              } else {
                urlObj.searchParams.set("muted", "0");
              }

              // Cache buster & language override
              urlObj.searchParams.set("cb", Date.now().toString());
              urlObj.searchParams.set("lang", playerLang.toLowerCase());
              urlObj.searchParams.set("audio", playerLang.toLowerCase());

              const finalUrl = `${urlObj.toString()}#lang=${playerLang}`;
              setStreamUrl(finalUrl);
            } catch {
              const finalUrl = `${url}${url.includes("?") ? "&" : "?"}cb=${Date.now()}#lang=${playerLang}`;
              setStreamUrl(finalUrl);
            }
          } else {
            // Keep Vidnest, Tryembed, Anineko, Aniko URLs clean without Megaplay-specific parameters
            setStreamUrl(url);
          }
        } else if ((activeServer === 1 || activeServer === 3) && hasSources) {
          // If we have HLS sources set for Server 1 or 3, we don't need a URL
          setStreamUrl("");
        } else {
          setFetchError("Stream link not found for this server.");

        }
      } catch (err) {
        console.error(`[Player] Server ${activeServer} Fetch Error:`, err);
        setFetchError(
          err.response?.data?.error ||
            "Failed to fetch stream. Try another server."
        );
      } finally {
        setStreamLoading(false);
      }
    };

    fetchStream();

    return () => {
      cancelled = true;
    };
  }, [
    id,
    anime?.id,
    anime?.idMal,
    activeEpisode,
    playerLang,
    activeServer,
    autoPlay,
    setPageLoading,
    isMal,
    initialTime,
  ]);

  return {
    streamUrl,
    streamData,
    streamLoading,
    fetchError,
    iframeLoaded,
    setIframeLoaded,
  };
}
