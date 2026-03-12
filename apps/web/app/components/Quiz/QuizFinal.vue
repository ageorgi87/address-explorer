<script setup lang="ts">
import { formatScore } from './lib/formatScore'
import { getRating } from './lib/getRating'

const props = defineProps<{
  totalScore: number
  scores: number[]
  communeName: string
}>()

defineEmits<{
  replay: []
  home: []
}>()

const maxPossibleScore = computed(() => props.scores.length * 1000)
const percentage = computed(() => Math.round((props.totalScore / maxPossibleScore.value) * 100))
const rating = computed(() => getRating(percentage.value))
</script>

<template>
  <div class="text-center">
    <GlassCard padding="lg" class="mb-6">
      <div class="score-pop">
        <span class="text-6xl mb-4 block">{{ rating.emoji }}</span>
        <h2 :class="['text-3xl font-bold mb-2', rating.color]">
          {{ rating.text }}
        </h2>
      </div>

      <p class="text-slate-400 mb-4">
        Quiz terminé pour <span class="text-slate-200">{{ communeName }}</span>
      </p>

      <div class="text-5xl font-bold gradient-text mb-2">
        {{ formatScore(totalScore) }}
      </div>
      <p class="text-slate-500">
        points sur {{ formatScore(maxPossibleScore) }} possibles ({{ percentage }}%)
      </p>
    </GlassCard>

    <!-- Score breakdown -->
    <GlassCard padding="md" class="mb-6">
      <h3 class="text-lg font-semibold text-slate-300 mb-4">Détail des scores</h3>
      <div class="grid grid-cols-5 gap-2">
        <div
          v-for="(score, index) in scores"
          :key="index"
          class="text-center p-2 rounded-lg"
          :class="score >= 600 ? 'bg-emerald-500/20' : score > 0 ? 'bg-yellow-500/20' : 'bg-red-500/20'"
        >
          <div class="text-xs text-slate-500 mb-1">Q{{ index + 1 }}</div>
          <div
            class="font-bold"
            :class="score >= 600 ? 'text-emerald-400' : score > 0 ? 'text-yellow-400' : 'text-red-400'"
          >
            {{ score > 0 ? `+${score}` : '0' }}
          </div>
        </div>
      </div>
    </GlassCard>

    <!-- Actions -->
    <div class="flex justify-center gap-4">
      <UButton
        size="lg"
        variant="outline"
        icon="i-heroicons-arrow-path"
        class="border-slate-600 text-slate-300 hover:bg-slate-800"
        @click="$emit('replay')"
      >
        Rejouer
      </UButton>
      <UButton
        size="lg"
        icon="i-heroicons-home"
        class="bg-indigo-600 hover:bg-indigo-500"
        @click="$emit('home')"
      >
        Accueil
      </UButton>
    </div>
  </div>
</template>
