export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',

  srcDir: 'app',

  modules: [
    '@nuxt/ui',
    '@nuxtjs/apollo',
    '@vueuse/nuxt',
  ],

  // Force dark mode
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },


  apollo: {
    clients: {
      default: {
        httpEndpoint: process.env.NUXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
      },
    },
  },

  ssr: true,
  devtools: { enabled: true },

  typescript: {
    strict: true,
  },
})
