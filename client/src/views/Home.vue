<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";

const router = useRouter();

const joinRoomId = ref("");
const creating = ref(false);
const error = ref("");

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:2800";

async function createRoom() {
  try {
    creating.value = true;
    error.value = "";
    const res = await fetch(`${BACKEND_URL}/api/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("Failed to create room");
    const data = await res.json();
    router.push({
      name: "room",
      params: { roomId: data.roomId },
      query: { host: "1" }
    });
  } catch (e: any) {
    error.value = e?.message ?? "Something went wrong";
  } finally {
    creating.value = false;
  }
}

function joinRoom() {
  if (!joinRoomId.value.trim()) return;
  router.push({
    name: "room",
    params: { roomId: joinRoomId.value.trim() }
  });
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted">
    <div class="w-full max-w-md rounded-xl border border-border bg-slate-900 p-6 space-y-6">
      <div>
        <h1 class="text-xl font-semibold">Music Jam Rooms</h1>
        <p class="text-xs text-muted-foreground mt-1">
          Create a room and share link, or join an existing room.
        </p>
      </div>

      <div class="space-y-2">
        <p class="text-sm text-muted-foreground">Host a new room</p>
        <Button class="w-full" :disabled="creating" @click="createRoom">
          {{ creating ? "Creating…" : "Create Room" }}
        </Button>
      </div>

      <div class="h-px bg-border" />

      <div class="space-y-2">
        <p class="text-sm text-muted-foreground">Join existing room</p>
        <div class="flex gap-2">
          <Input v-model="joinRoomId" placeholder="Enter Room ID" />
          <Button variant="outline" @click="joinRoom">Join</Button>
        </div>
      </div>

      <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
    </div>
  </div>
</template>
