<script setup lang="ts">
const { data, pending, error } = await useAsyncGql("Departements");

const departements = computed(() => data.value?.departements ?? []);

const totalCommunes = computed(() =>
  departements.value.reduce(
    (sum: number, dept: { communeCount?: number }) => sum + (dept.communeCount ?? 0),
    0,
  ),
);

useSeoMeta({
  title: "Explorateur d'adresses",
  description: "Explore les adresses françaises",
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <h1 class="text-3xl font-bold text-gray-900">Explorateur d'adresses</h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <div v-if="pending" class="animate-pulse h-32 bg-gray-200 rounded" />

      <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 rounded-lg p-6"
      >
        <p class="text-red-700">{{ error }}</p>
      </div>

      <div v-else>
        <div class="mb-8 grid grid-cols-2 gap-4 max-w-md">
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-3xl font-bold text-blue-600">
              {{ departements.length }}
            </div>
            <div class="text-gray-600">Départements</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-3xl font-bold text-green-600">
              {{ totalCommunes.toLocaleString() }}
            </div>
            <div class="text-gray-600">Communes</div>
          </div>
        </div>

        <div class="space-y-2">
          <div
            v-for="dept in departements"
            :key="dept.code"
            class="bg-white rounded-lg shadow p-4"
          >
            <span class="font-bold">{{ dept.code }}</span>
            <span class="ml-2">{{ dept.nom }}</span>
            <span class="text-gray-500 ml-2"
              >({{ dept.communeCount }} communes)</span
            >
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
