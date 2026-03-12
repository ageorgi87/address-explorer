<script setup lang="ts">
import { DEPARTEMENTS_QUERY, type DepartementsData } from '~/queries/departements'
import { SEARCH_COMMUNES_QUERY, type CommuneSearchResult } from '~/queries/searchCommunes'

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
  title: 'GeoQuiz - Testez vos connaissances géographiques',
  description: 'Trouvez les adresses sur la carte et testez vos connaissances des communes françaises',
})
</script>

<template>
  <div class="min-h-screen">
    <div class="gradient-bg border-b border-white/5">
      <UContainer class="py-16 text-center">
        <h1 class="text-5xl font-bold tracking-tight mb-4">
          <span class="gradient-text">GeoQuiz</span>
        </h1>
        <p class="text-xl text-slate-400 mb-10">
          Testez vos connaissances géographiques
        </p>

        <div class="max-w-xl mx-auto relative">
          <div class="glass p-2">
            <UInput
              v-model="search"
              placeholder="Rechercher une commune..."
              icon="i-heroicons-magnifying-glass"
              size="xl"
              variant="none"
              class="bg-transparent"
              :ui="{ base: 'bg-transparent' }"
            />
          </div>

          <p
            v-if="search.length > 0 && search.length < 2"
            class="mt-3 text-sm text-slate-500"
          >
            Tape au moins 2 caractères...
          </p>

          <div
            v-if="search.length >= 2"
            class="absolute top-full left-0 right-0 mt-2 glass p-2 z-50"
          >
            <div v-if="searchPending" class="p-4 text-center text-slate-400">
              <UIcon name="i-heroicons-arrow-path" class="animate-spin mr-2" />
              Recherche...
            </div>
            <div v-else-if="searchResults.length === 0" class="p-4 text-center text-slate-500">
              Aucune commune trouvée
            </div>
            <div v-else class="space-y-1">
              <button
                v-for="commune in searchResults"
                :key="commune.id"
                class="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between group"
                @click="handleSelect(commune)"
              >
                <div>
                  <span class="text-slate-100 font-medium">{{ commune.nom }}</span>
                  <span class="text-slate-500 ml-2">{{ commune.codePostal }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500">{{ commune.departement.nom }}</span>
                  <UIcon
                    name="i-heroicons-arrow-right"
                    class="text-slate-600 group-hover:text-indigo-400 transition-colors"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-center gap-6 mt-12">
          <GlassCard padding="md" class="text-center min-w-[140px]">
            <div class="text-3xl font-bold text-indigo-400">
              {{ departements.length }}
            </div>
            <div class="text-slate-500 text-sm mt-1">départements</div>
          </GlassCard>
          <GlassCard padding="md" class="text-center min-w-[140px]">
            <div class="text-3xl font-bold text-emerald-400">
              {{ totalCommunes.toLocaleString() }}
            </div>
            <div class="text-slate-500 text-sm mt-1">communes</div>
          </GlassCard>
        </div>
      </UContainer>
    </div>

    <div class="px-4 sm:px-6 lg:px-8">
      <UContainer class="py-12">
        <h2 class="text-2xl font-bold text-slate-100 mb-6">
          Choisissez un département
        </h2>

        <div v-if="pending" class="space-y-3">
          <div v-for="i in 5" :key="i" class="glass p-4">
            <USkeleton class="h-6 w-1/3" />
          </div>
        </div>

        <UAlert
          v-else-if="error"
          color="red"
          icon="i-heroicons-exclamation-triangle"
          title="Erreur de chargement"
          :description="String(error)"
        />

        <DepartementAccordion
          v-else
          :departements="departements"
        />
      </UContainer>
    </div>
  </div>
</template>
