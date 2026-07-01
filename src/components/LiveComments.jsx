import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Clock, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { getAnimeDetails } from "../services/api";

const SOCKET_URL = "http://localhost:4000";

const LiveComments = () => {
  const [comments, setComments] = useState([]);
  const [animeTitles, setAnimeTitles] = useState({});
  const containerRef = useRef(null);

  const fetchAnimeTitles = async (newComments) => {
    newComments.forEach(async (comment) => {
      if (!comment.animeId || animeTitles[comment.animeId]) return;
      try {
        const details = await getAnimeDetails(comment.animeId);
        setAnimeTitles((prev) => ({
          ...prev,
          [comment.animeId]: details?.title?.english || details?.title?.romaji || details?.title?.native || `Anime ${comment.animeId}`
        }));
      } catch (err) {
        console.log("Failed to fetch anime details");
      }
    });
  };

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("global_new_comment", (comment) => {
      setComments((prev) => {
        if (prev.some((c) => c._id === comment._id)) return prev;
        const newComments = [comment, ...prev];
        fetchAnimeTitles([comment]);
        return newComments.slice(0, 30);
      });
    });

    const fetchRecentComments = async () => {
      try {
        const res = await fetch(`${SOCKET_URL}/api/recent-comments?limit=15`);
        const data = await res.json();
        setComments(data || []);
        fetchAnimeTitles(data || []);
      } catch (err) {
        console.error("Error fetching recent comments:", err);
      }
    };

    fetchRecentComments();

    return () => {
      socket.disconnect();
    };
  }, []);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diff = Math.floor((now - commentDate) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getAvatarUrl = (avatar, username) => {
    if (!avatar) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=random&color=fff`;
    }
    return avatar.replace(/[`"]/g, '').trim();
  };

  return (
    <div className="w-full py-12 border-t border-white/5">
      <div className="max-w-[1720px] mx-auto px-2 lg:px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-6 bg-red-600 rounded-full inline-block"></div>
          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">Live Comments</h3>
        </div>

        <div className="flex items-start gap-6">
          {/* Anime Girl Image */}
          <div className="hidden md:block shrink-0">
            <img 
              src="/konosuba.png" 
              alt="Anime Girl"
              className="w-48 h-auto"
            />
          </div>
          
          {/* Comments Scroll */}
          <div className="flex-1 w-full overflow-hidden">
            <div 
              ref={containerRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
              style={{ 
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                overflowX: 'auto'
              }}
            >
              {comments.length === 0 ? (
                <div className="w-full text-center py-16 text-white/40 text-sm">
                  Adding This Feature Soon... 
                </div>
              ) : (
                comments.map((comment) => (
                  <Link
                    key={comment._id}
                    to={`/watch/${comment.animeId}?ep=${comment.episodeNumber}#comment-${comment._id}`}
                    className="flex-shrink-0 w-[320px] bg-[#121418] border border-white/10 rounded-xl p-5 hover:border-red-500/30 hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-full overflow-hidden border border-yellow-500 bg-neutral-800 shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <img 
                          src={getAvatarUrl(comment.user?.avatar, comment.user?.username)} 
                          alt={comment.user?.username} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold truncate">
                          {comment.user?.displayName || comment.user?.profileId || comment.user?.username}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-white/50 mt-0.5">
                          <Clock size={11} />
                          <span>{formatTimeAgo(comment.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 px-3 py-1.5 bg-red-600/10 rounded-lg border border-red-500/20">
                      <PlayCircle size={13} className="text-red-500" />
                      <span className="text-[11px] text-red-400 font-semibold truncate flex-1">
                        {animeTitles[comment.animeId] || `Anime ${comment.animeId}`} • Ep {comment.episodeNumber}
                      </span>
                    </div>

                    <p className="text-white/75 text-sm line-clamp-3 leading-relaxed">
                      {comment.content?.replace(/\|\|/g, '') || ''}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveComments;
