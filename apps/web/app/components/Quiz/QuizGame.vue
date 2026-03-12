<script setup lang="ts">
import { haversineDistance } from "./lib/haversineDistance";
import { calculateScore } from "./lib/calculateScore";
import { calculateBounds } from "./lib/calculateBounds";
import { TOTAL_QUESTIONS } from "./config/quizConfig";

interface Address {
  id: string;
  label: string;
  lat: number;
  lon: number;
}

type GameState = "playing" | "answered" | "finished";

const props = defineProps<{
  addresses: Address[];
  communeName: string;
}>();

const communeBounds = computed(() => calculateBounds(props.addresses));

const state = ref<GameState>("playing");

const questions = ref<Address[]>([]);
const currentQuestionIndex = ref(0);
const scores = ref<number[]>([]);

const guessPosition = ref<{ lat: number; lon: number } | null>(null);
const currentScore = ref(0);
const currentDistance = ref(0);

const initGame = () => {
  const shuffled = [...props.addresses].sort(() => Math.random() - 0.5);
  questions.value = shuffled.slice(
    0,
    Math.min(TOTAL_QUESTIONS, shuffled.length),
  );
  currentQuestionIndex.value = 0;
  scores.value = [];
  state.value = "playing";
  guessPosition.value = null;
};

const currentQuestion = computed(
  () => questions.value[currentQuestionIndex.value],
);

const handleMapClick = (lat: number, lon: number) => {
  if (state.value !== "playing") return;
  guessPosition.value = { lat, lon };
};

const validateGuess = () => {
  if (!guessPosition.value || !currentQuestion.value) return;

  const distance = haversineDistance(
    guessPosition.value.lat,
    guessPosition.value.lon,
    currentQuestion.value.lat,
    currentQuestion.value.lon,
  );

  currentDistance.value = distance;
  currentScore.value = calculateScore(distance);
  scores.value.push(currentScore.value);
  state.value = "answered";
};

const nextQuestion = () => {
  if (currentQuestionIndex.value >= questions.value.length - 1) {
    state.value = "finished";
  } else {
    currentQuestionIndex.value++;
    state.value = "playing";
    guessPosition.value = null;
  }
};

const replay = () => {
  initGame();
};

const goHome = () => {
  navigateTo("/");
};

const totalScore = computed(() => scores.value.reduce((a, b) => a + b, 0));

const answerPosition = computed(() =>
  currentQuestion.value
    ? { lat: currentQuestion.value.lat, lon: currentQuestion.value.lon }
    : null,
);

onMounted(() => {
  initGame();
});

defineExpose({
  replay,
});
</script>

<template>
  <div v-if="questions.length === 0" class="text-center py-12">
    <UIcon
      name="i-heroicons-exclamation-triangle"
      class="text-4xl text-yellow-500 mb-4"
    />
    <p class="text-slate-400">Pas assez d'adresses pour jouer</p>
  </div>

  <div v-else>
    <!-- Header with score -->
    <div class="flex items-center justify-between mb-6">
      <NuxtLink
        to="/"
        class="text-slate-400 hover:text-slate-200 flex items-center gap-2 transition-colors"
      >
        <UIcon name="i-heroicons-arrow-left" />
        Retour
      </NuxtLink>
      <div class="glass px-4 py-2 flex items-center gap-2">
        <UIcon name="i-heroicons-trophy" class="text-yellow-400" />
        <span class="font-bold text-slate-100">{{
          totalScore.toLocaleString()
        }}</span>
        <span class="text-slate-500">pts</span>
      </div>
    </div>

    <!-- Final screen -->
    <QuizFinal
      v-if="state === 'finished'"
      :total-score="totalScore"
      :scores="scores"
      :commune-name="communeName"
      @replay="replay"
      @home="goHome"
    />

    <!-- Game screen -->
    <template v-else>
      <!-- Question or Result -->
      <div class="mb-6">
        <QuizQuestion
          v-if="state === 'playing'"
          :address="currentQuestion?.label ?? ''"
          :question-number="currentQuestionIndex + 1"
          :total-questions="questions.length"
        />
        <QuizResult
          v-else-if="state === 'answered'"
          :score="currentScore"
          :distance="currentDistance"
          :is-last-question="currentQuestionIndex >= questions.length - 1"
          @next="nextQuestion"
        />
      </div>

      <!-- Map -->
      <GlassCard padding="sm" class="mb-6">
        <div class="h-[400px] md:h-[500px] rounded-lg overflow-hidden">
          <ClientOnly>
            <QuizMap
              :guess-position="guessPosition"
              :answer-position="state === 'answered' ? answerPosition : null"
              :show-answer="state === 'answered'"
              :commune-bounds="communeBounds"
              @click="handleMapClick"
            />
            <template #fallback>
              <div class="h-full flex items-center justify-center bg-slate-900">
                <UIcon
                  name="i-heroicons-arrow-path"
                  class="animate-spin text-2xl text-slate-500"
                />
              </div>
            </template>
          </ClientOnly>
        </div>
      </GlassCard>

      <!-- Validate button -->
      <div v-if="state === 'playing'" class="text-center">
        <UButton
          size="xl"
          :disabled="!guessPosition"
          class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="validateGuess"
        >
          <UIcon name="i-heroicons-check" class="mr-2" />
          Valider ma réponse
        </UButton>
        <p v-if="!guessPosition" class="text-slate-500 text-sm mt-3">
          Cliquez sur la carte pour placer votre réponse
        </p>
      </div>
    </template>
  </div>
</template>
