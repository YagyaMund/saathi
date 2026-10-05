export type RuntimeConfig = {
  projectId: string;
  region: string;
  vertexModel: string;
  discoveryLocation: string;
  discoveryDataStoreId: string;
  discoveryEngineId: string;
  bucket: string;
  databaseUrl: string;
  dataset: string;
};

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function runtimeConfig(): RuntimeConfig {
  return {
    projectId: clean(process.env.GCP_PROJECT_ID),
    region: clean(process.env.GCP_REGION) || "us-central1",
    vertexModel: clean(process.env.VERTEX_MODEL) || "gemini-2.5-flash",
    discoveryLocation: clean(process.env.DISCOVERY_ENGINE_LOCATION) || "global",
    discoveryDataStoreId: clean(process.env.DISCOVERY_DATA_STORE_ID),
    discoveryEngineId: clean(process.env.DISCOVERY_ENGINE_ID),
    bucket: clean(process.env.GCS_BUCKET),
    databaseUrl: clean(process.env.DATABASE_URL),
    dataset: clean(process.env.BIGQUERY_DATASET),
  };
}

export function geminiEnabled(config = runtimeConfig()): boolean {
  return Boolean(config.projectId);
}

export function searchEnabled(config = runtimeConfig()): boolean {
  return Boolean(
    config.projectId && (config.discoveryEngineId || config.discoveryDataStoreId),
  );
}

export function runtimeModes(config = runtimeConfig()) {
  return {
    catalog: config.databaseUrl ? "Cloud SQL or AlloyDB" : "Local catalog",
    search: searchEnabled(config) ? "Vertex AI Search" : "Local search",
    gemini: geminiEnabled(config) ? config.vertexModel : "Local Gemini notes",
    assets: config.bucket ? config.bucket : "Local asset files",
    insights: "Local warehouse fixture",
  };
}
