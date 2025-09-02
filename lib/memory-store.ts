// Shared in-memory storage for development
// In production, this would be replaced with a proper database

export const rooms = new Map();
export const tokens = new Map();

// Clean up expired data periodically (optional)
setInterval(() => {
  const now = Date.now();
  const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
  
  // Clean up old rooms
  for (const [code, room] of rooms.entries()) {
    if (now - room.createdAt > EXPIRY_TIME) {
      rooms.delete(code);
      console.log(`Cleaned up expired room: ${code}`);
    }
  }
  
  // Clean up old tokens
  for (const [token, data] of tokens.entries()) {
    if (now - data.createdAt > EXPIRY_TIME) {
      tokens.delete(token);
    }
  }
}, 60 * 60 * 1000); // Run every hour
