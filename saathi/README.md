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

**Production target: Gemini** (`GEMINI_API_KEY`). Interim demos: `LLM_API_KEY` (OpenAI-compatible HTTP under the hood; UI shows **LLM**, never a vendor name). `OPENAI_API_KEY` is a deprecated alias for one release.

Precedence (`src/lib/llm.ts`): Gemini → LLM key → mocks. Status is honest (Gemini / LLM / Mock).

## Deploy (Vercel)

- GitHub: https://github.com/YagyaMund/saathi · Root Directory: `saathi`
- Env: `DATABASE_URL`, `AUTH_SECRET`, optional `GEMINI_API_KEY` / `LLM_API_KEY`, optional `META_*`
- Build: `prisma migrate deploy`. Reseed when needed: `npm run db:seed` with production `DATABASE_URL`.
