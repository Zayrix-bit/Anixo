import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import express from 'express';

const PORT = process.env.PORT || 7861;

// Create Express app for HTTP endpoints
const app = express();
app.use(cors());
app.use(express.json());

// Root endpoint to prevent "Cannot GET /" on Hugging Face Spaces
app.get('/', (req, res) => {
  res.json({ status: "ok", message: "Anigo Online Server is running successfully!" });
});

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for development, restrict in production
    methods: ['GET', 'POST']
  }
});

// Track online users - separate registered, guests, and admins
const onlineUsers = {
  registered: new Map(), // socket.id -> { username, displayName, avatar }
  guests: new Set(),
  admins: new Map(), // socket.id -> { username, displayName, avatar }
};

// Helper function to get all registered users for admin
function getRegisteredUsers() {
  const userMap = new Map(); // Use map to avoid duplicates by username
  
  // Add admins first
  for (const [, userData] of onlineUsers.admins.entries()) {
    const key = userData.username;
    userMap.set(key, { ...userData, isAdmin: true });
  }
  
  // Add registered users, skipping duplicates
  for (const [, userData] of onlineUsers.registered.entries()) {
    const key = userData.username;
    if (!userMap.has(key)) { // Only add if not already added (as admin)
      userMap.set(key, { ...userData, isAdmin: false });
    }
  }
  
  return Array.from(userMap.values());
}

// Helper function to get unique counts
function getUniqueCounts() {
  const uniqueRegisteredSet = new Set();
  
  // Add all admin usernames
  for (const [, userData] of onlineUsers.admins.entries()) {
    uniqueRegisteredSet.add(userData.username);
  }
  
  // Add all registered usernames
  for (const [, userData] of onlineUsers.registered.entries()) {
    uniqueRegisteredSet.add(userData.username);
  }
  
  const uniqueRegistered = uniqueRegisteredSet.size;
  const guests = onlineUsers.guests.size;
  
  return {
    uniqueRegistered,
    guests,
    total: uniqueRegistered + guests
  };
}

// Helper function to get counts for a specific user (ALWAYS REAL NOW!)
function getCountsForUser() {
  const uniqueCounts = getUniqueCounts();

  return {
    total: uniqueCounts.total,
    registered: uniqueCounts.uniqueRegistered,
    guests: uniqueCounts.guests,
    users: getRegisteredUsers()
  };
}

// Broadcast counts to all users
function broadcastCounts() {
  // Emit to each connected socket individually
  io.sockets.sockets.forEach((socket) => {
    socket.emit('online-count', getCountsForUser());
  });
}

// HTTP endpoint to update user profile (called by backend core)
app.post('/update-user', (req, res) => {
  try {
    const { username, displayName, avatar, profileId } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    let updated = false;

    // Update in registered users
    for (const [socketId, userData] of onlineUsers.registered.entries()) {
      if (userData.username === username) {
        onlineUsers.registered.set(socketId, {
          ...userData,
          displayName: displayName || userData.displayName,
          avatar: avatar || userData.avatar,
          profileId: profileId || userData.profileId
        });
        updated = true;
      }
    }

    // Update in admins
    for (const [socketId, userData] of onlineUsers.admins.entries()) {
      if (userData.username === username) {
        onlineUsers.admins.set(socketId, {
          ...userData,
          displayName: displayName || userData.displayName,
          avatar: avatar || userData.avatar,
          profileId: profileId || userData.profileId
        });
        updated = true;
      }
    }

    if (updated) {
      // Broadcast updated user list to everyone
      io.emit('user-updated', { username, displayName, avatar, profileId });
      broadcastCounts();
      res.json({ success: true, message: 'User updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found online' });
    }
  } catch (error) {
    console.error('UPDATE USER ERROR:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`);
  let isAdminSocket = false; // Track if this socket is an admin
  
  // Listen for user identification
  socket.on('identify-user', (data) => {
    // Handle both old format (boolean) and new format (object)
    let isRegistered = typeof data === 'boolean' ? data : data?.isRegistered || false;
    isAdminSocket = typeof data === 'object' ? data?.isAdmin || false : false;
    const userInfo = typeof data === 'object' ? {
      username: data?.username || 'User',
      displayName: data?.displayName || 'User',
      avatar: data?.avatar || '',
      profileId: data?.profileId || ''
    } : { username: 'User', displayName: 'User', avatar: '', profileId: '' };
    
    // Remove from previous status if exists
    onlineUsers.registered.delete(socket.id);
    onlineUsers.guests.delete(socket.id);
    onlineUsers.admins.delete(socket.id);
    
    // Add to appropriate set
    if (isAdminSocket) {
      onlineUsers.admins.set(socket.id, userInfo);
    } else if (isRegistered) {
      onlineUsers.registered.set(socket.id, userInfo);
    } else {
      onlineUsers.guests.add(socket.id);
    }
    
    // Send the correct stats immediately after identification
    socket.emit('online-count', getCountsForUser(isAdminSocket));
    
    // Broadcast updated counts to everyone
    broadcastCounts();
  });
  
  // Emit initial counts when user connects (default to non-admin)
  socket.emit('online-count', getCountsForUser(false));
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Remove from all sets
    onlineUsers.registered.delete(socket.id);
    onlineUsers.guests.delete(socket.id);
    onlineUsers.admins.delete(socket.id);
    
    // Broadcast updated counts
    broadcastCounts();
  });
});

// Broadcast updates every 5 seconds (no need for 1s now that it's real)
setInterval(() => {
  broadcastCounts();
}, 5000);

server.listen(PORT, () => {
  console.log(`🚀 Online Users Server running on port ${PORT}`);
  console.log(`Connected users: ${onlineUsers.registered.size + onlineUsers.guests.size + onlineUsers.admins.size}`);
});
