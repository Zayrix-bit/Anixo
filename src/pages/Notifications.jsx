import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../hooks/useAuth";
import { markAsRead, markAllRead, clearNotifications } from "../services/notificationService";
import { getAnimeDetails } from "../services/api";
import { User, Clock, Heart, Bell, Download, Settings as SettingsIcon, Check, Trash2, Calendar, Info, AlertCircle, ExternalLink, BarChart2 } from "lucide-react";

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return Math.floor(seconds) + "s ago";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
  if (seconds < 2592000) return Math.floor(seconds / 86400) + "d ago";
  return Math.floor(seconds / 2592000) + "mo ago";
};

const formatNotificationText = (notif) => {
  let title = notif.title.replace('🚀', '').trim();
  let message = notif.message.replace('!', '');

  if (notif.type === 'NEW_EPISODE') {
    if (title === 'New Episode Aired') {
      const match = message.match(/Episode (\d+) of (.*?) is now available/);
      if (match) {
        title = match[2];
        message = `Episode ${match[1]} is now available`;
      } else {
        title = "New Episode";
      }
    }
  }
  return { title, message };
};

export default function Notifications() {
  const { user, globalNotifications, setGlobalNotifications } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [coverCache, setCoverCache] = useState({});

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  // Fetch cover images for notifications that don't have one
  useEffect(() => {
    const missing = globalNotifications.filter(n => n.animeId && !n.coverImage && !coverCache[n.animeId]);
    if (missing.length === 0) return;

    const uniqueIds = [...new Set(missing.map(n => n.animeId))];
    uniqueIds.slice(0, 10).forEach(async (id) => {
      try {
        const details = await getAnimeDetails(parseInt(id));
        if (details?.coverImage) {
          setCoverCache(prev => ({ ...prev, [id]: details.coverImage.large || details.coverImage.extraLarge || '' }));
        }
      } catch { /* silently fail */ }
    });
  }, [globalNotifications, coverCache]);

  // Merge cover cache into notifications
  const enrichedNotifications = globalNotifications.map(n => {
    if (n.coverImage || !n.animeId || !coverCache[n.animeId]) return n;
    return { ...n, coverImage: coverCache[n.animeId] };
  });

  const handleMarkRead = async (id) => {
    const res = await markAsRead(id);
    if (res.success) {
      setGlobalNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    }
  };

  const handleReadAll = async () => {
    const res = await markAllRead();
    if (res.success) {
      setGlobalNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const handleClear = async () => {
    const res = await clearNotifications();
    if (res.success) {
      setGlobalNotifications([]);
    }
  };

  const navItems = [
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
    { id: "watching", label: "Continue Watching", icon: Clock, path: "/watching" },
    { id: "bookmarks", label: "Bookmarks", icon: Heart, path: "/watchlist" },
    { id: "notifications", label: "Notifications", icon: Bell, path: "/notifications" },
    { id: "stats", label: "Stats", icon: BarChart2, path: "/stats" },
    { id: "import", label: "Import/Export", icon: Download, path: "/import" },
    ...(user?.role === 'admin' ? [{ id: "admin", label: "Admin", icon: User, path: "/admin" }] : []),
    { id: "settings", label: "Settings", icon: SettingsIcon, path: "/settings" }
  ];

  const unreadCount = enrichedNotifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen text-white bg-[#0a0a0a] flex flex-col font-sans selection:bg-discord-500/30">
      <Navbar />

      <div className="w-full pt-[80px] px-4 md:px-8 pb-12 max-w-[1200px] mx-auto flex-1">
        
        {/* Compact Navigation Tabs */}
        <div className="flex flex-wrap sm:flex-nowrap justify-center gap-1.5 sm:gap-2 md:gap-3 mb-8 w-full max-w-4xl mx-auto px-1 sm:px-0">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center justify-center gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2 rounded-xl transition-all duration-300 border shrink-0 ${
                  isActive 
                  ? "bg-discord-600 text-white border-discord-600" 
                  : "bg-white/[0.02] border-white/15 text-white/30 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0 w-[18px] h-[18px] md:w-4 md:h-4" />
                <span className="hidden md:block text-[12px] font-bold tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        
        {/* Simple Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-medium">Notifications</h1>
            {unreadCount > 0 && (
              <span className="text-sm bg-[#e50914] text-white px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleReadAll} 
              className="text-sm text-[#888] hover:text-white transition-colors"
            >
              Mark all read
            </button>
            <button 
              onClick={handleClear} 
              className="text-sm text-[#888] hover:text-[#e50914] transition-colors"
              title="Clear all notifications"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Notification List */}
        {enrichedNotifications.length > 0 ? (
          <div className="flex flex-col gap-0">
            {enrichedNotifications.map((notif) => {
              const { title, message } = formatNotificationText(notif);
              return (
              <Link
                key={notif._id}
                to={notif.targetUrl || (notif.animeId ? `/watch/${notif.animeId}` : '#')}
                onClick={() => { if (!notif.isRead) handleMarkRead(notif._id); }}
                className={`py-4 border-b border-[#1a1a1a] flex gap-4 cursor-pointer hover:bg-[#111] transition-colors ${!notif.isRead ? 'bg-[#111]' : ''}`}
              >
                {/* Anime Cover Image or Icon */}
                {notif.type === 'NEW_EPISODE' && notif.coverImage ? (
                  <div className="relative shrink-0">
                    <div className="w-[60px] h-[84px] rounded-md overflow-hidden border border-[#2a2a2a]">
                      <img
                        src={notif.coverImage}
                        alt={title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {notif.episode && (
                      <div className="absolute -bottom-1.5 -right-1.5 bg-[#e50914] text-white text-[10px] font-medium px-1.5 py-0.5 rounded-sm shadow-md">
                        {notif.episode}
                      </div>
                    )}
                  </div>
                ) : notif.type === 'NEW_EPISODE' ? (
                  <div className="w-[60px] h-[84px] rounded-md bg-[#1a1a1a] flex items-center justify-center border border-[#2a2a2a] shrink-0">
                    <Calendar size={24} className="text-[#666]" />
                  </div>
                ) : notif.type === 'WATCHLIST_UPDATE' ? (
                  <div className="w-[60px] h-[84px] rounded-md bg-[#1a1a1a] flex items-center justify-center border border-[#2a2a2a] shrink-0">
                    <Info size={24} className="text-[#666]" />
                  </div>
                ) : (
                  <div className="w-[60px] h-[84px] rounded-md bg-[#1a1a1a] flex items-center justify-center border border-[#2a2a2a] shrink-0">
                    <AlertCircle size={24} className="text-[#666]" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className={`text-base ${!notif.isRead ? 'font-medium text-white' : 'text-[#aaa]'}`}>
                        {title}
                      </h3>
                      <p className="text-sm text-[#777] mt-1 line-clamp-2">
                        {message}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-[#e50914] rounded-full shrink-0" />
                      )}
                      <span className="text-xs text-[#666]">{timeAgo(notif.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell size={48} className="text-[#444] mb-4" />
            <h2 className="text-lg text-[#888] mb-2">No notifications</h2>
            <p className="text-sm text-[#666] mb-6">We'll let you know when new episodes are available</p>
            <Link to="/browse" className="text-sm text-white border border-[#333] px-4 py-2 rounded-md hover:bg-[#181818] transition-colors">
              Browse anime
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
