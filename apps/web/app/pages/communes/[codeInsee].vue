<script setup lang="ts">
import { COMMUNE_QUERY, type CommuneData } from '../../queries/commune'

const route = useRoute()
const codeInsee = computed(() => route.params.codeInsee as string)

const { data, pending, error } = await useAsyncQuery<CommuneData>(
  COMMUNE_QUERY,
  { codeInsee: codeInsee.value }
)

const commune = computed(() => data.value?.commune)

const quizAddresses = computed(() => {
  if (!commune.value?.voies) return []

  return commune.value.voies
    .flatMap(voie =>
      (voie.numeros ?? [])
        .filter(num => num.lat && num.lon)
        .map(num => ({
          id: num.id,
          label: `${num.numero}${num.suffixe ?? ''} ${voie.nom}`,
          lat: num.lat,
          lon: num.lon,
        }))
    )
})

useSeoMeta({
  title: () => commune.value
    ? `Quiz ${commune.value.nom} - GeoQuiz`
    : 'Chargement...',
  description: () => commune.value
    ? `Testez vos connaissances sur ${commune.value.nom} (${commune.value.codePostal})`
    : '',
})
</script>

<template>
  <UContainer class="py-8">
    <div v-if="pending" class="space-y-6">
      <div class="flex items-center gap-4">
        <USkeleton class="h-8 w-8 rounded" />
        <USkeleton class="h-8 w-48" />
      </div>
      <GlassCard>
        <USkeleton class="h-32 w-full" />
      </GlassCard>
      <GlassCard>
        <USkeleton class="h-[400px] w-full" />
      </GlassCard>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <GlassCard padding="lg">
        <UIcon name="i-heroicons-exclamation-triangle" class="text-5xl text-red-400 mb-4" />
        <h2 class="text-xl font-bold text-slate-100 mb-2">Erreur de chargement</h2>
        <p class="text-slate-400 mb-6">{{ String(error) }}</p>
        <UButton to="/" class="bg-indigo-600 hover:bg-indigo-500">
          Retour à l'accueil
        </UButton>
      </GlassCard>
    </div>

    <div v-else-if="!commune" class="text-center py-12">
      <GlassCard padding="lg">
        <UIcon name="i-heroicons-map" class="text-5xl text-yellow-400 mb-4" />
        <h2 class="text-xl font-bold text-slate-100 mb-2">Commune introuvable</h2>
        <p class="text-slate-400 mb-6">
          La commune avec le code « {{ codeInsee }} » n'existe pas.
        </p>
        <UButton to="/" class="bg-indigo-600 hover:bg-indigo-500">
          Retour à l'accueil
        </UButton>
      </GlassCard>
    </div>

    <div v-else>
      <div class="mb-8 text-center">
        <div class="inline-flex items-center gap-3 mb-2">
          <span class="text-xs font-mono bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">
            {{ commune.departement.code }}
          </span>
          <span class="text-slate-500">{{ commune.departement.nom }}</span>
        </div>
        <h1 class="text-3xl md:text-4xl font-bold text-slate-100">
          {{ commune.nom }}
        </h1>
        <p class="text-slate-500 mt-1">
          {{ commune.codePostal }} · {{ commune.voieCount }} voies · {{ quizAddresses.length }} adresses
        </p>
      </div>

      <QuizGame
        :addresses="quizAddresses"
        :commune-name="commune.nom"
      />
    </div>
  </UContainer>
</template>
