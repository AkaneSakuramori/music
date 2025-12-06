<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: "default" | "outline";
    size?: "default" | "sm";
    disabled?: boolean;
  }>(),
  {
    variant: "default",
    size: "default",
    disabled: false
  }
);
</script>

<template>
  <button
    :disabled="props.disabled"
    class="inline-flex items-center justify-center rounded-md text-sm font-medium transition px-4 py-2 border border-transparent
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500
      disabled:opacity-50 disabled:cursor-not-allowed
      "
    :class="[
      props.variant === 'outline'
        ? 'bg-transparent border border-border hover:bg-slate-900'
        : 'bg-sky-600 hover:bg-sky-700',
      props.size === 'sm' ? 'px-3 py-1 text-xs' : ''
    ]"
  >
    <slot />
  </button>
</template>
