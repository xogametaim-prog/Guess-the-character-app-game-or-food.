import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { CATEGORIES } from "./src/data/categories.js";

interface Player {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  currentItemId: string | null;
  history: { itemId: string; guessed: boolean }[];
}

interface Room {
  code: string;
  hostId: string;
  players: Player[];
  category: string;
  language: "en" | "ar";
  gameState: "LOBBY" | "PLAYING" | "ROUND_END";
  timerDuration: number;
  roundStartedAt: number | null;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory Room database
const rooms: Record<string, Room> = {};

// Clean up old rooms periodically (e.g. older than 2 hours)
setInterval(() => {
  const now = Date.now();
  Object.keys(rooms).forEach((code) => {
    const room = rooms[code];
    if (room.roundStartedAt && now - room.roundStartedAt > 2 * 60 * 60 * 1000) {
      delete rooms[code];
    }
  });
}, 15 * 60 * 1000);

// Helper to generate a random room code
function generateRoomCode(): string {
  let code = "";
  const chars = "0123456789";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Ensure uniqueness
  if (rooms[code]) return generateRoomCode();
  return code;
}

// Helper to get random item for a player
function getRandomItem(categoryId: string, excludeIds: string[] = []): string {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return "";
  const available = category.items.filter((item) => !excludeIds.includes(item.id));
  const pool = available.length > 0 ? available : category.items;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex].id;
}

// API: Create a room
app.post("/api/rooms/create", (req, res) => {
  const { hostName, avatar, category, language, timerDuration, customCode } = req.body;
  
  let code = "";
  if (customCode && String(customCode).trim()) {
    const cleanCustom = String(customCode).trim().toUpperCase();
    if (rooms[cleanCustom]) {
      return res.status(400).json({ success: false, message: "Room code already in use / رمز الغرفة مستخدم بالفعل" });
    }
    code = cleanCustom;
  } else {
    code = generateRoomCode();
  }

  const hostId = "p_" + Math.random().toString(36).substr(2, 9);

  const newRoom: Room = {
    code,
    hostId,
    players: [
      {
        id: hostId,
        name: hostName || "Host",
        avatar: avatar || "👑",
        score: 0,
        currentItemId: null,
        history: [],
      },
    ],
    category: category || "fruits",
    language: language || "en",
    gameState: "LOBBY",
    timerDuration: timerDuration || 60,
    roundStartedAt: null,
  };

  rooms[code] = newRoom;
  res.json({ success: true, room: newRoom, playerId: hostId });
});

// API: Join a room
app.post("/api/rooms/join", (req, res) => {
  const { code, name, avatar } = req.body;
  const cleanCode = String(code).trim().toUpperCase();
  const room = rooms[cleanCode];

  if (!room) {
    return res.status(404).json({ success: false, message: "Room not found / الغرفة غير موجودة" });
  }

  if (room.gameState !== "LOBBY") {
    return res.status(400).json({ success: false, message: "Game has already started / اللعبة بدأت بالفعل" });
  }

  if (room.players.length >= 10) {
    return res.status(400).json({ success: false, message: "Room is full (Max 10 players) / الغرفة ممتلئة (الحد الأقصى 10 لاعبين)" });
  }

  const playerId = "p_" + Math.random().toString(36).substr(2, 9);
  const newPlayer: Player = {
    id: playerId,
    name: name || `Player ${room.players.length + 1}`,
    avatar: avatar || "🤠",
    score: 0,
    currentItemId: null,
    history: [],
  };

  room.players.push(newPlayer);
  res.json({ success: true, room, playerId });
});

// API: Get room details
app.get("/api/rooms/:code", (req, res) => {
  const room = rooms[req.params.code];
  if (!room) {
    return res.status(404).json({ success: false, message: "Room not found" });
  }
  res.json({ success: true, room });
});

// API: Start round
app.post("/api/rooms/:code/start", (req, res) => {
  const { code } = req.params;
  const room = rooms[code];

  if (!room) {
    return res.status(404).json({ success: false, message: "Room not found" });
  }

  room.gameState = "PLAYING";
  room.roundStartedAt = Date.now();

  // Assign a random item to each player
  room.players.forEach((player) => {
    player.score = 0;
    player.history = [];
    player.currentItemId = getRandomItem(room.category);
  });

  res.json({ success: true, room });
});

// API: Submit card action (Correct or Pass) for a specific player
app.post("/api/rooms/:code/player-action", (req, res) => {
  const { code } = req.params;
  const { targetPlayerId, action } = req.body; // action: "correct" | "pass"
  const room = rooms[code];

  if (!room) {
    return res.status(404).json({ success: false, message: "Room not found" });
  }

  const player = room.players.find((p) => p.id === targetPlayerId);
  if (!player || !player.currentItemId) {
    return res.status(404).json({ success: false, message: "Player or active card not found" });
  }

  // Record history
  player.history.push({
    itemId: player.currentItemId,
    guessed: action === "correct",
  });

  if (action === "correct") {
    player.score += 10;
  } else {
    player.score = Math.max(0, player.score - 5);
  }

  // Get next unique random item for player
  const excludedIds = player.history.map((h) => h.itemId);
  player.currentItemId = getRandomItem(room.category, excludedIds);

  res.json({ success: true, room });
});

// API: Change Room Settings (Only host in lobby)
app.post("/api/rooms/:code/settings", (req, res) => {
  const { code } = req.params;
  const { category, language, timerDuration } = req.body;
  const room = rooms[code];

  if (!room) {
    return res.status(404).json({ success: false, message: "Room not found" });
  }

  if (category) room.category = category;
  if (language) room.language = language;
  if (timerDuration !== undefined) room.timerDuration = timerDuration;

  res.json({ success: true, room });
});

// API: End round manually or on timer expiration
app.post("/api/rooms/:code/end", (req, res) => {
  const { code } = req.params;
  const room = rooms[code];

  if (!room) {
    return res.status(404).json({ success: false, message: "Room not found" });
  }

  room.gameState = "ROUND_END";
  res.json({ success: true, room });
});

// API: Restart/Reset to Lobby
app.post("/api/rooms/:code/reset", (req, res) => {
  const { code } = req.params;
  const room = rooms[code];

  if (!room) {
    return res.status(404).json({ success: false, message: "Room not found" });
  }

  room.gameState = "LOBBY";
  room.roundStartedAt = null;
  room.players.forEach((player) => {
    player.score = 0;
    player.currentItemId = null;
    player.history = [];
  });

  res.json({ success: true, room });
});

// API: Leave room
app.post("/api/rooms/:code/leave", (req, res) => {
  const { code } = req.params;
  const { playerId } = req.body;
  const room = rooms[code];

  if (!room) {
    return res.status(404).json({ success: false, message: "Room not found" });
  }

  room.players = room.players.filter((p) => p.id !== playerId);

  // If room is empty, delete it
  if (room.players.length === 0) {
    delete rooms[code];
  } else if (room.hostId === playerId) {
    // Reassign host
    room.hostId = room.players[0].id;
  }

  res.json({ success: true });
});

// Mount Vite middleware for development or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
