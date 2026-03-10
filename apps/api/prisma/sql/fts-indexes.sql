-- ============================================================
-- INDEX FULL-TEXT POUR LA RECHERCHE
-- ============================================================
-- Ces index accélèrent les recherches textuelles de manière spectaculaire
-- Sans index : scan séquentiel de 2.5M de lignes (~5 secondes)
-- Avec index : lookup direct (~5 millisecondes)
-- ============================================================

-- ============================================================
-- 1. INDEX GIN FULL-TEXT (tsvector)
-- ============================================================
-- Utilise le stemming français : "rivoli" trouve "RIVOLI", "rivolis"
-- GIN (Generalized Inverted Index) = index inversé comme un moteur de recherche
-- ============================================================

-- Index full-text sur les noms de voies
-- 'french' = configuration de stemming pour le français
CREATE INDEX IF NOT EXISTS voies_nom_fts
ON voies USING GIN (to_tsvector('french', nom));

-- Index full-text sur les noms de communes
CREATE INDEX IF NOT EXISTS communes_nom_fts
ON communes USING GIN (to_tsvector('french', nom));

-- ============================================================
-- 2. INDEX TRIGRAMME (pg_trgm)
-- ============================================================
-- Permet les recherches partielles : "riv" trouve "Rivoli"
-- Utilise la similarité de trigrammes (séquences de 3 caractères)
-- "riv" → {"riv"}, "Rivoli" → {"riv", "ivo", "vol", "oli"}
-- Match car "riv" est dans les deux sets
-- ============================================================

-- Activer l'extension pg_trgm (incluse dans PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index trigramme sur les noms de voies
-- gin_trgm_ops = opérateur pour la recherche par similarité
CREATE INDEX IF NOT EXISTS voies_nom_trgm
ON voies USING GIN (nom gin_trgm_ops);

-- Index trigramme sur les noms de communes
CREATE INDEX IF NOT EXISTS communes_nom_trgm
ON communes USING GIN (nom gin_trgm_ops);

-- ============================================================
-- POURQUOI DEUX TYPES D'INDEX ?
-- ============================================================
-- | Type       | Trouve "rivoli" | Trouve "riv" | Typos |
-- |------------|-----------------|--------------|-------|
-- | Full-text  | ✅               | ❌            | ❌     |
-- | Trigramme  | ✅               | ✅            | ✅     |
--
-- Le full-text est plus rapide pour les mots complets.
-- Le trigramme est plus flexible (préfixes, fautes de frappe).
-- On garde les deux pour offrir le meilleur des deux mondes.
-- ============================================================
