<script setup lang="ts">
defineProps<{
  address: string;
  questionNumber: number;
  totalQuestions: number;
}>();
</script>

<template>
  <GlassCard padding="lg" class="text-center">
    <div class="flex items-center justify-center gap-2 text-slate-500 mb-4">
      <UIcon name="i-heroicons-map-pin" class="text-indigo-400" />
      <span>Trouve cette adresse</span>
    </div>

    <p class="text-2xl md:text-3xl font-bold text-slate-100 mb-6">
      « {{ address }} »
    </p>

    <div class="flex items-center justify-center gap-4">
      <span class="text-slate-400">
        Question {{ questionNumber }} / {{ totalQuestions }}
      </span>
    </div>

    <!-- Progress bar -->
    <div class="progress-bar mt-4 max-w-xs mx-auto">
      <div
        class="progress-bar-fill"
        :style="{ width: `${(questionNumber / totalQuestions) * 100}%` }"
      />
    </div>
  </GlassCard>
</template>
