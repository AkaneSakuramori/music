<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import SearchMusic from "@/components/SearchMusic.vue";

const route = useRoute();
const roomId = route.params.roomId as string;
const isHost = computed(() => route.query.host === "1");

type Track = {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  artist?: string;
};

type PlaybackState = {
  trackId: string | null;
  position: number;
  isPlaying: boolean;
  updatedAt: number;
};

type RoomState = {
  roomId: string;
  queue: Track[];
  playback: PlaybackState;
};

const ws = ref<WebSocket | null>(null);
const connected = ref(false);
const roomState = ref<RoomState | null>(null);
const audioEl = ref<HTMLAudioElement | null>(null);

const joinLink = computed(() => {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/room/${roomId}`;
});

const currentTrack = computed<Track | null>(() => {
  if (!roomState.value?.playback.trackId) return null;
  return (
    roomState.value.queue.find(
      (t) => t.id === roomState.value!.playback.trackId
    ) ?? null
  );
});

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:2800";
const WS_URL =
  import.meta.env.VITE_WS_URL || "ws://localhost:2800/ws";

function connectWs() {
  const socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    connected.value = true;
    socket.send(
      JSON.stringify({
        type: "join",
        roomId,
        asHost: isHost.value
      })
    );
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "state") {
      roomState.value = msg.payload;
      syncAudioFromState();
    }
    if (msg.type === "playback_update") {
      if (!roomState.value) return;
      roomState.value.playback = msg.payload;
      syncAudioFromState();
    }
    if (msg.type === "queue_update") {
      if (!roomState.value) return;
      roomState.value.queue = msg.payload;
    }
  };

  socket.onclose = () => {
    connected.value = false;
    ws.value = null;
  };

  ws.value = socket;
}

function sendMessage(msg: any) {
  if (!ws.value || ws.value.readyState !== WebSocket.OPEN) return;
  ws.value.send(JSON.stringify(msg));
}

function addTrackFromSearch(track: {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  artist?: string;
}) {
  // push to server
  sendMessage({
    type: "add_track",
    roomId,
    track
  });
}

function hostSetPlayback(partial: Partial<PlaybackState>) {
  if (!isHost.value || !roomState.value) return;
  const current = roomState.value.playback;
  const next: PlaybackState = {
    trackId: partial.trackId ?? current.trackId,
    position: partial.position ?? current.position,
    isPlaying: partial.isPlaying ?? current.isPlaying,
    updatedAt: Date.now()
  };
  roomState.value.playback = next;
  sendMessage({
    type: "set_playback",
    roomId,
    state: next
  });
  syncAudioFromState();
}

function playTrack(trackId: string) {
  hostSetPlayback({
    trackId,
    position: 0,
    isPlaying: true
  });
}

function togglePlayPause() {
  if (!roomState.value) return;
  hostSetPlayback({
    isPlaying: !roomState.value.playback.isPlaying
  });
}

async function syncAudioFromState() {
  if (!roomState.value) return;
  const playback = roomState.value.playback;
  const track = currentTrack.value;
  if (!audioEl.value || !track) return;

  if (audioEl.value.src !== track.url) {
    audioEl.value.src = track.url;
    await audioEl.value.load();
  }

  const now = Date.now();
  const elapsed = (now - playback.updatedAt) / 1000;
  const targetPos = playback.isPlaying
    ? playback.position + elapsed
    : playback.position;

  if (Math.abs(audioEl.value.currentTime - targetPos) > 0.5) {
    audioEl.value.currentTime = targetPos;
  }

  if (playback.isPlaying) {
    if (audioEl.value.paused) {
      try {
        await audioEl.value.play();
      } catch {
        // autoplay blocked
      }
    }
  } else {
    if (!audioEl.value.paused) {
      audioEl.value.pause();
    }
  }
}

onMounted(() => {
  connectWs();
});

onBeforeUnmount(() => {
  if (ws.value) ws.value.close();
});
</script>

<template>
  <div class="min-h-screen bg-background text-foreground p-4">
    <div class="max-w-5xl mx-auto space-y-4">
      <!-- Room header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 class="text-lg font-semibold">
            Room <span class="font-mono text-sky-400">{{ roomId }}</span>
          </h1>
          <p class="text-xs text-muted-foreground">
            {{ isHost ? "You are host" : "You are guest" }} ·
            {{ connected ? "Connected" : "Disconnected" }}
          </p>
        </div>
        <div class="flex gap-2 items-center">
          <Input :readonly="true" :placeholder="joinLink" :value="joinLink" class="text-xs font-mono" />
          <Button
            variant="outline"
            @click="() => navigator.clipboard?.writeText(joinLink)"
          >
            Copy link
          </Button>
        </div>
      </div>

      <div class="grid md:grid-cols-[2fr,1fr] gap-4">
        <!-- Left: Player + Queue -->
        <div class="space-y-4">
          <div class="rounded-xl border border-border bg-slate-900 p-4 space-y-3">
            <h2 class="text-sm font-semibold">Now playing</h2>

            <div v-if="currentTrack" class="flex gap-3">
              <div
                class="w-16 h-16 rounded bg-slate-800 flex items-center justify-center text-xs"
              >
                <span v-if="currentTrack.thumbnail">
                  <img
                    :src="currentTrack.thumbnail"
                    alt=""
                    class="w-16 h-16 rounded object-cover"
                  />
                </span>
                <span v-else>Art</span>
              </div>
              <div class="space-y-1">
                <p class="text-sm font-semibold">{{ currentTrack.title }}</p>
                <p class="text-[10px] text-muted-foreground">
                  {{ currentTrack.artist || "Unknown artist" }}
                </p>
              </div>
            </div>
            <p v-else class="text-xs text-muted-foreground">
              No track selected.
              <span v-if="isHost">Search and add a track, then play.</span>
              <span v-else>Wait for host to start.</span>
            </p>

            <audio ref="audioEl" controls class="w-full mt-2" />

            <div v-if="isHost" class="flex gap-2">
              <Button
                :disabled="!currentTrack"
                variant="outline"
                @click="togglePlayPause"
              >
                {{ roomState?.playback.isPlaying ? "Pause" : "Play" }}
              </Button>
            </div>
          </div>

          <div class="rounded-xl border border-border bg-slate-900 p-4 space-y-3">
            <h2 class="text-sm font-semibold">Queue</h2>
            <div v-if="roomState?.queue.length" class="space-y-2">
              <div
                v-for="track in roomState.queue"
                :key="track.id"
                class="flex items-center justify-between gap-2 text-xs"
              >
                <div class="space-y-0.5">
                  <p class="font-medium">{{ track.title }}</p>
                  <p class="text-[10px] text-muted-foreground truncate max-w-xs">
                    {{ track.artist || track.url }}
                  </p>
                </div>
                <Button
                  v-if="isHost"
                  size="sm"
                  variant="outline"
                  @click="playTrack(track.id)"
                >
                  Play
                </Button>
              </div>
            </div>
            <p v-else class="text-xs text-muted-foreground">
              Queue is empty.
            </p>
          </div>
        </div>

        <!-- Right: Search -->
        <div class="rounded-xl border border-border bg-slate-900 p-4 space-y-3">
          <h2 class="text-sm font-semibold">Search & add tracks</h2>
          <SearchMusic @select="addTrackFromSearch" />
        </div>
      </div>
    </div>
  </div>
</template>
