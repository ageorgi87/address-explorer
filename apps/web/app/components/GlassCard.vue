<script setup lang="ts">
defineProps<{
  hoverable?: boolean
  padding?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <div
    class="glass"
    :class="[
      hoverable && 'glass-hover cursor-pointer',
      {
        'p-3': padding === 'sm',
        'p-5': padding === 'md' || !padding,
        'p-8': padding === 'lg',
      }
    ]"
  >
    <slot />
  </div>
</template>
