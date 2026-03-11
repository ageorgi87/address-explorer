<script setup lang="ts">
import type { CommuneSearchResult } from '../queries/searchCommunes'

defineProps<{
  communes: CommuneSearchResult[]
  loading: boolean
}>()

defineEmits<{
  select: [commune: CommuneSearchResult]
}>()
</script>

<template>
  <div class="mt-4 space-y-2">
    <template v-if="loading">
      <USkeleton v-for="i in 5" :key="i" class="h-16 w-full" />
    </template>

    <template v-else-if="communes.length > 0">
      <UCard
        v-for="commune in communes"
        :key="commune.id"
        class="cursor-pointer hover:bg-gray-50 transition-colors"
        @click="$emit('select', commune)"
      >
        <div class="font-medium">{{ commune.nom }}</div>
        <div class="text-sm text-gray-500">
          {{ commune.codePostal }} - {{ commune.departement.nom }} ({{ commune.departement.code }})
        </div>
      </UCard>
    </template>

    <div
      v-else
      class="p-4 text-center text-gray-500 bg-gray-50 rounded-lg"
    >
      Aucune commune trouvée
    </div>
  </div>
</template>
