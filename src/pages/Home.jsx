import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getTrendingAnime,
  getPopularAnime,
  getNewReleases,
  getPopularThisSeason,
  getBrowseAnime,
  getRecentDubs,
} from "../services/api";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Hero from "../components/home/Hero";
import AnimeRow from "../components/home/AnimeRow";
import { useAuth } from "../hooks/useAuth";
import ShareBanner from "../components/common/ShareBanner";
import Pagination from "../components/common/Pagination";
import ThreeColumnSection from "../components/home/ThreeColumnSection";
import AlphabetNav from "../components/home/AlphabetNav";
import EstimatedSchedule from "../components/home/EstimatedSchedule";
import { removeProgress } from "../services/progressService";

export default function Home() {
  const { globalProgress, setGlobalProgress, user } = useAuth();
  const [activeSeasonTab, setActiveSeasonTab] = useState("All");
  const cardsPerPage = 36;

  // Pagination States
  const [seasonPage, setSeasonPage] = useState(1);

  // Helper to scroll to top of section when page changes
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: "smooth"
      });
    }
  };

  // --- FAST LOAD CACHING LOGIC ---
  const getCached = (key) => {
    try {
      const data = localStorage.getItem(`cache_home_${key}`);
      return data ? JSON.parse(data) : undefined;
    } catch { return undefined; }
  };
  const setCache = (key, data) => {
    try {
      localStorage.setItem(`cache_home_${key}`, JSON.stringify(data));
    } catch (e) { console.warn("Cache write failed:", e); }
  };

  const getStableDubPage = async (page) => {
    const startIndex = (page - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    const collected = [];
    const seen = new Set();
    let sourcePage = 1;
    let guard = 0;

    while (collected.length < endIndex && guard < 20) {
      const dubRes = await getRecentDubs(sourcePage, cardsPerPage);
      const media = dubRes.media || [];

      media.forEach((anime) => {
        const key = String(
          anime.id ?? `${anime.title?.romaji || anime.title?.english || "unknown"}-${anime.episodes || ""}`
        );
        if (seen.has(key)) return;
        seen.add(key);
        collected.push(anime);
      });

      if (!dubRes.pageInfo?.hasNextPage) break;
      sourcePage += 1;
      guard += 1;
    }

    const pageMedia = collected.slice(startIndex, endIndex);
    const hasNextDubPage = collected.length > endIndex || (sourcePage > 1 && guard < 20);
    const dubLastPage = hasNextDubPage ? page + 1 : page;

    return {
      media: pageMedia,
      pageInfo: {
        total: collected.length,
        currentPage: page,
        lastPage: dubLastPage,
        hasNextPage: hasNextDubPage,
        perPage: cardsPerPage,
      },
    };
  };

  const { data: trendingData, isLoading: loadingTrending } = useQuery({
    queryKey: ["trending"],
    queryFn: async () => {
      const res = await getTrendingAnime(1);
      if (res?.media) setCache("trending", res);
      return res;
    },
    placeholderData: getCached("trending"),
    staleTime: 1000 * 60 * 30, // 30 mins
  });
  const trending = trendingData?.media || [];

  const { data: popularData, isLoading: loadingPopular } = useQuery({
    queryKey: ["popular"],
    queryFn: async () => {
      const res = await getPopularAnime(1);
      if (res?.media) setCache("popular", res);
      return res;
    },
    placeholderData: getCached("popular"),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
  const popular = popularData?.media || [];

  const { data: popularThisSeasonData, isLoading: loadingSeason } = useQuery({
    queryKey: ["popularThisSeason", activeSeasonTab, seasonPage],
    queryFn: async () => {
      let res;
      if (activeSeasonTab === "Dub") {
        res = await getStableDubPage(seasonPage);
      } else if (activeSeasonTab === "China") {
        const chinaRes = await getBrowseAnime({
          page: seasonPage,
          perPage: cardsPerPage,
          country: "CN",
          sort: ["POPULARITY_DESC"],
        });
        res = {
          ...chinaRes,
          media: (chinaRes.media || []).filter((anime) => anime.countryOfOrigin === "CN"),
        };
      } else {
        res = await getPopularThisSeason(seasonPage);
      }

      if (seasonPage === 1 && activeSeasonTab === "All" && res?.media) {
        setCache("season", res);
      }
      return res;
    },
    placeholderData: (seasonPage === 1 && activeSeasonTab === "All") ? getCached("season") : undefined,
    staleTime: 1000 * 60 * 60,
  });
  const popularThisSeason = popularThisSeasonData?.media || [];
  const seasonInfo = popularThisSeasonData?.pageInfo || { lastPage: 1 };

  const { data: newReleasesData = [], isLoading: loadingNew } = useQuery({
    queryKey: ["newReleases"],
    queryFn: async () => {
      const res = await getNewReleases(1);
      if (res?.media) setCache("new", res);
      return res;
    },
    placeholderData: getCached("new"),
    staleTime: 1000 * 60 * 15, // 15 mins
  });
  const newReleases = newReleasesData?.media || [];


  const handleRemoveProgress = async (animeId) => {
    // Optimistic update
    setGlobalProgress(prev => prev.filter(p => p.animeId !== animeId));
    try {
      await removeProgress(animeId);
    } catch (error) {
      console.error("Failed to remove progress:", error);
    }
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative bg-[#050505]">
      {/* Optimized Dynamic Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ willChange: 'transform' }}>
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-red-600/[0.08] blur-[100px] rounded-full animate-pulse" />
        <div className="absolute top-[30%] right-[-20%] w-[50%] h-[50%] bg-red-600/[0.06] blur-[90px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[10%] w-[50%] h-[50%] bg-red-600/[0.05] blur-[100px] rounded-full animate-pulse" />
        <div className="absolute top-[60%] left-[40%] w-[40%] h-[40%] bg-red-600/[0.04] blur-[80px] rounded-full" />
      </div>

      <div className="relative z-10">
        <Navbar />
      <Hero data={trendingData?.media} />

      <ShareBanner />

      {/* Continue Watching */}
      {user && globalProgress && globalProgress.length > 0 && (
        <div id="continue-watching" className="pt-8 md:pt-6">
          <AnimeRow
            title="CONTINUE WATCHING"
            data={globalProgress.map(p => ({
              id: p.animeId,
              title: { english: p.title },
              coverImage: { large: p.coverImage },
              episode: p.episode,
              currentTime: p.currentTime,
              duration: p.duration,
              isProgress: true
            }))}
            isLoading={false}
            isScrollable={true}
            onRemove={handleRemoveProgress}
          />
        </div>
      )}

      {/* Popular This Season */}
      <div id="popular-season" className="pt-8 md:pt-6">
        <AnimeRow
          title="POPULAR THIS SEASON"
          data={popularThisSeason}
          isLoading={loadingSeason}
          limit={cardsPerPage}
          tabs={["All", "Sub", "Dub", "China"]}
          activeTab={activeSeasonTab}
          onTabChange={(tab) => {
            setActiveSeasonTab(tab);
            setSeasonPage(1);
          }}
        />
        <Pagination
          currentPage={seasonPage}
          totalPages={seasonInfo.lastPage > 4 ? 4 : seasonInfo.lastPage}
          onPageChange={(p) => {
            setSeasonPage(p);
            scrollToSection("popular-season");
          }}
        />
      </div>



      {/* Three-column section */}
      <div className="py-12 lg:py-20">
        <ThreeColumnSection
          newReleases={newReleases}
          mostViewed={popular}
          justCompleted={trending}
          isLoading={loadingTrending || loadingPopular || loadingNew}
        />
      </div>

      {/* Airing Schedule Section */}
      <div className="py-12 lg:py-20 bg-white/[0.02]">
        <EstimatedSchedule />
      </div>

      {/* Alphabet navigation */}
      <div className="py-12 lg:py-20">
        <AlphabetNav />
      </div>
      <Footer />
      </div>
    </div>
  );
}
