<script setup lang="ts">
import { getScoreMessage } from './lib/getScoreMessage'
import { formatScore } from './lib/formatScore'
import { formatDistance } from './lib/formatDistance'

const props = defineProps<{
  score: number
  distance: number
  isLastQuestion: boolean
}>()

defineEmits<{
  next: []
}>()

const message = computed(() => getScoreMessage(props.score))
</script>

<template>
  <GlassCard padding="lg" class="text-center">
    <div class="score-pop">
      <span class="text-5xl mb-2 block">{{ message.emoji }}</span>
      <p :class="['text-2xl font-bold mb-2', message.color]">
        {{ message.text }}
      </p>
    </div>

    <div class="space-y-2 mb-6">
      <p class="text-slate-400">
        Distance : <span class="text-slate-200 font-medium">{{ formatDistance(distance) }}</span>
      </p>
      <p class="text-2xl font-bold text-indigo-400">
        +{{ formatScore(score) }} points
      </p>
    </div>

    <UButton
      size="lg"
      :icon="isLastQuestion ? 'i-heroicons-trophy' : 'i-heroicons-arrow-right'"
      trailing
      class="bg-indigo-600 hover:bg-indigo-500"
      @click="$emit('next')"
    >
      {{ isLastQuestion ? 'Voir le résultat' : 'Question suivante' }}
    </UButton>
  </GlassCard>
</template>
