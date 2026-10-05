resource "google_artifact_registry_repository" "app" {
  location      = var.region
  repository_id = "cove"
  format        = "DOCKER"
  description   = "Cove Supply application images"

  depends_on = [google_project_service.required]
}
