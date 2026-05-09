import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../hooks/useAuth";
import { getWatchlist, removeFromWatchlist } from "../services/watchlistService";
import { User, Clock, Heart, Bell, Download, Settings, Search, Filter, ArrowDownUp, ChevronDown } from "lucide-react";

export default function Watchlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("All");

  const navItems = [
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
    { id: "watching", label: "Continue Watching", icon: Clock, path: "/watching" },
    { id: "bookmarks", label: "Bookmarks", icon: Heart, path: "/watchlist" },
    { id: "notifications", label: "Notifications", icon: Bell, path: "/notifications" },
    { id: "import", label: "Import/Export", icon: Download, path: "/import" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" }
  ];

  const subTabs = ["All", "Watching", "On-Hold", "Planning", "Completed", "Dropped"];

  useEffect(() => {
    if (!user) {
      navigate("/"); // Redirect to home if not logged in
      return;
    }

    const fetchWatchlist = async () => {
      const res = await getWatchlist();
      if (res.success) {
        setWatchlist(res.watchlist);
      }
      setIsLoading(false);
    };

    fetchWatchlist();
  }, [user, navigate]);

  const handleRemove = async (animeId, e) => {
    e.preventDefault(); // Prevent navigating to anime details
    const res = await removeFromWatchlist(animeId);
    if (res.success) {
      setWatchlist(res.watchlist);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen text-white">
        <Navbar />
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col font-sans selection:bg-red-500/30">
      <Navbar />

      <div className="w-full pt-[80px] px-4 md:px-8 pb-12 max-w-[1200px] mx-auto flex-1">
        
        {/* Compact Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8 w-full max-w-4xl mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.id === "bookmarks" && location.pathname === "/watchlist");
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 border ${
                  isActive 
                  ? "bg-red-600 text-white border-red-600" 
                  : "bg-white/[0.02] border-white/5 text-white/30 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                <span className="hidden md:block text-[12px] font-bold tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {subTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[11px] font-bold uppercase tracking-wider px-5 py-2 rounded-xl transition-all duration-300 border ${
                activeTab === tab 
                ? "bg-white text-black border-white" 
                : "bg-white/[0.03] text-white/30 border-white/5 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {watchlist.filter(item => activeTab === "All" || item.status === activeTab).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-[#111] border border-white/5 rounded-2xl shadow-xl relative overflow-hidden max-w-3xl mx-auto">
            <div className="relative w-20 h-20 mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <Heart size={32} className="text-white/20" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">
              {activeTab === "All" ? "Collection Empty" : `No ${activeTab} Anime`}
            </h2>
            <p className="text-white/30 mb-8 text-[13px] max-w-xs text-center leading-relaxed">
              Discover new shows and add them to your collection to keep track of your journey!
            </p>
            <Link to="/browse" className="bg-white text-black font-black py-3 px-8 rounded-xl text-[11px] uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95">
              Browse Anime
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {watchlist
              .filter(item => activeTab === "All" || item.status === activeTab)
              .map((item) => {
                const statusColors = {
                  "Watching": "bg-red-600 text-white",
                  "Completed": "bg-emerald-500 text-white",
                  "On-Hold": "bg-amber-500 text-white",
                  "Dropped": "bg-zinc-600 text-white",
                  "Planning": "bg-blue-600 text-white"
                };
                const statusStyle = statusColors[item.status] || "bg-red-600 text-white";

                return (
                  <Link to={`/watch/${item.animeId}`} key={item.animeId} className="group relative flex flex-col gap-3">
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#181818] border border-white/5 shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-1">
                      {item.coverImage ? (
                        <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10 text-[10px] font-black uppercase tracking-widest">No Cover</div>
                      )}
                      
                      {/* Status Tag - Top Left */}
                      <div className="absolute top-2 left-2 z-20">
                         <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-lg shadow-xl backdrop-blur-md border border-white/10 ${statusStyle}`}>
                           {item.status || "PLANNING"}
                         </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={(e) => handleRemove(item.animeId, e)}
                        className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white/40 hover:text-red-500 hover:bg-black p-2 rounded-xl shadow-xl z-20 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove from Watchlist"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <h3 className="text-[13px] font-medium text-white/80 group-hover:text-white transition-colors line-clamp-2 leading-snug px-1">
                      {item.title}
                    </h3>
                  </Link>
                );
              })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
