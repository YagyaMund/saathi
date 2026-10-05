resource "google_storage_bucket" "assets" {
  name                        = "${var.project_id}-cove-assets"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = var.force_destroy_bucket

  labels = {
    app = "cove-supply"
  }

  depends_on = [google_project_service.required]
}

resource "google_storage_bucket_object" "product" {
  for_each = fileset("${path.module}/../assets/products", "*.svg")

  name         = "products/${each.value}"
  bucket       = google_storage_bucket.assets.name
  source       = "${path.module}/../assets/products/${each.value}"
  content_type = "image/svg+xml"
}

resource "google_storage_bucket_iam_member" "run_objects" {
  bucket = google_storage_bucket.assets.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.run.email}"
}
