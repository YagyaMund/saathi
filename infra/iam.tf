resource "google_service_account" "run" {
  account_id   = "cove-run"
  display_name = "Cove Supply Cloud Run"
  depends_on   = [google_project_service.required]
}

resource "google_project_iam_member" "run" {
  for_each = toset([
    "roles/aiplatform.user",
    "roles/bigquery.jobUser",
    "roles/cloudsql.client",
    "roles/discoveryengine.viewer",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.run.email}"
}

resource "google_project_iam_member" "run_alloydb" {
  count = var.database_engine == "alloydb" ? 1 : 0

  project = var.project_id
  role    = "roles/alloydb.client"
  member  = "serviceAccount:${google_service_account.run.email}"
}

resource "google_bigquery_dataset_iam_member" "run_viewer" {
  dataset_id = google_bigquery_dataset.analytics.dataset_id
  role       = "roles/bigquery.dataViewer"
  member     = "serviceAccount:${google_service_account.run.email}"
}
