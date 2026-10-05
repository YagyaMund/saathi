import { readFile } from "node:fs/promises";
import path from "node:path";
import { runtimeConfig } from "@/lib/config";
import { gcpFetch, readError } from "@/lib/gcp";

const ASSET_NAME = /^[a-z0-9-]+\.svg$/;

export function isAssetName(name: string): boolean {
  return ASSET_NAME.test(name);
}

export function localAssetPath(name: string): string {
  return path.join(process.cwd(), "assets", "products", name);
}

export async function readAsset(name: string): Promise<{
  bytes: Uint8Array;
  source: "gcs" | "local";
}> {
  if (!isAssetName(name)) {
    throw new Error("Unknown asset.");
  }
  const { bucket, projectId } = runtimeConfig();
  if (!bucket) {
    const bytes = await readFile(localAssetPath(name));
    return { bytes, source: "local" };
  }

  const object = encodeURIComponent(`products/${name}`);
  const response = await gcpFetch(
    `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${object}?alt=media`,
    projectId,
  );
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return { bytes: new Uint8Array(await response.arrayBuffer()), source: "gcs" };
}

export async function uploadAsset(name: string, bytes: Uint8Array): Promise<void> {
  const { bucket, projectId } = runtimeConfig();
  if (!bucket) {
    throw new Error("GCS_BUCKET is not set.");
  }
  if (!isAssetName(name)) {
    throw new Error(`Refusing to upload ${name}.`);
  }
  const object = encodeURIComponent(`products/${name}`);
  const response = await gcpFetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${object}`,
    projectId,
    {
      method: "POST",
      headers: { "Content-Type": "image/svg+xml" },
      body: Buffer.from(bytes),
    },
  );
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}
