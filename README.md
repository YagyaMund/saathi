# Cove Supply

A product-discovery commerce demo for the Google AI Builder Cup. The shop is a twelve-piece coast-and-trail catalog. Locally it runs on fixtures. With a Google Cloud project, the same app calls Gemini on Vertex AI, Vertex AI Search, Cloud Storage, and either Cloud SQL for PostgreSQL or AlloyDB.

**Saathi** is the multi-tenant Instagram seller platform in [`saathi/`](saathi/README.md) (port 4731). Seeded demo: Sunita Handicrafts. Project `saathi-510820`. The earlier Chat ADK slice is archived under `saathi-chat-legacy/`.

Analytics live in BigQuery. LookML for revenue, repeat customers, and top products is in `looker/`. This repo does not provision a Looker (Looker Core) instance.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847). No API keys, no project id, and no database are required.

| Path | What it shows |
| --- | --- |
| `/` | Catalog. Filter by category. Empty category and database-error states are on this page. |
| `/search` | Product search. Vertex AI Search when configured, otherwise the local catalog. |
| `/products/harbor-weekender` | Product detail and a Gemini floor note. |
| `/assistant` | Shopping associate grounded in the catalog. |
| `/insights` | Revenue, repeat customers, top products, and average order value. |

The footer lists which adapters are live. Unset Google Cloud variables always mean the local fixture.

Copy `.env.example` to `.env.local` only when you want a real service. `.env.local` is gitignored.

| Variable | When set |
| --- | --- |
| `GCP_PROJECT_ID` | Turns on Gemini. Also required for Search and Cloud Storage. Use Application Default Credentials (`gcloud auth application-default login`). |
| `GCP_REGION` | Defaults to `us-central1`. |
| `VERTEX_MODEL` | Defaults to `gemini-2.5-flash`. |
| `DISCOVERY_ENGINE_ID` or `DISCOVERY_DATA_STORE_ID` | Turns on Vertex AI Search. Location defaults to `global`. |
| `GCS_BUCKET` | Product images are read from `products/<file>.svg` in this bucket. |
| `DATABASE_URL` | Catalog is read from PostgreSQL (`db/schema.sql`). Cloud SQL and AlloyDB use the same schema. |
| `BIGQUERY_DATASET` | Informational. The insights page stays on the local fixture; run the SQL in `analytics/` for live numbers. |

If a call to Gemini, Search, or Storage fails, the page shows an error and a retry. It does not silently fall back to mock data while those variables are set.

## Apply the infrastructure

You need a Google Cloud project with billing enabled, and credentials that can create resources (`gcloud auth application-default login` or a service account). Terraform does not invent a project or a billing account.

```bash
cd infra
terraform init
terraform apply -var="project_id=YOUR_PROJECT_ID" -var="enable_cloud_run=false"
```

The first apply creates APIs, the asset bucket (and uploads the SVG placeholders), Artifact Registry, BigQuery dataset and tables, the Vertex AI remote connection, the Discovery Engine data store and search app, Secret Manager, and one operational database. `enable_cloud_run=false` skips Cloud Run until an image exists.

`database_engine` defaults to `cloudsql`. Set it to `alloydb` to provision AlloyDB instead. Only one engine is created.

State contains the generated database password. The same password is stored in Secret Manager as `cove-database-url`. Add a remote backend before you share state. See the comment in `infra/versions.tf`.

### Cloud Run

Build and push from the repo root after the Artifact Registry repository exists:

```bash
gcloud builds submit --config cloudbuild.yaml --substitutions=_REGION=us-central1
```

Then create the service:

```bash
cd infra
terraform apply -var="project_id=YOUR_PROJECT_ID"
```

Cloud Run listens on port 3847, uses the `cove-run` service account, and receives the project, search, bucket, and database settings. The database URL comes from Secret Manager.

`gcloud run deploy` is an alternative to the Terraform service. Do not run both against the same service name or they will overwrite each other.

