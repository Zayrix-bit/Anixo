import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';

const PORT = process.env.PORT || 7861;

// Create HTTP server
const server = http.createServer();

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
  uniqueRegistered: new Map() // username -> { userData, count: number }
};

// Track fake count state
let fakeCountState = {
  baseCount: 100 + Math.floor(Math.random() * 200), // Start between 100-300
  lastUpdated: Date.now(),
  trend: 0,
  lastTrendChange: Date.now()
};

// Update fake count trend very fast
function updateFakeCountTrend() {
  const now = Date.now();
  const timeSinceLastChange = now - fakeCountState.lastTrendChange;
  const timeSinceLastUpdate = now - fakeCountState.lastUpdated;
  
  // Change trend every 3-10 seconds
  if (timeSinceLastChange > 3000 + Math.random() * 7000) {
    // 40% chance of stable (trend = 0), 60% chance of changing
    if (Math.random() < 0.4) {
      fakeCountState.trend = 0;
    } else {
      // Random trend: -20 to +20
      fakeCountState.trend = Math.floor(Math.random() * 41) - 20;
    }
    fakeCountState.lastTrendChange = now;
  }
  
  // Change base count (every 500ms)
  if (timeSinceLastUpdate > 500) {
    fakeCountState.baseCount = Math.max(100, Math.min(500, fakeCountState.baseCount + fakeCountState.trend));
    fakeCountState.lastUpdated = now;
  }
}

// Helper function to generate fake count with fast realistic variation
function getFakeCount(realCount) {
  updateFakeCountTrend();
  
  // Add small random variation around base count
  const variation = Math.floor(Math.random() * 21) - 10; // ±10
  return Math.max(100, fakeCountState.baseCount + variation);
}

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

// Helper function to get counts for a specific user
function getCountsForUser(isAdmin) {
  const uniqueCounts = getUniqueCounts();

  if (isAdmin) {
    return {
      total: uniqueCounts.total,
      registered: uniqueCounts.uniqueRegistered,
      guests: uniqueCounts.guests,
      users: getRegisteredUsers()
    };
  } else {
    const fakeTotal = getFakeCount(uniqueCounts.total);
    const fakeRegistered = Math.floor(fakeTotal * 0.3); // 30% registered
    const fakeGuests = fakeTotal - fakeRegistered;
    return { total: fakeTotal, registered: fakeRegistered, guests: fakeGuests };
  }
}

// Broadcast counts to all users (with real or fake)
function broadcastCounts() {
  // Emit to each connected socket individually
  io.sockets.sockets.forEach((socket) => {
    const isAdmin = onlineUsers.admins.has(socket.id);
    socket.emit('online-count', getCountsForUser(isAdmin));
  });
}

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
      avatar: data?.avatar || ''
    } : { username: 'User', displayName: 'User', avatar: '' };
    
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
  
  // Emit initial counts when user connects (default to non-admin/fake)
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

// Broadcast updates every 1 second
setInterval(() => {
  updateFakeCountTrend();
  broadcastCounts();
}, 1000);

server.listen(PORT, () => {
  console.log(`🚀 Online Users Server running on port ${PORT}`);
  console.log(`Connected users: ${onlineUsers.registered.size + onlineUsers.guests.size + onlineUsers.admins.size}`);
});
