import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleAuth } from "google-auth-library";

const bucket = process.env.GCS_BUCKET?.trim();
const projectId = process.env.GCP_PROJECT_ID?.trim();
if (!bucket || !projectId) {
  console.error("Set GCP_PROJECT_ID and GCS_BUCKET. Terraform also uploads these objects on apply.");
  process.exit(1);
}

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/products");
const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
const client = await auth.getClient();
const token = await client.getAccessToken();
if (!token.token) {
  throw new Error("Application Default Credentials did not return an access token.");
}

for (const name of readdirSync(dir).filter((file) => file.endsWith(".svg"))) {
  const bytes = readFileSync(path.join(dir, name));
  const object = encodeURIComponent(`products/${name}`);
  const response = await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${object}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "image/svg+xml",
        "X-Goog-User-Project": projectId,
      },
      body: bytes,
    },
  );
  if (!response.ok) {
    throw new Error(`${name}: ${response.status} ${await response.text()}`);
  }
  console.log(`uploaded products/${name}`);
}
