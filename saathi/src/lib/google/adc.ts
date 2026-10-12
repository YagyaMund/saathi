import { GoogleAuth, type AuthClient } from "google-auth-library";

const CLOUD_PLATFORM = "https://www.googleapis.com/auth/cloud-platform";

let auth: GoogleAuth | null = null;
let clientPromise: Promise<AuthClient> | null = null;

function getAuth() {
  if (!auth) {
    auth = new GoogleAuth({ scopes: [CLOUD_PLATFORM] });
  }
  return auth;
}

/**
 * True when this process should use Vertex / Google APIs via ADC.
 * Cloud Run (metadata SA) or local `gcloud auth application-default login`.
 */
export function preferGoogleAdc(): boolean {
  if (process.env.GOOGLE_ADC === "0") return false;
  if (process.env.GOOGLE_ADC === "1") return true;
  if (
    process.env.K_SERVICE ||
    process.env.K_REVISION ||
    process.env.GCE_METADATA_HOST ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  ) {
    return true;
  }
  // Local/dev with project set — use ADC (run: gcloud auth application-default login)
  return Boolean(process.env.GOOGLE_CLOUD_PROJECT?.trim());
}

export function gcpProjectId(): string {
  return (
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    process.env.GCLOUD_PROJECT?.trim() ||
    process.env.GCP_PROJECT?.trim() ||
    "saathi-510820"
  );
}

export function gcpRegion(): string {
  return (
    process.env.GCP_REGION?.trim() ||
    process.env.GOOGLE_CLOUD_LOCATION?.trim() ||
    process.env.VERTEX_LOCATION?.trim() ||
    "us-central1"
  );
}

async function getClient(): Promise<AuthClient> {
  if (!clientPromise) {
    clientPromise = getAuth().getClient();
  }
  return clientPromise;
}

/** Bearer access token from ADC (metadata server on Cloud Run). */
export async function getAccessToken(): Promise<string> {
  const client = await getClient();
  const tok = await client.getAccessToken();
  const token = typeof tok === "string" ? tok : tok?.token;
  if (!token) {
    throw new Error(
      "ADC: no access token. On Cloud Run check the service account; locally run: gcloud auth application-default login",
    );
  }
  return token;
}

export async function adcReady(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch {
    return false;
  }
}
