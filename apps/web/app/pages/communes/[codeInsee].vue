<script setup lang="ts">
import { COMMUNE_QUERY, type CommuneData } from '../../queries/commune'

const route = useRoute()
const codeInsee = computed(() => route.params.codeInsee as string)

const { data, pending, error } = await useAsyncQuery<CommuneData>(
  COMMUNE_QUERY,
  { codeInsee: codeInsee.value }
)

const commune = computed(() => data.value?.commune)

useSeoMeta({
  title: () => commune.value
    ? `${commune.value.nom} (${commune.value.codePostal}) - Explorateur`
    : 'Chargement...',
  description: () => commune.value
    ? `Découvrez les ${commune.value.voieCount} voies de ${commune.value.nom}`
    : '',
})
</script>

<template>
  <UContainer class="py-8">
    <NuxtLink
      to="/"
      class="text-primary-500 hover:text-primary-600 flex items-center gap-2 mb-6"
    >
      <UIcon name="i-heroicons-arrow-left" />
      Retour à la recherche
    </NuxtLink>

    <div v-if="pending">
      <USkeleton class="h-10 w-1/2 mb-4" />
      <USkeleton class="h-6 w-1/4 mb-8" />
      <USkeleton class="h-64 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      color="red"
      title="Erreur"
      :description="String(error)"
    />

    <div v-else-if="!commune" class="text-center py-12">
      <UIcon name="i-heroicons-exclamation-triangle" class="text-4xl text-yellow-500 mb-4" />
      <h2 class="text-xl font-bold text-gray-700">Commune introuvable</h2>
      <p class="text-gray-500 mt-2">
        La commune avec le code "{{ codeInsee }}" n'existe pas.
      </p>
      <UButton to="/" class="mt-4">Retour à l'accueil</UButton>
    </div>

    <div v-else>
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold">{{ commune.nom }}</h1>
          <p class="text-gray-500 mt-1">
            {{ commune.codePostal }} - {{ commune.departement.nom }}
          </p>
        </div>
        <UBadge color="primary" size="lg">{{ commune.departement.code }}</UBadge>
      </div>

      <div class="grid grid-cols-2 gap-4 max-w-md mb-8">
        <UCard>
          <div class="text-3xl font-bold text-primary-500">
            {{ commune.voieCount }}
          </div>
          <div class="text-gray-500">voies</div>
        </UCard>
        <UCard>
          <div class="text-3xl font-bold text-green-500">
            {{ commune.voies.length }}
          </div>
          <div class="text-gray-500">voies affichées</div>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <h2 class="font-semibold">Voies de la commune</h2>
        </template>

        <ul class="divide-y divide-gray-200">
          <li
            v-for="voie in commune.voies"
            :key="voie.id"
            class="py-3 hover:bg-gray-50 -mx-4 px-4"
          >
            <span class="text-gray-900">{{ voie.nom }}</span>
          </li>
        </ul>
      </UCard>
    </div>
  </UContainer>
</template>
