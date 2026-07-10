import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { backendApi } from "../services/api";
import axios from "axios";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { User, Calendar, PlayCircle, Clock, Heart, Eye, Tv, MessageCircle, Ban, Crown, Shield, ChevronLeft, ChevronRight } from "lucide-react";

export default function PublicProfile() {
 const { profileId } = useParams();
 const [profile, setProfile] = useState(null);
 const [watchlist, setWatchlist] = useState([]);
 const [recentProgress, setRecentProgress] = useState([]);
 const [recentComments, setRecentComments] = useState([]);
 const [activityFeed, setActivityFeed] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState(null);
 const [totalEpisodes, setTotalEpisodes] = useState(0);

 const [activeTab, setActiveTab] = useState("activity");
 const [listPage, setListPage] = useState(1);
 const [activityPage, setActivityPage] = useState(1);
 const ITEMS_PER_PAGE = 24;
 const ACTIVITY_PER_PAGE = 10;

 const getRelativeTime = (dateString) => {
 if (!dateString) return "Unknown";
 const date = new Date(dateString);
 const now = new Date();
 const diffInSeconds = Math.floor((now - date) / 1000);
 
 if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
 if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
 if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
 return `${Math.floor(diffInSeconds / 86400)} days ago`;
 };

 useEffect(() => {
 const fetchProfile = async () => {
 try {
 setIsLoading(true);
 const res = await backendApi.get(`/users/${profileId}`);
 
 if (res.data.success) {
 setProfile(res.data.profile);
 setRecentComments(res.data.recentComments || []);
 
 let list = res.data.watchlist || [];
 let progress = res.data.recentProgress || [];
 let comments = res.data.recentComments || [];

 const watchIds = list.map(w => parseInt(w.animeId)).filter(id => !isNaN(id));
 const progIds = progress.map(p => parseInt(p.animeId)).filter(id => !isNaN(id));
 const commIds = comments.map(c => parseInt(c.animeId)).filter(id => !isNaN(id));
 
 const allIds = [...new Set([...watchIds, ...progIds, ...commIds])];

 if (allIds.length > 0) {
 const query = `
 query ($ids: [Int]) {
 Page(page: 1, perPage: 50) {
 media(id_in: $ids, type: ANIME) {
 id
 title { romaji english }
 coverImage { large }
 episodes
 }
 }
 }
 `;
 try {
 // Batch into chunks of 50 (AniList API limit)
 const mediaMap = {};
 const chunks = [];
 for (let i = 0; i < allIds.length; i += 50) {
 chunks.push(allIds.slice(i, i + 50));
 }
 
 const results = await Promise.all(
 chunks.map(chunk =>
 axios.post("https://graphql.anilist.co", {
 query,
 variables: { ids: chunk }
 }, { headers: { "Content-Type": "application/json", "Accept": "application/json" } })
 )
 );
 
 results.forEach(({ data }) => {
 const mediaList = data?.data?.Page?.media || [];
 mediaList.forEach(m => mediaMap[m.id] = m);
 });

 list = list.map(item => ({ ...item, anime: mediaMap[parseInt(item.animeId)] }));
 progress = progress.map(item => ({ ...item, type: 'progress', timestamp: item.updatedAt, anime: mediaMap[parseInt(item.animeId)] }));
 comments = comments.map(item => ({ ...item, type: 'comment', timestamp: item.createdAt, anime: mediaMap[parseInt(item.animeId)] }));
 } catch (e) {
 console.error("Failed to fetch AniList data for profile", e);
 }
 }

 const combined = [...progress, ...comments].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
 
 setWatchlist(list);
 setRecentProgress(progress);
 setRecentComments(comments);
 setActivityFeed(combined);
 setTotalEpisodes(res.data.stats?.totalEpisodesWatched || 0);
 } else {
 setError(res.data.message || "User not found");
 }
 } catch (err) {
 console.error(err);
 setError(err.response?.data?.message || "User not found");
 } finally {
 setIsLoading(false);
 }
 };

 if (profileId) fetchProfile();
 }, [profileId]);

 if (isLoading) {
 return (
 <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans">
 <Navbar />
 <div className="flex-1 flex items-center justify-center">
 <div className="w-8 h-8 border-4 border-discord-600 border-t-transparent rounded-full animate-spin"></div>
 </div>
 </div>
 );
 }

 if (error || !profile) {
 return (
 <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans">
 <Navbar />
 <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
 <User size={48} className="text-white/10 mb-4" />
 <h2 className="text-xl font-bold text-white mb-2">User Not Found</h2>
 <p className="text-white/40 text-sm mb-6">{error}</p>
 <Link to="/" className="px-5 py-2 bg-discord-600 text-white rounded font-bold uppercase tracking-widest text-[10px] hover:bg-discord-700 transition-colors">
 Go Home
 </Link>
 </div>
 </div>
 );
 }

 const tabs = [
 { id: "activity", label: "Activity", icon: Clock },
 { id: "overview", label: "Overview", icon: Eye },
 { id: "watchlist", label: `List (${watchlist.length})`, icon: Heart }
 ];

 return (
 <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
 <Navbar />

 {/* ===== HEADER / BANNER ===== */}
 <div className="w-full relative mt-[56px] sm:mt-[64px] md:mt-[80px]">
 {/* Banner */}
 <div className="h-32 sm:h-40 md:h-56 lg:h-64 w-full relative overflow-hidden">
 {watchlist[0]?.anime?.coverImage?.large ? (
 <>
 <img src={watchlist[0].anime.coverImage.large} alt="" className="w-full h-full object-cover opacity-20 blur-sm scale-110" />
 <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/30" />
 </>
 ) : (
 <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-neutral-900 to-[#0a0a0a]" />
 )}
 </div>

 {/* Profile Info */}
 <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative -mt-12 sm:-mt-16 md:-mt-20 z-10">
 <div className="flex flex-col items-center gap-3 sm:gap-5 pb-4 sm:pb-6 border-b border-white/15">
 {/* Avatar */}
 <div className="relative">
 <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full border-[3px] sm:border-4 border-[#0a0a0a] overflow-hidden bg-neutral-800 shrink-0 shadow-2xl ring-2 ring-white/10">
 <img 
 src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.username}&background=random`} 
 alt={profile.username} 
 className="w-full h-full object-cover" 
 />
 </div>
 {/* Crown for Admin/Mod */}
 {(profile.role === 'admin' || profile.role === 'moderator') && (
 <div className={`absolute -top-1 -right-1 p-1 rounded-full shadow-lg ${
 profile.role === 'admin' ? 'bg-purple-600' : 'bg-discord-600'
 } border-2 border-[#0a0a0a]`}>
 {profile.role === 'admin' ? (
 <Crown size={14} fill="currentColor" />
 ) : (
 <Shield size={14} fill="currentColor" />
 )}
 </div>
 )}
 </div>
 
 {/* Name & Meta */}
 <div className="flex-1 text-center mb-1 md:mb-3">
 <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white mb-0.5 sm:mb-1 flex items-center flex-wrap gap-2">
 {profile.displayName || profile.username}
 {profile.profileId === 'c34e7bbb' && (
 <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] md:text-[12px] font-black uppercase tracking-wider rounded border border-rose-500/50 leading-none mt-1">RANDI KA BACCHA</span>
 )}
 </h1>
 <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 text-white/50 text-[11px] sm:text-xs font-medium">
 <span className="flex items-center gap-1">
 <User size={12} className="sm:w-3.5 sm:h-3.5" /> @{(profile.displayName && profile.displayName !== profile.username) ? profile.profileId : profile.username}
 </span>
 <span className="flex items-center gap-1">
 <Calendar size={12} className="sm:w-3.5 sm:h-3.5" /> {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
 </span>
 {profile.anilistConnected && (
 <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded border border-blue-500/30">
 AniList
 </span>
 )}
 </div>

 {/* Mobile Stats Bar - compact inline stats for mobile */}
 <div className="flex items-center justify-center md:hidden gap-4 mt-3">
 <div className="text-center">
 <div className="text-base font-black text-white">{watchlist.length}</div>
 <div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Anime</div>
 </div>
 <div className="w-px h-6 bg-white/10" />
 <div className="text-center">
 <div className="text-base font-black text-white">{totalEpisodes}+</div>
 <div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Episodes</div>
 </div>
 <div className="w-px h-6 bg-white/10" />
 <div className="text-center">
 <div className="text-base font-black text-white">{recentComments.length}</div>
 <div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Comments</div>
 </div>
 </div>
 </div>
 </div>
 
 {/* Tabs - horizontal scroll on mobile */}
 <div className="flex items-center gap-1 sm:gap-4 pt-2 sm:pt-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
 {tabs.map(t => {
 const Icon = t.icon;
 return (
 <button
 key={t.id}
 onClick={() => setActiveTab(t.id)}
 className={`pb-2.5 sm:pb-3 px-2.5 sm:px-3 flex items-center gap-1.5 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors relative ${
 activeTab === t.id ? "text-discord-500" : "text-white/35 active:text-white/60"
 }`}
 >
 <Icon size={13} className="sm:w-3.5 sm:h-3.5" />
 {t.label}
 {activeTab === t.id && (
 <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-discord-600 rounded-t" />
 )}
 </button>
 );
 })}
 </div>
 </div>
 </div>

 {/* ===== CONTENT AREA ===== */}
 <div className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 flex-1">
 
 {/* BAN BANNER */}
 {profile?.banUntil && new Date(profile.banUntil) > new Date() && (
 <div className="mb-6 p-4 rounded-xl bg-discord-500/10 border border-discord-500/20 text-discord-400 flex items-start gap-3">
 <div className="mt-0.5"><Ban size={18} /></div>
 <div>
 <h4 className="font-bold text-sm">Account Restricted</h4>
 <p className="text-xs text-discord-400/80 mt-1">
 This user is currently banned from commenting until {new Date(profile.banUntil).toLocaleString()} 
 {profile.bannedByRole ? ` by ${profile.bannedByRole}.` : '.'}
 </p>
 </div>
 </div>
 )}
 
 {/* OVERVIEW TAB */}
 {activeTab === "overview" && (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
 {/* Stats - hidden on mobile (shown inline above), visible on desktop */}
 <div className="hidden md:block md:col-span-1 space-y-4">
 <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex items-center justify-between">
 <div>
 <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Total Anime</div>
 <div className="text-2xl font-black">{watchlist.length}</div>
 </div>
 <div className="w-11 h-11 bg-discord-500/10 rounded-full flex items-center justify-center">
 <Tv size={20} className="text-discord-500" />
 </div>
 </div>
 <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex items-center justify-between">
 <div>
 <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Episodes Watched</div>
 <div className="text-2xl font-black">{totalEpisodes}+</div>
 </div>
 <div className="w-11 h-11 bg-blue-500/10 rounded-full flex items-center justify-center">
 <Eye size={20} className="text-blue-500" />
 </div>
 </div>
 </div>

 {/* Recent Activity */}
 <div className="md:col-span-2 space-y-5 sm:space-y-8">
 <div>
 <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4 flex items-center gap-2">
 <Clock size={16} className="text-discord-500" /> Recent Activity
 </h3>
 {recentProgress.length > 0 ? (
 <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
 {recentProgress.slice(0, 6).map(p => (
 <Link key={p._id} to={`/watch/${p.animeId}?ep=${p.episode}`} className="flex items-center gap-3 p-2.5 sm:p-3 bg-white/[0.02] hover:bg-white/[0.05] active:bg-white/[0.07] border border-white/15 rounded-lg transition-colors">
 <div className="w-10 h-14 sm:w-12 sm:h-16 rounded overflow-hidden bg-white/5 shrink-0">
 {p.anime?.coverImage?.large || p.coverImage ? (
 <img src={p.anime?.coverImage?.large || p.coverImage} alt="" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center"><PlayCircle size={14} className="text-white/20" /></div>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="text-[12px] sm:text-sm font-bold truncate text-white mb-0.5">
 {p.anime?.title?.english || p.anime?.title?.romaji || p.title || "Unknown Anime"}
 </div>
 <div className="text-[10px] sm:text-xs font-medium text-white/40">Episode {p.episode}</div>
 </div>
 </Link>
 ))}
 </div>
 ) : (
 <p className="text-white/30 text-xs sm:text-sm">No recent activity.</p>
 )}
 </div>
 </div>
 </div>
 )}

 {/* WATCHLIST TAB */}
 {activeTab === "watchlist" && (() => {
 const totalListPages = Math.ceil(watchlist.length / ITEMS_PER_PAGE);
 const paginatedList = watchlist.slice((listPage - 1) * ITEMS_PER_PAGE, listPage * ITEMS_PER_PAGE);
 return (
 <div>
 {watchlist.length > 0 ? (
 <>
 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
 {paginatedList.map(w => (
 <Link key={w.animeId} to={`/watch/${w.animeId}`} className="group relative aspect-[2/3] rounded-md sm:rounded-lg overflow-hidden bg-white/5">
 {w.anime?.coverImage?.large && (
 <img src={w.anime.coverImage.large} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
 )}
 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
 <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2.5">
 <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-discord-500 mb-0.5">{w.status}</div>
 <div className="text-[10px] sm:text-xs font-bold truncate leading-tight">{w.anime?.title?.english || w.anime?.title?.romaji || "Unknown"}</div>
 </div>
 </Link>
 ))}
 </div>
 {totalListPages > 1 && (
 <div className="flex items-center justify-center gap-2 mt-6">
 <button
 onClick={() => { setListPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
 disabled={listPage === 1}
 className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
 >
 <ChevronLeft size={16} />
 </button>
 {Array.from({ length: totalListPages }, (_, i) => i + 1)
 .filter(p => p === 1 || p === totalListPages || Math.abs(p - listPage) <= 2)
 .reduce((acc, p, i, arr) => {
 if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
 acc.push(p);
 return acc;
 }, [])
 .map((p, i) =>
 p === '...' ? (
 <span key={`dot-${i}`} className="px-1 text-white/30 text-sm">...</span>
 ) : (
 <button
 key={p}
 onClick={() => { setListPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
 className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-colors ${
 listPage === p
 ? 'bg-discord-600 text-white'
 : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
 }`}
 >
 {p}
 </button>
 )
 )}
 <button
 onClick={() => { setListPage(p => Math.min(totalListPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
 disabled={listPage === totalListPages}
 className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
 >
 <ChevronRight size={16} />
 </button>
 </div>
 )}
 </>
 ) : (
 <div className="text-center py-16 sm:py-20 text-white/40">
 <Heart size={36} className="mx-auto mb-3 opacity-20" />
 <p className="text-sm">This user's watchlist is empty.</p>
 </div>
 )}
 </div>
 );
 })()}

 {/* ACTIVITY TAB */}
 {activeTab === "activity" && (() => {
 const totalActivityPages = Math.ceil(activityFeed.length / ACTIVITY_PER_PAGE);
 const paginatedActivity = activityFeed.slice((activityPage - 1) * ACTIVITY_PER_PAGE, activityPage * ACTIVITY_PER_PAGE);
 return (
 <div className="max-w-3xl mx-auto py-6">
 {activityFeed.length > 0 ? (
 <>
 <div className="relative border-l border-[#1d2721] ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-8">
 {paginatedActivity.map(item => (
 <div key={item._id} className="relative">
 {/* Timeline Dot with Icon */}
 <div className="absolute -left-[38px] sm:-left-[46px] top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0a0a0a] border border-[#1d2721] flex items-center justify-center z-10">
 <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#112a1e] flex items-center justify-center">
 {item.type === 'progress' ? (
 <Eye size={12} className="text-[#2bd966]" />
 ) : (
 <MessageCircle size={12} className="text-[#2bd966]" />
 )}
 </div>
 </div>

 <div className="flex flex-col">
 <div className="flex items-center gap-1.5 text-white/50 text-[11px] sm:text-xs font-medium mb-1.5">
 <Clock size={12} />
 <span>{getRelativeTime(item.timestamp)}</span>
 </div>
 
 {item.type === 'progress' ? (
 <div className="text-[13px] sm:text-sm text-white/80">
 <span className="font-bold text-white">{profile.displayName || profile.profileId || profile.username}</span>
 {" watched episode "}
 <span className="font-bold">{item.episode}</span>
 {" of "}
 <Link to={`/watch/${item.animeId}?ep=${item.episode}`} className="text-[#2bd966] hover:underline font-medium">
 {item.anime?.title?.english || item.anime?.title?.romaji || item.title || "Anime"}
 </Link>
 </div>
 ) : (
 <div>
 <div className="text-[13px] sm:text-sm text-white/80 mb-2">
 <span className="font-bold text-white">{profile.displayName || profile.profileId || profile.username}</span>
 {" commented on episode "}
 <span className="font-bold">{item.episodeNumber}</span>
 {" of "}
 <Link to={`/watch/${item.animeId}?ep=${item.episodeNumber}`} className="text-[#2bd966] hover:underline font-medium">
 {item.anime?.title?.english || item.anime?.title?.romaji || item.title || "Anime"}
 </Link>
 </div>
 <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 text-sm text-white/70 italic inline-block w-full">
 "{item.content}"
 </div>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 {totalActivityPages > 1 && (
 <div className="flex items-center justify-center gap-2 mt-10">
 <button
 onClick={() => { setActivityPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
 disabled={activityPage === 1}
 className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
 >
 <ChevronLeft size={16} />
 </button>
 {Array.from({ length: totalActivityPages }, (_, i) => i + 1)
 .filter(p => p === 1 || p === totalActivityPages || Math.abs(p - activityPage) <= 2)
 .reduce((acc, p, i, arr) => {
 if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
 acc.push(p);
 return acc;
 }, [])
 .map((p, i) =>
 p === '...' ? (
 <span key={`dot-${i}`} className="px-1 text-white/30 text-sm">...</span>
 ) : (
 <button
 key={p}
 onClick={() => { setActivityPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
 className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-colors ${
 activityPage === p
 ? 'bg-discord-600 text-white'
 : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
 }`}
 >
 {p}
 </button>
 )
 )}
 <button
 onClick={() => { setActivityPage(p => Math.min(totalActivityPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
 disabled={activityPage === totalActivityPages}
 className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
 >
 <ChevronRight size={16} />
 </button>
 </div>
 )}
 </>
 ) : (
 <p className="text-center text-white/40 py-10 text-sm">No recent activity.</p>
 )}
 </div>
 );
 })()}

 </div>
 <Footer />
 </div>
 );
}
