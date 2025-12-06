import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import http from "http";
import { createRoom, rooms } from "./rooms.js";

const app = express();
app.use(cors());
app.use(express.json());

// CREATE ROOM
app.post("/rooms", (req, res) => {
  const roomId = createRoom();
  res.json({ roomId });
});

const server = http.createServer(app);

// WS SERVER
const wss = new WebSocketServer({ server });
const clients = new Map(); // ws → { roomId, isHost }

function broadcast(roomId, msg) {
  for (const [socket, meta] of clients.entries()) {
    if (meta.roomId === roomId && socket.readyState === 1) {
      socket.send(JSON.stringify(msg));
    }
  }
}

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const msg = JSON.parse(message);
    const type = msg.type;

    // JOIN ROOM
    if (type === "join") {
      const { roomId, asHost } = msg;

      const room = rooms.get(roomId);
      if (!room) return;

      clients.set(ws, { roomId, isHost: !!asHost });

      ws.send(JSON.stringify({ type: "state", payload: room }));
      return;
    }

    const meta = clients.get(ws);
    if (!meta) return;

    const room = rooms.get(meta.roomId);
    if (!room) return;

    // ADD TRACK
    if (type === "add_track") {
      room.queue.push(msg.track);
      broadcast(meta.roomId, {
        type: "queue_update",
        payload: room.queue
      });
    }

    // HOST CONTROLS PLAYBACK
    if (type === "set_playback" && meta.isHost) {
      room.playback = {
        ...msg.state,
        updatedAt: Date.now()
      };

      broadcast(meta.roomId, {
        type: "playback_update",
        payload: room.playback
      });
    }
  });

  ws.on("close", () => clients.delete(ws));
});

server.listen(2800, () =>
  console.log("Backend running on port 2800")
);
