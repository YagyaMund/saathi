resource "google_bigquery_dataset" "analytics" {
  dataset_id    = "cove_analytics"
  friendly_name = "Cove Supply analytics"
  description   = "Customers, orders, and products for the Cove insights demo."
  location      = var.region

  labels = {
    app = "cove-supply"
  }

  depends_on = [google_project_service.required]
}

resource "google_bigquery_table" "customers" {
  dataset_id          = google_bigquery_dataset.analytics.dataset_id
  table_id            = "customers"
  schema              = file("${path.module}/schemas/customers.json")
  deletion_protection = false
}

resource "google_bigquery_table" "products" {
  dataset_id          = google_bigquery_dataset.analytics.dataset_id
  table_id            = "products"
  schema              = file("${path.module}/schemas/products.json")
  deletion_protection = false
}

resource "google_bigquery_table" "orders" {
  dataset_id          = google_bigquery_dataset.analytics.dataset_id
  table_id            = "orders"
  schema              = file("${path.module}/schemas/orders.json")
  deletion_protection = false

  time_partitioning {
    type  = "DAY"
    field = "ordered_at"
  }
}

resource "google_bigquery_table" "order_items" {
  dataset_id          = google_bigquery_dataset.analytics.dataset_id
  table_id            = "order_items"
  schema              = file("${path.module}/schemas/order_items.json")
  deletion_protection = false
}

resource "google_bigquery_connection" "vertex" {
  connection_id = "cove-vertex"
  location      = var.region
  friendly_name = "Cove Vertex AI"
  description   = "Cloud resource connection for BigQuery AI remote Gemini models."
  cloud_resource {}

  depends_on = [google_project_service.required]
}

resource "google_project_iam_member" "vertex_connection" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_bigquery_connection.vertex.cloud_resource[0].service_account_id}"
}
