resource "google_discovery_engine_data_store" "products" {
  location          = var.discovery_location
  data_store_id     = "cove-products"
  display_name      = "Cove Supply products"
  industry_vertical = "GENERIC"
  content_config    = "NO_CONTENT"
  solution_types    = ["SOLUTION_TYPE_SEARCH"]

  depends_on = [google_project_service.required]
}

resource "google_discovery_engine_search_engine" "products" {
  engine_id      = "cove-search"
  collection_id  = "default_collection"
  location       = var.discovery_location
  display_name   = "Cove Supply search"
  data_store_ids = [google_discovery_engine_data_store.products.id]

  search_engine_config {}

  depends_on = [google_project_service.required]
}
