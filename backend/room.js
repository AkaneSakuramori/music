import { randomUUID } from "crypto";

export const rooms = new Map(); // roomId → state

export function createRoom() {
  const roomId = randomUUID().slice(0, 6);

  rooms.set(roomId, {
    roomId,
    queue: [],
    playback: {
      trackId: null,
      position: 0,
      isPlaying: false,
      updatedAt: Date.now()
    }
  });

  return roomId;
}
