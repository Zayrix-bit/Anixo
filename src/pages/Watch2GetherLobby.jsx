import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Users } from "lucide-react";
import Watch from "./Watch";
import Navbar from "../components/layout/Navbar";
import { WT_SERVER } from "../services/api";

// Helper function to format time ago
const timeAgo = (timestamp) => {
  if (!timestamp) return "Just now";
  const seconds = Math.floor((new Date() - timestamp) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
};

export default function Watch2GetherLobby() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const room = queryParams.get("room");
  
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState("all"); // 'all', 'live', 'scheduled', 'waiting', 'ended'

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${WT_SERVER}/api/rooms`);
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!room) {
      const loadRooms = () => {
        fetch(`${WT_SERVER}/api/rooms`)
          .then(res => {
            if (!res.ok) throw new Error("Failed to fetch rooms");
            return res.json();
          })
          .then(data => setRooms(data))
          .catch(err => setError(err.message))
          .finally(() => setIsLoading(false));
      };

      loadRooms();
      // Poll every 10 seconds for updates
      const interval = setInterval(loadRooms, 10000);
      return () => clearInterval(interval);
    }
  }, [room]);

  // If a room parameter exists, render Watch in Theater Mode
  if (room) {
    return <Watch isWatch2GetherMode={true} />;
  }

  // Filter rooms based on selected tab
  const filteredRooms = rooms.filter(room => {
    if (filterTab === "all") return true;
    if (filterTab === "live") return room.status === "live";
    if (filterTab === "ended") return room.status === "ended";
    
    if (room.status === "scheduled") {
      const timeRemaining = new Date(room.scheduledFor) - new Date();
      if (filterTab === "scheduled") return timeRemaining >= 900000; // >= 15 mins
      if (filterTab === "waiting") return timeRemaining < 900000;    // < 15 mins
    }
    return false;
  });

  // Otherwise, render the Browse Lobby
  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-white relative">
      <Navbar />
      
      <main className="max-w-[1720px] mx-auto px-4 pt-[100px] pb-12 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse</h1>
          <p className="text-white/50 text-sm">Browse live rooms and join friends watching anime together.</p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'live', label: 'Live' },
              { id: 'scheduled', label: 'Scheduled' },
              { id: 'waiting', label: 'Waiting' },
              { id: 'ended', label: 'Ended' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  filterTab === tab.id 
                    ? "bg-white/10 text-white" 
                    : "bg-transparent hover:bg-white/5 text-white/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rooms Grid */}
        {isLoading && rooms.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-discord-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white/50 text-xs font-bold tracking-widest uppercase">Fetching Rooms...</p>
          </div>
        ) : error ? (
          <div className="w-full py-20 flex flex-col items-center justify-center text-center">
            <p className="text-discord-500 font-bold mb-2">Failed to load rooms</p>
            <p className="text-white/40 text-sm max-w-sm mb-4">Make sure the watch2gether-service is running.</p>
            <button onClick={fetchRooms} className="px-4 py-2 bg-white/10 rounded-lg text-sm font-bold hover:bg-white/20 transition-all">Try Again</button>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white/30" />
            </div>
            <h3 className="text-xl font-bold mb-2">No rooms found</h3>
            <p className="text-white/50 text-sm max-w-md">
              {filterTab === 'all' 
                ? "There are no active Watch Together rooms right now. Be the first to create one!"
                : `There are currently no ${filterTab} rooms available.`}
            </p>
            {filterTab === 'all' && (
              <Link to="/browse" className="mt-5 px-6 py-2.5 bg-discord-600 hover:bg-discord-500 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-discord-500/20">
                Browse Anime
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRooms.map((r) => (
              <Link 
                to={`/watch2gether?room=${r.roomId}`} 
                key={r.roomId}
                className="group block relative rounded-2xl overflow-hidden bg-[#121418] border border-white/5 hover:border-discord-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-discord-500/10"
              >
                {/* Background Banner */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={r.animeCover || 'https://via.placeholder.com/400x200?text=No+Cover'} 
                    alt="Banner" 
                    className="w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121418] via-[#121418]/80 to-transparent" />
                </div>

                <div className="relative z-10 p-5 flex flex-col h-full min-h-[160px]">
                  {/* Top Content */}
                  <div className="flex gap-4 mb-4">
                    <img 
                      src={r.animeCover || 'https://via.placeholder.com/100x150?text=No+Cover'} 
                      alt="Poster" 
                      className="w-[50px] h-[70px] rounded-lg object-cover shadow-lg shrink-0 border border-white/10 group-hover:border-white/20 transition-all"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-1.5 py-0.5 bg-discord-600 rounded text-[9px] font-black uppercase tracking-widest text-white leading-none flex items-center">
                          <span className="inline-block w-1 h-1 bg-white rounded-full mr-1 animate-pulse" />
                          Live
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-white/90 truncate group-hover:text-white transition-colors" title={r.animeTitle || 'Unknown Anime'}>
                        {r.animeTitle || 'Unknown Anime'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-white/50 font-medium">EP {r.episode}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] text-white/50 font-medium">Sub</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] text-white/50 font-medium flex items-center gap-1"><Users size={10} /> {r.membersCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Bottom Host Info */}
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <img 
                      src={r.host?.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                      alt="Host Avatar" 
                      className="w-7 h-7 rounded-full object-cover border border-white/10"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white/80">{r.host?.displayName || 'Unknown Host'}</span>
                      <span className="text-[10px] text-white/30 flex items-center gap-1">
                        {r.status === 'scheduled' || r.status === 'waiting' ? (
                          <>
                            Scheduled for <span className="w-0.5 h-0.5 rounded-full bg-white/30" /> {new Date(r.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </>
                        ) : (
                          <>
                            Created <span className="w-0.5 h-0.5 rounded-full bg-white/30" /> {timeAgo(r.createdAt)}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
