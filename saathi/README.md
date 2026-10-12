# Saathi

Multi-tenant seller platform for small Indian shops. Instagram posts become catalogue drafts; nothing goes live without her approval. Buyers start in Instagram DMs and comments. Google Sheet is the source of truth when connected. Hindi and English.

Project: `saathi-510820`. Seeded demo shop: **Sunita Handicrafts**.

## Run locally

```bash
cd saathi
npm install
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
- **Posts** — feed + suggestions (never edits Instagram)
- **Items / Orders** — catalogue with **edit** (stock, price, floor, attributes); orders under Items; PDF
- **Analytics** — week stats, **Asked for, not available**, drop-offs, bestsellers, Shop Analyst
- **Settings** — Connect Instagram, agent toggles, LLM status, Google Sheet stub

## Instagram / Meta

**Path: Instagram Login** — media, comments, DMs without a Facebook Page.

| Env | Purpose |
| --- | --- |
| `META_APP_ID` | Instagram App ID |
| `META_APP_SECRET` | Instagram App Secret |
| `META_WEBHOOK_VERIFY_TOKEN` | Webhook verify token |
| `APP_BASE_URL` / `META_REDIRECT_URI` | Public URL / OAuth callback |
| `TOKEN_ENCRYPTION_KEY` | Optional; else from `AUTH_SECRET` |

Without `META_*`, Connect stays disabled and shops use **simulation**. Webhook: `/api/webhooks/meta`. Callback: `/api/auth/instagram/callback`. Sellers need an **Instagram Professional** account. No content publishing.

App Review / Business Verification: operator steps (not in-repo).

## LLM

| Host | Auth |
| --- | --- |
| **Cloud Run** | **Vertex AI Gemini via ADC** (service account — no API key) |
| **Vercel / local** | Optional `GEMINI_API_KEY`, or interim `LLM_API_KEY` (UI shows **LLM**) |

Precedence (`src/lib/llm.ts`): Vertex ADC → Gemini API key → `LLM_API_KEY` → mocks. Other Google clients in `src/lib/google/*` (Translation, TTS helper) use the same ADC.

## Deploy (dual: Vercel + Cloud Run)

| Host | URL |
| --- | --- |
| **Vercel** | https://saathi-ruby.vercel.app |
| **Cloud Run** | https://saathi-160174088264.us-central1.run.app |

Both use the same Cloud SQL Postgres (`saathi-pg` in `saathi-510820`). Keep Vercel live; Cloud Run is the GCP path.

**Vercel:** Root Directory `saathi`; build runs `prisma migrate deploy && next build`.

**Cloud Run:** `Dockerfile` + `docker-entrypoint.sh` (migrate then `next start` on `PORT`). Image: `us-central1-docker.pkg.dev/saathi-510820/saathi/saathi`. Secrets in Secret Manager (`saathi-database-url`, `saathi-auth-secret`, `saathi-llm-api-key`). Set `APP_BASE_URL` to the Cloud Run URL on that service.

**Meta callbacks:** add *both* redirect URIs in the Meta app:

- `https://saathi-ruby.vercel.app/api/auth/instagram/callback`
- `https://saathi-160174088264.us-central1.run.app/api/auth/instagram/callback`

Env (either host): `DATABASE_URL`, `AUTH_SECRET`, optional `GEMINI_API_KEY` / `LLM_API_KEY`, optional `META_*`.
