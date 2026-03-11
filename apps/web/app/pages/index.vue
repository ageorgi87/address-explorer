<script setup lang="ts">
import { DEPARTEMENTS_QUERY, type DepartementsData } from '../queries/departements'
import { SEARCH_COMMUNES_QUERY, type CommuneSearchResult } from '../queries/searchCommunes'

const { data, pending, error } = await useAsyncQuery<DepartementsData>(DEPARTEMENTS_QUERY)

const departements = computed(() => data.value?.departements ?? [])

const totalCommunes = computed(() =>
  departements.value.reduce((sum, dept) => sum + dept.communeCount, 0),
)

const search = ref('')
const searchResults = ref<CommuneSearchResult[]>([])
const searchPending = ref(false)

const { clients } = useApollo()

watchDebounced(
  search,
  async (value: string) => {
    if (value.length < 2) {
      searchResults.value = []
      return
    }

    searchPending.value = true

    const { data } = await clients!.default.query({
      query: SEARCH_COMMUNES_QUERY,
      variables: { search: value, first: 10 },
    })

    searchResults.value = data?.searchCommunes ?? []
    searchPending.value = false
  },
  { debounce: 300 }
)

function handleSelect(commune: { id: string }) {
  navigateTo(`/communes/${commune.id}`)
}

useSeoMeta({
  title: "Explorateur d'adresses",
  description: 'Explore les adresses françaises',
})
</script>

<template>
  <UContainer class="py-8">
    <h1 class="text-3xl font-bold mb-8">Explorateur d'adresses</h1>

    <div v-if="pending">
      <USkeleton class="h-32 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      title="Erreur"
      :description="String(error)"
    />

    <div v-else>
      <div class="grid grid-cols-2 gap-4 max-w-md mb-8">
        <UCard>
          <div class="text-3xl font-bold text-primary-500">
            {{ departements.length }}
          </div>
          <div class="text-gray-500">Départements</div>
        </UCard>
        <UCard>
          <div class="text-3xl font-bold text-green-500">
            {{ totalCommunes.toLocaleString() }}
          </div>
          <div class="text-gray-500">Communes</div>
        </UCard>
      </div>

      <div class="max-w-xl mb-8">
        <UInput
          v-model="search"
          placeholder="Rechercher une commune..."
          icon="i-heroicons-magnifying-glass"
          size="lg"
        />

        <p
          v-if="search.length > 0 && search.length < 2"
          class="mt-2 text-sm text-gray-500"
        >
          Tape au moins 2 caractères...
        </p>

        <SearchResults
          v-if="search.length >= 2"
          :communes="searchResults"
          :loading="searchPending"
          @select="handleSelect"
        />
      </div>

      <div class="space-y-2">
        <UCard
          v-for="dept in departements"
          :key="dept.code"
          class="cursor-pointer hover:bg-gray-50"
        >
          <div class="flex items-center gap-3">
            <UBadge color="primary">{{ dept.code }}</UBadge>
            <span class="font-medium">{{ dept.nom }}</span>
            <span class="text-gray-500 text-sm ml-auto">
              {{ dept.communeCount }} communes
            </span>
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
