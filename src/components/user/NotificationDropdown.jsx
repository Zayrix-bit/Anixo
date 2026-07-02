import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { markAsRead, markAllRead } from "../../services/notificationService";
import { getAnimeDetails } from "../../services/api";
import { Bell, Calendar, Info, AlertCircle, ExternalLink, MessageSquare } from "lucide-react";

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

  if (notif.type === 'REPLY') {
    // title is already like "Username replied to your comment"
    // message is the reply content snippet
  }

  return { title, message };
};

export default function NotificationDropdown({ isOpen, onClose }) {
  const { globalNotifications, setGlobalNotifications } = useAuth();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

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

  const [coverCache, setCoverCache] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    const missing = globalNotifications.filter(n => n.animeId && !n.coverImage && !coverCache[n.animeId]).slice(0, 5);
    if (missing.length === 0) return;
    const uniqueIds = [...new Set(missing.map(n => n.animeId))];
    uniqueIds.forEach(async (id) => {
      try {
        const details = await getAnimeDetails(parseInt(id));
        if (details?.coverImage) {
          setCoverCache(prev => ({ ...prev, [id]: details.coverImage.large || details.coverImage.extraLarge || '' }));
        }
      } catch { /* silently fail */ }
    });
  }, [isOpen, globalNotifications, coverCache]);

  const enrichedNotifications = globalNotifications.map(n => {
    if (n.coverImage || !n.animeId || !coverCache[n.animeId]) return n;
    return { ...n, coverImage: coverCache[n.animeId] };
  });

  if (!isOpen) return null;


  return (
    <div 
      ref={dropdownRef}
      className="absolute top-[48px] -right-12 sm:right-0 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl shadow-2xl w-[285px] min-[375px]:w-[320px] sm:w-[360px] z-[200] overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between bg-[#121212]">
        <h3 className="text-sm font-medium text-white">Notifications</h3>
        <div className="flex items-center gap-3">
          {globalNotifications.some(n => !n.isRead) && (
            <button onClick={handleReadAll} className="text-xs text-gray-400 hover:text-white transition-colors">
              Mark all read
            </button>
          )}
          <Link to="/notifications" onClick={onClose} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
            View all <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {enrichedNotifications.length > 0 ? (
          <div className="flex flex-col">
            {enrichedNotifications.slice(0, 5).map((notif) => {
              const { title, message } = formatNotificationText(notif);
              return (
              <Link 
                key={notif._id}
                to={notif.targetUrl || (notif.animeId ? `/watch/${notif.animeId}` : '#')}
                onClick={() => { if (!notif.isRead) handleMarkRead(notif._id); onClose(); }}
                className={`px-4 py-3 border-b border-[#1a1a1a] hover:bg-[#181818] transition-colors flex gap-3 cursor-pointer ${!notif.isRead ? 'bg-[#151515]' : 'bg-transparent'}`}
              >
                {/* Anime Thumbnail or Icon */}
                {notif.type === 'NEW_EPISODE' && notif.coverImage ? (
                  <div className="relative shrink-0">
                    <div className="w-[50px] h-[70px] rounded-md overflow-hidden border border-[#2a2a2a]">
                      <img
                        src={notif.coverImage}
                        alt={title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {notif.episode && (
                      <div className="absolute -bottom-1.5 -right-1.5 bg-[#e50914] text-white text-[9px] font-medium px-1.5 py-0.5 rounded-sm shadow-md">
                        {notif.episode}
                      </div>
                    )}
                  </div>
                ) : notif.type === 'REPLY' ? (
                  <div className="shrink-0 mt-1 w-[44px] h-[44px] rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#2a2a2a]">
                    <MessageSquare size={20} className="text-[#888]" />
                  </div>
                ) : (
                  <div className="shrink-0 mt-1 w-[44px] h-[44px] rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#2a2a2a]">
                    {notif.type === 'NEW_EPISODE' ? (
                      <Calendar size={20} className="text-[#888]" />
                    ) : notif.type === 'WATCHLIST_UPDATE' ? (
                      <Info size={20} className="text-[#888]" />
                    ) : (
                      <AlertCircle size={20} className="text-[#888]" />
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!notif.isRead ? 'font-medium text-white' : 'text-[#aaa]'} line-clamp-2`}>
                      {title}
                    </p>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-[#e50914] shrink-0 mt-2" />
                    )}
                  </div>
                  <p className="text-xs text-[#777] line-clamp-2 mt-1 leading-relaxed">{message}</p>
                </div>
              </Link>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-12 flex flex-col items-center justify-center text-center">
            <Bell size={36} className="text-[#444] mb-3" />
            <p className="text-sm text-[#666]">You're all caught up!</p>
          </div>
        )}
      </div>

      {enrichedNotifications.length > 5 && (
        <Link 
          to="/notifications" 
          onClick={onClose}
          className="block px-4 py-3 text-center text-sm text-[#888] hover:text-white hover:bg-[#181818] transition-all border-t border-[#2a2a2a]"
        >
          View all {enrichedNotifications.length} notifications
        </Link>
      )}
    </div>
  );
}