```bash
gcloud run deploy cove-supply \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/cove/app:latest \
  --region us-central1 \
  --port 3847 \
  --allow-unauthenticated \
  --service-account cove-run@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

Pass the same environment variables Terraform sets (`GCP_PROJECT_ID`, `DISCOVERY_ENGINE_ID`, `GCS_BUCKET`, and so on). For the database, grant the runtime service account access to the `cove-database-url` secret.

Some organizations block `allUsers` on Cloud Run. If the public invoker binding fails, deploy with authenticated access and open it under your own policy.

### Cloud SQL and AlloyDB

Both engines run PostgreSQL and use `db/schema.sql` plus `db/seed.sql`. Pick one with `database_engine`.

**Cloud SQL (default).** Instance `cove-pg`, database `cove`, user `cove_app`. Public IP with encrypted connections only and no authorized networks, so use the Cloud SQL Auth Proxy or the `/cloudsql` socket mounted into Cloud Run. The secret's URL already uses that socket.

```bash
gcloud sql connect cove-pg --user=cove_app --database=cove
# password: terraform output -raw database_password
```

**AlloyDB.** Cluster `cove`, primary instance `cove-primary`, on a dedicated VPC with private services access. Cloud Run uses direct VPC egress. The URL in Secret Manager points at the instance's private IP and the default `postgres` database. Connect with the AlloyDB Auth Proxy from a machine that can reach the VPC, then run `db/schema.sql` and `db/seed.sql`.

Switching engines later means destroying the unused database. Do not set the variable expecting both to stay up.

### Product images

Terraform uploads `assets/products/*.svg` to `gs://PROJECT_ID-cove-assets/products/`. The bucket is not public. The app reads objects through `GET /api/assets/<name>.svg` when `GCS_BUCKET` is set, and from the local `assets/products` directory otherwise.

To upload again after you change an SVG:

```bash
GCP_PROJECT_ID=YOUR_PROJECT_ID GCS_BUCKET=YOUR_PROJECT_ID-cove-assets npm run assets:upload
```

That script uses Application Default Credentials. There is no separate image CDN credential in this repo.

### Vertex AI Search

Sample documents are in `data/discovery/products.jsonl` (one JSON document per line, with `jsonData`). After apply, copy them into the bucket and import into the `cove-products` data store:

```bash
gcloud storage cp data/discovery/products.jsonl gs://YOUR_PROJECT_ID-cove-assets/imports/products.jsonl

curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -H "X-Goog-User-Project: YOUR_PROJECT_ID" \
  "https://discoveryengine.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/global/collections/default_collection/dataStores/cove-products/branches/default_branch/documents:import" \
  -d '{
    "gcsSource": {
      "inputUris": ["gs://YOUR_PROJECT_ID-cove-assets/imports/products.jsonl"],
      "dataSchema": "document"
    }
  }'
```

The import is asynchronous. When it finishes, set `DISCOVERY_ENGINE_ID=cove-search` (or `DISCOVERY_DATA_STORE_ID=cove-products`) and `GCP_PROJECT_ID`. The search page then calls Discovery Engine instead of the local matcher.

### BigQuery and BigQuery AI

Tables `customers`, `orders`, `order_items`, and `products` are in dataset `cove_analytics`, in the same region as the Vertex connection. Load the fixture:

```bash
bq query --use_legacy_sql=false --project_id=YOUR_PROJECT_ID < analytics/seed.sql
```

Useful questions are in `analytics/queries.sql`: monthly revenue, repeat-customer rate, top products, average order value by channel, and gross margin by category. `analytics/schema.sql` is the same shape Terraform creates, if you would rather build the tables in the console.

`analytics/bigquery_ai.sql` is commented on purpose. After apply, the connection id is `cove-vertex` and its service account has `roles/aiplatform.user`. Uncomment the file, replace `PROJECT_ID` and `REGION`, and run it. It creates a remote model on `gemini-2.5-flash` and calls `AI.GENERATE_TEXT` (the current BigQuery AI table function for a remote Gemini model). The prompt subquery must expose a column named `prompt`. Results come back as `result`.

### Looker

Looker Core is not created here. To use the LookML on an instance you already have:

1. In Looker Admin, add a BigQuery connection named `cove_bigquery` to this project.
2. Create a LookML project from this repository and set the project root to the `looker/` directory.
3. In `looker/manifest.lkml`, set `bq_project` to your project id.
4. Validate the project and open the dashboard `commerce_insights`.

The model defines explores for orders (revenue and average order value), order items (top products), and a derived customer-facts view (repeat rate).

Looker Studio can chart the same BigQuery tables with a BigQuery data source. It does not load this LookML, and it is not a substitute for the Looker project above.

## Regenerate fixtures

`data/catalog.json` and `data/warehouse.json` are the source for the app, the SQL seeds, and the search documents.

```bash
npm run sql:emit
```

Product artwork is regenerated with:

```bash
node --experimental-strip-types scripts/generate-assets.ts
```

## Production image

`Dockerfile` builds the Next.js standalone server. It listens on `PORT` (3847 by default) and binds to `0.0.0.0`. Local development does not need Docker.
