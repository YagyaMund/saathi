output "asset_bucket" {
  description = "Product image bucket. Objects live under products/."
  value       = google_storage_bucket.assets.name
}

output "artifact_repository" {
  description = "Docker repository for the app image."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app.repository_id}"
}

output "container_image" {
  description = "Image Cloud Run is configured to run."
  value       = local.image
}

output "cloud_run_url" {
  description = "Public URL of the commerce app, when enable_cloud_run is true."
  value       = try(google_cloud_run_v2_service.app[0].uri, null)
}

output "database_engine" {
  value = var.database_engine
}

output "database_instance" {
  description = "Cloud SQL connection name, or the AlloyDB primary resource name."
  value = try(
    google_sql_database_instance.app[0].connection_name,
    google_alloydb_instance.primary[0].name,
  )
}

output "database_password" {
  description = "Password for cove_app. Also embedded in the cove-database-url secret."
  value       = random_password.db.result
  sensitive   = true
}

output "bigquery_dataset" {
  value = google_bigquery_dataset.analytics.dataset_id
}

output "vertex_connection_id" {
  description = "BigQuery connection id for the remote Gemini model."
  value       = google_bigquery_connection.vertex.connection_id
}

output "discovery_data_store" {
  value = google_discovery_engine_data_store.products.data_store_id
}

output "discovery_engine" {
  value = google_discovery_engine_search_engine.products.engine_id
}

output "search_import_hint" {
  description = "Import the sample product documents after apply."
  value       = "gcloud storage cp data/discovery/products.jsonl gs://${google_storage_bucket.assets.name}/imports/products.jsonl && gcloud alpha discovery-engine documents import --project=${var.project_id} --location=${var.discovery_location} --data-store=cove-products --gcs-uri=gs://${google_storage_bucket.assets.name}/imports/products.jsonl"
}
