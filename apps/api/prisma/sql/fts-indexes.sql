/**
 * Index de recherche textuelle pour PostgreSQL
 */

-- Index full-text (stemming français)
CREATE INDEX IF NOT EXISTS voies_nom_fts
ON voies USING GIN (to_tsvector('french', nom));

CREATE INDEX IF NOT EXISTS communes_nom_fts
ON communes USING GIN (to_tsvector('french', nom));

-- Index trigramme (recherche partielle)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS voies_nom_trgm
ON voies USING GIN (nom gin_trgm_ops);

CREATE INDEX IF NOT EXISTS communes_nom_trgm
ON communes USING GIN (nom gin_trgm_ops);
