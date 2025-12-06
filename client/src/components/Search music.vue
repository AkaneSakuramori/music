<script setup lang="ts">
import { ref } from "vue";
import Input from "@/components/ui/Input.vue";
import Button from "@/components/ui/Button.vue";

const query = ref("");
const loading = ref(false);
const results = ref<any[]>([]);
const error = ref("");

const emit = defineEmits<{
  (e: "select", track: {
    id: string;
    title: string;
    url: string;
    thumbnail: string;
    artist: string;
  }): void;
}>();

async function searchMusic() {
  if (!query.value.trim()) return;
  loading.value = true;
  error.value = "";
  results.value = [];

  try {
    const res = await fetch(
      `https://alphaapis.org/search?q=${encodeURIComponent(query.value)}`
    );
    const data = await res.json();
    if (!data.success) throw new Error("API error");
    results.value = data.results || [];
  } catch (e: any) {
    error.value = e?.message ?? "Failed to search";
  } finally {
    loading.value = false;
  }
}

function selectQuality(item: any, quality: any) {
  emit("select", {
    id: crypto.randomUUID(),
    title: item.title,
    url: quality.url,
    thumbnail: item.thumbnail,
    artist: item.artist
  });
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex gap-2">
      <Input v-model="query" placeholder="Search music…" />
      <Button :disabled="loading" @click="searchMusic">
        {{ loading ? "Searching…" : "Search" }}
      </Button>
    </div>
    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

    <div v-if="results.length" class="space-y-3 max-h-80 overflow-auto pr-1">
      <div
        v-for="item in results"
        :key="item.title + item.artist + item.duration"
        class="rounded-lg border border-border bg-slate-900 p-3 space-y-2"
      >
        <div class="flex gap-3">
          <img
            :src="item.thumbnail"
            alt=""
            class="w-14 h-14 rounded object-cover"
          />
          <div class="space-y-0.5">
            <p class="text-sm font-semibold">{{ item.title }}</p>
            <p class="text-[10px] text-muted-foreground">
              {{ item.artist }} · {{ item.year }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 pt-1">
          <Button
            v-for="q in item.download"
            :key="q.quality"
            size="sm"
            variant="outline"
            @click="selectQuality(item, q)"
          >
            {{ q.quality }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
