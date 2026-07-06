import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Clock, Heart, Bell, Download, Settings, BarChart2, Users, Crown } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import OnlineUsers from '../components/common/OnlineUsers';
import { io } from 'socket.io-client';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [onlineStats, setOnlineStats] = useState({ total: 0, registered: 0, guests: 0, users: [] });
  const [isConnected, setIsConnected] = useState(false);

  const navItems = [
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
    { id: "watching", label: "Continue Watching", icon: Clock, path: "/watching" },
    { id: "bookmarks", label: "Bookmarks", icon: Heart, path: "/watchlist" },
    { id: "notifications", label: "Notifications", icon: Bell, path: "/notifications" },
    { id: "stats", label: "Stats", icon: BarChart2, path: "/stats" },
    { id: "import", label: "Import/Export", icon: Download, path: "/import" },
    { id: "admin", label: "Admin", icon: Users, path: "/admin" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" }
  ];

  // Connect to online server to get detailed user list
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const socket = io(import.meta.env.VITE_ONLINE_SERVER_URL || 'http://localhost:7861');
    
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('identify-user', {
        isRegistered: true,
        isAdmin: true,
        username: user.username || '',
        displayName: user.displayName || user.username || '',
        avatar: user.avatar || '',
        profileId: user.profileId || ''
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('online-count', (stats) => {
      setOnlineStats(stats);
    });

    socket.on('user-updated', (updatedUser) => {
      setOnlineStats(prevStats => {
        const updatedUsers = prevStats.users.map(user => {
          if (user.username === updatedUser.username) {
            return {
              ...user,
              displayName: updatedUser.displayName || user.displayName,
              avatar: updatedUser.avatar || user.avatar,
              profileId: updatedUser.profileId || user.profileId
            };
          }
          return user;
        });
        return {
          ...prevStats,
          users: updatedUsers
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, navigate]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Navbar />

      <div className="w-full pt-[80px] px-3 md:px-8 pb-12 max-w-[1200px] mx-auto flex-1">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto sm:overflow-visible justify-center gap-1.5 sm:gap-2 md:gap-3 mb-8 w-full max-w-4xl mx-auto px-1 sm:px-0 pb-2 sm:pb-0">
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

        {/* Admin Panel */}
        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-4 md:p-8">
          <h1 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
            <Users size={22} className="text-discord-500" />
            Admin Panel
          </h1>

          {/* Online Users Section */}
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-base md:text-lg font-medium text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Online Users ({onlineStats.total})
            </h2>

            <div className="flex flex-wrap gap-3 md:gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-discord-500" />
                <span className="text-white/60">Registered: {onlineStats.registered}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span className="text-white/60">Guests: {onlineStats.guests}</span>
              </div>
            </div>

            {onlineStats.users && onlineStats.users.length > 0 ? (
              <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {onlineStats.users.map((user, index) => (
                  <Link
                        key={index}
                        to={`/user/${user.profileId || user.username}`}
                        className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] transition-all hover:bg-[#151515] hover:border-white/20 cursor-pointer`}
                    >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-[#2a2a2a] flex-shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/60 font-bold text-base md:text-lg">
                          {(user.displayName || user.username)[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm md:text-base font-medium text-white truncate">
                          {user.displayName || user.username}
                        </h3>
                        {user.isAdmin && (
                          <div className="flex items-center gap-1 text-purple-500">
                            <Crown size={10} className="md:w-3 md:h-3" />
                            <span className="text-[9px] md:text-[10px] uppercase font-bold">Admin</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white/40 truncate">
                        @{user.username}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] md:text-xs text-white/40 hidden sm:inline">Online</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/40 text-sm">No registered users online right now</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
