import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { User, Users, Crown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const OnlineUsers = () => {
  const [onlineStats, setOnlineStats] = useState({ total: 0, registered: 0, guests: 0, users: [] });
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to online server
    const socket = io(import.meta.env.VITE_ONLINE_SERVER_URL || 'http://localhost:7861');
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Identify user type on connect
      const isRegistered = !!user;
      const isAdmin = !!user && (user.role === 'admin');
      socket.emit('identify-user', {
        isRegistered,
        isAdmin,
        username: user?.username || '',
        displayName: user?.displayName || user?.username || '',
        avatar: user?.avatar || '',
        profileId: user?.profileId || ''
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('online-count', (stats) => {
      setOnlineStats(stats);
    });

    // Cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Update user type when auth status changes
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected) {
      const isRegistered = !!user;
      const isAdmin = !!user && (user.role === 'admin');
      socketRef.current.emit('identify-user', {
        isRegistered,
        isAdmin,
        username: user?.username || '',
        displayName: user?.displayName || user?.username || '',
        avatar: user?.avatar || '',
        profileId: user?.profileId || ''
      });
    }
  }, [user]);

  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10">
      <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
      <Users size={14} className="text-white/70" />
      <span className="text-xs font-medium text-white/90">
        {onlineStats.total} Online
      </span>
      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1">
          <User size={9} className="text-red-400" />
          <span className="text-white/70">{onlineStats.registered}</span>
        </div>
        <span className="text-white/30">|</span>
        <div className="flex items-center gap-1">
          <User size={9} className="text-white/50" />
          <span className="text-white/50">{onlineStats.guests}</span>
        </div>
      </div>
    </div>
  );
};

export default OnlineUsers;
