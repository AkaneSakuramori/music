<script setup lang="ts">
const modelValue = defineModel<string | number | undefined>();
const props = defineProps<{
  type?: string;
  readonly?: boolean;
  placeholder?: string;
}>();
</script>

<template>
  <input
    v-model="modelValue"
    :type="props.type ?? 'text'"
    :readonly="props.readonly"
    :placeholder="props.placeholder"
    class="flex h-9 w-full rounded-md border border-border bg-slate-900 px-3 py-1 text-sm
           text-foreground shadow-sm
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500
           placeholder:text-muted-foreground
    "
  />
</template>
