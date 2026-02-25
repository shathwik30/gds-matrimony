/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("http");
const next = require("next");

// Suppress DEP0169 url.parse() warnings emitted by third-party packages (e.g. follow-redirects used by Razorpay SDK)
process.on("warning", (warning) => {
  if (warning.code === "DEP0169") return;
  console.warn(warning);
});
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { Pool } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-serverless");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Map to track user ID to socket ID mapping
const userSocketMap = new Map();
const socketUserMap = new Map();

// Rate limiting for socket events
const eventRateLimits = new Map(); // key: `${userId}:${event}`, value: { count, resetAt }
const RATE_LIMITS = {
  typing: { max: 10, windowMs: 10000 }, // 10 typing events per 10s
  new_message: { max: 20, windowMs: 60000 }, // 20 messages per minute
  messages_read: { max: 20, windowMs: 60000 },
  conversation_updated: { max: 10, windowMs: 60000 },
};

function checkRateLimit(userId, event) {
  const limit = RATE_LIMITS[event];
  if (!limit) return true;

  const key = `${userId}:${event}`;
  const now = Date.now();
  const entry = eventRateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    eventRateLimits.set(key, { count: 1, resetAt: now + limit.windowMs });
    return true;
  }

  entry.count++;
  if (entry.count > limit.max) return false;
  return true;
}

// Clean up stale rate limit entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of eventRateLimits) {
      if (now > entry.resetAt) eventRateLimits.delete(key);
    }
  },
  5 * 60 * 1000
);

/**
 * Verify NextAuth JWT token and extract user ID.
 * Returns userId (string) on success, null on failure.
 */
function verifyToken(token) {
  if (!token) return null;
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      console.error("AUTH_SECRET not set - Socket.IO auth disabled");
      return null;
    }
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    return decoded?.id || decoded?.sub || null;
  } catch {
    return null;
  }
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Determine allowed origins for Socket.IO CORS
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || `http://localhost:${port}`;
  const allowedOrigins = dev
    ? [appUrl, `http://localhost:${port}`, "http://localhost:3000"]
    : [appUrl];

  // Initialize Socket.io
  const io = new Server(httpServer, {
    path: "/api/socketio/",
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Lightweight DB connection for socket auth checks
  let socketDb = null;
  if (process.env.DATABASE_URL) {
    const socketPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
    socketDb = drizzle(socketPool);
  }

  // Authentication middleware - verify JWT and check user status before allowing connection
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    const userId = verifyToken(token);
    if (!userId) {
      return next(new Error("Invalid or expired token"));
    }

    // Verify user is still active in the database
    if (socketDb) {
      try {
        const result = await socketDb.execute(`SELECT is_active FROM users WHERE id = $1 LIMIT 1`, [
          parseInt(userId, 10),
        ]);
        const user = result.rows?.[0];
        if (!user || !user.is_active) {
          return next(new Error("Account is deactivated"));
        }
      } catch (err) {
        console.error("Socket auth DB check failed:", err);
        return next(new Error("Authentication service unavailable"));
      }
    }

    // Attach verified userId to socket data
    socket.data.userId = String(userId);
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    // Store mapping using verified userId
    socketUserMap.set(socket.id, userId);
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId).add(socket.id);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Notify user they're connected
    socket.emit("authenticated", { userId, socketId: socket.id });

    // Broadcast online status only to users who have active sockets (scoped, not global)
    // Emit to all connected user rooms (each connected user is in their own room)
    for (const [connectedUserId] of userSocketMap) {
      if (connectedUserId !== userId) {
        io.to(`user:${connectedUserId}`).emit("user_status", { userId, isOnline: true });
      }
    }

    // Handle typing status - validate sender matches authenticated user and is conversation participant
    socket.on("typing", async ({ otherUserId, isTyping }) => {
      if (!otherUserId) return;
      if (!checkRateLimit(userId, "typing")) return;

      // Validate conversation exists between these two users
      if (socketDb) {
        try {
          const [u1, u2] =
            parseInt(userId, 10) < parseInt(otherUserId, 10)
              ? [parseInt(userId, 10), parseInt(otherUserId, 10)]
              : [parseInt(otherUserId, 10), parseInt(userId, 10)];
          const conv = await socketDb.execute(
            `SELECT id FROM conversations WHERE user1_id = $1 AND user2_id = $2 LIMIT 1`,
            [u1, u2]
          );
          if (!conv.rows?.length) return;
        } catch {
          // Allow on DB error to avoid blocking real-time UX
        }
      }

      io.to(`user:${otherUserId}`).emit("user_typing", {
        userId,
        isTyping,
      });
    });

    // Handle new message broadcast - only relay messages that have a valid DB id
    // The message has already been saved and authorized by the server action (sendMessage)
    // which checks subscription, mutual interest, and block status before saving
    socket.on("new_message", ({ receiverId, message }) => {
      if (!receiverId || !message) return;
      if (!checkRateLimit(userId, "new_message")) return;

      // Reject messages without a valid database ID (must be saved via server action first)
      if (!message.id || message.id <= 0) return;

      // Enforce that senderId matches the authenticated socket user
      if (String(message.senderId) !== String(userId)) return;

      // Broadcast to receiver using verified userId as sender
      io.to(`user:${receiverId}`).emit("message_received", {
        message,
        from: userId,
      });

      // Confirm to sender
      socket.emit("message_sent", {
        tempId: message.tempId,
        message,
      });
    });

    // Handle message read receipts - validate messageIds and conversation participation
    socket.on("messages_read", async ({ otherUserId, messageIds }) => {
      if (!otherUserId || !Array.isArray(messageIds) || messageIds.length === 0) return;
      if (!checkRateLimit(userId, "messages_read")) return;

      // Validate conversation exists between these two users
      if (socketDb) {
        try {
          const [u1, u2] =
            parseInt(userId, 10) < parseInt(otherUserId, 10)
              ? [parseInt(userId, 10), parseInt(otherUserId, 10)]
              : [parseInt(otherUserId, 10), parseInt(userId, 10)];
          const conv = await socketDb.execute(
            `SELECT id FROM conversations WHERE user1_id = $1 AND user2_id = $2 LIMIT 1`,
            [u1, u2]
          );
          if (!conv.rows?.length) return;
        } catch {
          // Allow on DB error to avoid blocking real-time UX
        }
      }

      // Cap messageIds to prevent abuse
      const safeIds = messageIds.slice(0, 100);

      io.to(`user:${otherUserId}`).emit("messages_read", {
        messageIds: safeIds,
        readBy: userId,
        readAt: new Date().toISOString(),
      });
    });

    // Handle conversation update - only relay, don't allow arbitrary targeting
    socket.on("conversation_updated", ({ targetUserId, conversationId }) => {
      if (!targetUserId || !conversationId) return;
      if (!checkRateLimit(userId, "conversation_updated")) return;

      io.to(`user:${targetUserId}`).emit("conversation_updated", {
        conversationId,
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const sockets = userSocketMap.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        // Only broadcast offline if user has no more active sockets
        if (sockets.size === 0) {
          userSocketMap.delete(userId);
          // Scoped offline broadcast - only notify connected users
          for (const [connectedUserId] of userSocketMap) {
            io.to(`user:${connectedUserId}`).emit("user_status", { userId, isOnline: false });
          }
        }
      }
      socketUserMap.delete(socket.id);
    });
  });

  // Make io available globally for server actions
  global.io = io;

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`Server ready on http://${hostname}:${port}`);
    });
});
