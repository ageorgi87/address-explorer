<script setup lang="ts">
import type { Departement } from '../queries/departements'
import { DEPARTEMENT_COMMUNES_QUERY, type DepartementCommunesData, type CommuneBasic } from '../queries/departementCommunes'

const props = defineProps<{
  departements: Departement[]
}>()

const { clients } = useApollo()

// State
const openDepts = ref<Set<string>>(new Set())
const communesCache = ref<Record<string, CommuneBasic[]>>({})
const loadingDepts = ref<Set<string>>(new Set())

async function toggleDepartement(code: string) {
  if (openDepts.value.has(code)) {
    openDepts.value.delete(code)
    // Force reactivity
    openDepts.value = new Set(openDepts.value)
  } else {
    openDepts.value.add(code)
    openDepts.value = new Set(openDepts.value)
    // Load communes if not cached
    await loadCommunes(code)
  }
}

async function loadCommunes(code: string) {
  if (communesCache.value[code] || loadingDepts.value.has(code)) return

  loadingDepts.value.add(code)
  loadingDepts.value = new Set(loadingDepts.value)

  try {
    const { data } = await clients!.default.query<DepartementCommunesData>({
      query: DEPARTEMENT_COMMUNES_QUERY,
      variables: { code },
    })

    if (data?.departement?.communes) {
      communesCache.value = {
        ...communesCache.value,
        [code]: data.departement.communes
      }
    }
  } finally {
    loadingDepts.value.delete(code)
    loadingDepts.value = new Set(loadingDepts.value)
  }
}

function isOpen(code: string) {
  return openDepts.value.has(code)
}

function isLoading(code: string) {
  return loadingDepts.value.has(code)
}

function getCommunes(code: string) {
  return communesCache.value[code] ?? []
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="dept in departements"
      :key="dept.code"
      class="glass overflow-hidden"
    >
      <!-- Header / Trigger -->
      <button
        class="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        @click="toggleDepartement(dept.code)"
      >
        <div class="flex items-center gap-3">
          <span class="text-xs font-mono bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">
            {{ dept.code }}
          </span>
          <span class="font-medium text-slate-100">{{ dept.nom }}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-slate-500">
            {{ dept.communeCount }} communes
          </span>
          <UIcon
            name="i-heroicons-chevron-down"
            class="text-slate-400 transition-transform duration-200"
            :class="{ 'rotate-180': isOpen(dept.code) }"
          />
        </div>
      </button>

      <!-- Content -->
      <div
        v-if="isOpen(dept.code)"
        class="px-5 pb-4 border-t border-white/5"
      >
        <!-- Loading state -->
        <div v-if="isLoading(dept.code)" class="py-6 text-center text-slate-400">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin mr-2" />
          Chargement des communes...
        </div>

        <!-- Communes grid -->
        <div
          v-else-if="getCommunes(dept.code).length > 0"
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-4"
        >
          <button
            v-for="commune in getCommunes(dept.code)"
            :key="commune.id"
            class="text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors group"
            @click="navigateTo(`/communes/${commune.id}`)"
          >
            <span class="text-slate-300 group-hover:text-indigo-400 transition-colors">
              {{ commune.nom }}
            </span>
            <span class="text-slate-600 text-xs ml-1">
              {{ commune.codePostal }}
            </span>
          </button>
        </div>

        <!-- Empty state -->
        <div v-else class="py-6 text-center text-slate-500">
          Aucune commune trouvée
        </div>
      </div>
    </div>
  </div>
</template>
