export default defineNuxtConfig({
  // Nuxt 4 utilise la nouvelle structure app/
  future: {
    compatibilityVersion: 4
  },

  compatibilityDate: '2024-11-01',

  // Modules = plugins Nuxt qui s'intègrent profondément
  // Très différent de next.config.js qui configure juste webpack
  modules: [
    '@nuxt/ui',  // Ajoute les composants UI + Tailwind
    'nuxt-graphql-client',
  ],

  'graphql-client': {
    clients: {
      default: {
        host: process.env.NUXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
      },
    },
  },

  // Mode de rendu
  // ssr: true = SSR (comme Next.js par défaut)
  // ssr: false = SPA only
  ssr: true,

  // DevTools intégrés (pas d'extension navigateur requise)
  devtools: { enabled: true },

  // TypeScript strict par défaut
  typescript: {
    strict: true
  }
})
