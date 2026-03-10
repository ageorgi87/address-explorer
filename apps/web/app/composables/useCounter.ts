/**
 * Composable pour gérer un compteur.
 * Équivalent du hook useCounter en React.
 *
 * @param initial - Valeur initiale du compteur
 * @returns État réactif et fonctions pour manipuler le compteur
 *
 * @example
 * const { count, increment, reset } = useCounter(10)
 */
export function useCounter(initial = 0) {
  // ============================================
  // ÉTAT RÉACTIF
  // ============================================

  // ref() crée un état réactif
  // Équivalent : const [count, setCount] = useState(initial)
  const count = ref(initial)

  // Stocker la valeur initiale pour le reset
  const initialValue = initial

  // ============================================
  // VALEURS CALCULÉES
  // ============================================

  // computed() = useMemo() mais sans tableau de dépendances
  // Vue détecte automatiquement que doubled dépend de count
  const doubled = computed(() => count.value * 2)

  // On peut avoir plusieurs computed
  const isPositive = computed(() => count.value > 0)
  const isNegative = computed(() => count.value < 0)
  const isZero = computed(() => count.value === 0)

  // ============================================
  // FONCTIONS
  // ============================================

  // Pas besoin de useCallback !
  // Ces fonctions sont créées une seule fois
  // et gardent une référence stable
  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  function reset() {
    count.value = initialValue
  }

  function set(value: number) {
    count.value = value
  }

  // ============================================
  // RETOUR
  // ============================================

  // Retourne un objet avec tout ce qui est utile
  // Le composant peut destructurer ce dont il a besoin
  return {
    // État
    count,          // Ref<number>

    // Computed
    doubled,        // ComputedRef<number>
    isPositive,     // ComputedRef<boolean>
    isNegative,     // ComputedRef<boolean>
    isZero,         // ComputedRef<boolean>

    // Actions
    increment,      // () => void
    decrement,      // () => void
    reset,          // () => void
    set,            // (value: number) => void
  }
}

// ============================================
// TYPE INFERENCE
// ============================================

// TypeScript infère automatiquement le type de retour
// Tu peux l'exporter si besoin
export type UseCounterReturn = ReturnType<typeof useCounter>
