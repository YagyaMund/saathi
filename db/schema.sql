-- Operational catalog for Cove Supply.
-- Apply this file to Cloud SQL for PostgreSQL or to AlloyDB.
-- Do not provision both engines. Point DATABASE_URL at the one you created.
--
-- Cloud SQL (Cloud SQL Auth Proxy or the /cloudsql socket on Cloud Run):
--   gcloud sql connect cove-pg --user=cove_app --database=cove
-- AlloyDB (Auth Proxy against the primary instance):
--   alloydb-auth-proxy projects/PROJECT/locations/REGION/clusters/cove/instances/cove-primary
--   psql "host=127.0.0.1 user=cove_app dbname=postgres"
--
-- Then: \i db/schema.sql
--       \i db/seed.sql

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  materials TEXT NOT NULL,
  weight_grams INTEGER NOT NULL CHECK (weight_grams >= 0),
  origin TEXT NOT NULL,
  sku TEXT NOT NULL,
  image TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  local_insight TEXT NOT NULL
);
