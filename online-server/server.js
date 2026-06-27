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
  registered: new Set(),
  guests: new Set(),
  admins: new Set()
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

// Helper function to get counts for a specific user
function getCountsForUser(isAdmin) {
  const realTotal = onlineUsers.registered.size + onlineUsers.guests.size;
  const realRegistered = onlineUsers.registered.size;
  const realGuests = onlineUsers.guests.size;

  if (isAdmin) {
    return {
      total: realTotal, registered: realRegistered, guests: realGuests };
  } else {
    const fakeTotal = getFakeCount(realTotal);
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
  
  // Listen for user identification
  socket.on('identify-user', (data) => {
    // Handle both old format (boolean) and new format (object)
    let isRegistered = typeof data === 'boolean' ? data : data?.isRegistered || false;
    let isAdmin = typeof data === 'object' ? data?.isAdmin || false : false;
    
    // Remove from previous status if exists
    onlineUsers.registered.delete(socket.id);
    onlineUsers.guests.delete(socket.id);
    onlineUsers.admins.delete(socket.id);
    
    // Add to appropriate set
    if (isAdmin) {
      onlineUsers.admins.add(socket.id);
    } else if (isRegistered) {
      onlineUsers.registered.add(socket.id);
    } else {
      onlineUsers.guests.add(socket.id);
    }
    
    // Broadcast updated counts
    broadcastCounts();
  });
  
  // Emit initial counts when user connects
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
