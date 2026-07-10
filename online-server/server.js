import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

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
  pingInterval: 10000, // Send ping every 10 seconds (default 25s)
  pingTimeout: 5000,   // Close connection if no pong in 5 seconds (default 20s)
  cors: {
    origin: '*', // Allow all origins for development, restrict in production
    methods: ['GET', 'POST']
  }
});

// Track online users - separate registered, guests, and admins
const onlineUsers = {
  registered: new Map(), // socket.id -> { username, displayName, avatar }
  guests: new Map(),     // socket.id -> IP address
  admins: new Map(),     // socket.id -> { username, displayName, avatar }
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
  const uniqueGuestSet = new Set();
  
  // Add all admin usernames
  for (const [, userData] of onlineUsers.admins.entries()) {
    if (userData.username) {
      uniqueRegisteredSet.add(userData.username);
    }
  }
  
  // Add all registered usernames
  for (const [, userData] of onlineUsers.registered.entries()) {
    if (userData.username) {
      uniqueRegisteredSet.add(userData.username);
    }
  }
  
  // Add all guest IPs
  for (const [, guestIp] of onlineUsers.guests.entries()) {
    uniqueGuestSet.add(guestIp);
  }
  
  const uniqueRegistered = uniqueRegisteredSet.size;
  const guests = uniqueGuestSet.size;
  
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
  const counts = getCountsForUser();
  // Emit to each connected socket individually (using pre-computed counts)
  io.sockets.sockets.forEach((socket) => {
    socket.emit('online-count', counts);
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
  
  // Listen for user identification
  socket.on('identify-user', (data) => {
    let isRegistered = false;
    let isAdminSocket = false;
    let userInfo = { username: 'User', displayName: 'Guest', avatar: '', profileId: '' };

    if (data?.token) {
      try {
        const decoded = jwt.verify(data.token, JWT_SECRET);
        isRegistered = true;
        isAdminSocket = data.isAdmin || false; // Trust their claimed role only because they have a valid token
        userInfo = {
          username: data.username || 'User',
          displayName: data.displayName || data.username || 'User',
          avatar: data.avatar || '',
          profileId: decoded.id
        };
      } catch (err) {
        console.warn(`[Socket Auth] Invalid token from socket ${socket.id}:`, err.message);
      }
    }
    
    // Remove from previous status if exists
    onlineUsers.registered.delete(socket.id);
    onlineUsers.guests.delete(socket.id);
    onlineUsers.admins.delete(socket.id);
    
    // Get client IP address
    const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || socket.id;

    // Add to appropriate set
    if (isAdminSocket) {
      onlineUsers.admins.set(socket.id, userInfo);
    } else if (isRegistered) {
      onlineUsers.registered.set(socket.id, userInfo);
    } else {
      onlineUsers.guests.set(socket.id, clientIp);
    }
    
    // Send the correct stats immediately after identification
    socket.emit('online-count', getCountsForUser());
    
    // Broadcast updated counts to everyone
    broadcastCounts();
  });
  
  // Emit initial counts when user connects (default to non-admin)
  socket.emit('online-count', getCountsForUser());
  
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
