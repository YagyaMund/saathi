# Saathi

Multi-tenant seller platform for small Indian shops. Instagram posts become catalogue drafts; nothing goes live without her approval. Buyers start in Instagram DMs and comments. Hindi and English.

**Host:** Google Cloud Run · project `saathi-510820` · [https://saathi-160174088264.us-central1.run.app](https://saathi-160174088264.us-central1.run.app)

Seeded demo: **Sunita Handicrafts**.

## Run locally

```bash
cd saathi
npm install
# ADC for Vertex (required for live agents):
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT=saathi-510820
export GCP_REGION=us-central1
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://127.0.0.1:4747](http://127.0.0.1:4747).

| Login | Password |
| --- | --- |
| `sunita@saathi.demo` | `sunita123` |
| `demo@saathi.app` | `demo1234` |

## What you can do

- **Home** — needs-you tasks, today stats, posts strip
- **Approvals** — pending drafts; approve through the **code** approval gate
- **Messages** — Instagram DMs (simulated until Meta is connected)
- **Posts** — feed + Post Reader (Vertex Gemini **vision** reads photos)
- **Items / Orders** — catalogue edit; orders under Items; PDF
- **Analytics** — Asked for / not available, drop-offs, bestsellers, Shop Analyst
- **Settings** — Connect Instagram, agent toggles, Gemini · Vertex status

## LLM — Vertex + ADC only

Production and local live path: **Vertex AI Gemini** with Application Default Credentials. No API keys.

- Text agents: `src/lib/llm.ts` → `src/lib/google/vertex.ts`
- **Vision (image understanding):** Post Reader and payment screenshots use multimodal Gemini (`inlineData` / image URLs). **Not Imagen** (Imagen generates images; we only read them).
- Local: `gcloud auth application-default login` + `GOOGLE_CLOUD_PROJECT=saathi-510820`
- Cloud Run: service account + `roles/aiplatform.user` (metadata ADC)

## Instagram / Meta

Instagram Login — media, comments, DMs. Env: `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, `APP_BASE_URL`.

OAuth callback: `{APP_BASE_URL}/api/auth/instagram/callback`  
Webhook: `{APP_BASE_URL}/api/webhooks/meta`

## Deploy (Cloud Run)

```bash
cd saathi
docker build -t us-central1-docker.pkg.dev/saathi-510820/saathi/saathi:latest .
docker push us-central1-docker.pkg.dev/saathi-510820/saathi/saathi:latest
gcloud run deploy saathi --project=saathi-510820 --region=us-central1 \
  --image=us-central1-docker.pkg.dev/saathi-510820/saathi/saathi:latest
```

`Dockerfile` runs `prisma migrate deploy` then `next start` on `PORT`. Secrets: `DATABASE_URL`, `AUTH_SECRET` in Secret Manager. Env: `GOOGLE_CLOUD_PROJECT`, `GCP_REGION`, `APP_BASE_URL`, `SAATHI_MODEL=gemini-2.5-flash`.

Database: Cloud SQL `saathi-pg`. Details: see internal deploy notes / `docs/google-services-used.md`.
