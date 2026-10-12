# Saathi

Multi-tenant seller platform for small Indian shops. Instagram posts become catalogue drafts; nothing goes live without her approval. Buyers are simulated Instagram DMs for v1. Google Sheet is the source of truth when connected. Hindi and English.

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

Or **Continue with Google (stub)** on the login page — opens the Sunita demo with a stub Sheet connection.

## What you can do

- **Home** — needs-you tasks, today stats, posts, week insight, latest orders
- **Approvals** — Gap Filler UI; approve drafts through the **code** approval gate into the catalogue / local Sheet fixture
- **Messages / Thread** — simulated Instagram DMs; answer one line and Saathi carries on
- **Posts** — simulated Instagram feed + Post Reviewer suggestions (never edits Instagram)
- **Items** — approved catalogue; **manual** PDF generate → download (never auto on stock change)
- **Analytics** — unmet asks, drop-offs, bestsellers; run **Shop Analyst** evening report (OpenAI or mock)
- **Settings** — agent toggles, Instagram sim, **stub Google Sheet** connect, switch to Sunita demo

## LLM keys (platform-level, not per-seller)

**Current provider: OpenAI.** Gemini/Vertex on `saathi-510820` is wired as a fallback for later.

```bash
# saathi/.env (local)
OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini

# Later / fallback when OPENAI_API_KEY is unset:
# GEMINI_API_KEY=...
# GOOGLE_CLOUD_PROJECT=saathi-510820
```

**Production (Vercel):** Project [saathi](https://vercel.com/yagyas-projects-9fce8811/saathi) → **Settings → Environment Variables** → add `OPENAI_API_KEY` for **Production** and **Preview** → redeploy. Do not paste keys into chat.

Precedence in code (`src/lib/gemini.ts`): `OPENAI_API_KEY` → else `GEMINI_API_KEY` → else deterministic mocks.

## Agents (versioned prompts)

Eleven prompts live in `prompts/`, extracted from the product prompt library:

1. Post Reader  
2. Gap Filler  
3. Post Reviewer  
4. Catalogue Designer  
5. Comment Responder  
6. Salesperson  
7. Negotiator  
8. Order Taker  
9. Payment Verifier  
10. Shift Manager  
11. Shop Analyst  

**Code, not LLM:** approval gate, variant stock decrement, floor-price check, Sheet field writes (`src/lib/approval.ts`, `src/lib/sheet.ts`).

## Stubs → real integrations

| Piece | Now | Later |
| --- | --- | --- |
| Instagram | Simulated posts / comments / DMs in SQLite | Meta Instagram Graph API — same conversation/post shape |
| Google Sign-In / Sheet | Stub connect + local `SheetRow` fixture | OAuth client + Sheets API; UI already shows the flow |
| PDF | `pdf-lib` in-memory → Postgres bytes (Vercel-safe; no `/var/task` writes) | Optional GCS signed URLs later |
| TTS evening report | Text stub note | Cloud Text-to-Speech |

Set `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` in `.env` when ready; the Settings Google button is the plug-in point (`/api/settings/google`).

## Database

Postgres via Prisma (`DATABASE_URL`). Use Neon, Vercel Postgres, or any Postgres 14+. Holds shops, users, drafts, approvals, agent flags, Instagram sim state, conversations, unmet asks, analytics, PDF jobs. Approved catalogue rows also mirror into `SheetRow` (Products tab fixture).

## Deploy (Vercel)

- GitHub: https://github.com/YagyaMund/saathi  
- Vercel project **Root Directory**: `saathi`  
- Env: `DATABASE_URL` (Postgres), `AUTH_SECRET`, **`OPENAI_API_KEY`** (current LLM), optional later `GEMINI_API_KEY` / `GOOGLE_CLOUD_PROJECT=saathi-510820`  
- Build runs `prisma migrate deploy`. Seed once after first deploy: `npm run db:seed` with production `DATABASE_URL`.

## Deploy agents to Agent Runtime

The previous Chat-demo ADK package is in `../saathi-chat-legacy/`. Agents run from this Next.js app against OpenAI now; switch to Gemini/Vertex later by clearing `OPENAI_API_KEY` and setting `GEMINI_API_KEY`.
