const express = require("express");
const http = require("http");
const cors = require("cors");
const { WebSocketServer } = require("ws");
const { v4: uuidv4 } = require("uuid");

const PORT = 2800;

// --- room + client state ---

/**
 * rooms: Map<roomId, RoomState>
 * RoomState = {
 *  roomId: string,
 *  queue: Track[],
 *  playback: { trackId, position, isPlaying, updatedAt }
 * }
 *
 * clients: Map<ws, { roomId: string, isHost: boolean }>
 */
const rooms = new Map();
const clients = new Map();

// --- express setup ---

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Music Jam server running" });
});

app.post("/api/rooms", (req, res) => {
  const roomId = uuidv4().slice(0, 6); // short id
  const state = {
    roomId,
    queue: [],
    playback: {
      trackId: null,
      position: 0,
      isPlaying: false,
      updatedAt: Date.now()
    }
  };
  rooms.set(roomId, state);
  console.log("Created room:", roomId);
  res.json({ roomId });
});

const server = http.createServer(app);

// --- websocket setup ---

const wss = new WebSocketServer({ server, path: "/ws" });

function broadcast(roomId, msg) {
  const data = JSON.stringify(msg);
  for (const [socket, meta] of clients.entries()) {
    if (meta.roomId === roomId && socket.readyState === socket.OPEN) {
      socket.send(data);
    }
  }
}

wss.on("connection", (ws) => {
  console.log("WS client connected");

  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      console.warn("Invalid JSON from client");
      return;
    }

    if (msg.type === "join") {
      const { roomId, asHost } = msg;
      const room = rooms.get(roomId);
      if (!room) {
        ws.send(
          JSON.stringify({
            type: "error",
            payload: { message: "Room not found" }
          })
        );
        return;
      }

      clients.set(ws, { roomId, isHost: !!asHost });
      console.log("Client joined room:", roomId, "host:", !!asHost);
      ws.send(JSON.stringify({ type: "state", payload: room }));
      return;
    }

    const meta = clients.get(ws);
    if (!meta) return;
    const room = rooms.get(meta.roomId);
    if (!room) return;

    if (msg.type === "add_track") {
      const track = msg.track;
      if (!track || !track.id || !track.url) return;
      room.queue.push(track);
      broadcast(meta.roomId, {
        type: "queue_update",
        payload: room.queue
      });
      return;
    }

    if (msg.type === "set_playback") {
      if (!meta.isHost) return; // only host can control
      const state = msg.state;
      if (!state) return;
      room.playback = {
        trackId: state.trackId ?? room.playback.trackId,
        position: Number(state.position ?? room.playback.position) || 0,
        isPlaying: !!state.isPlaying,
        updatedAt: Date.now()
      };
      broadcast(meta.roomId, {
        type: "playback_update",
        payload: room.playback
      });
      return;
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("WS client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
