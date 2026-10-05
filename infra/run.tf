resource "google_cloud_run_v2_service" "app" {
  count    = var.enable_cloud_run ? 1 : 0
  name     = "cove-supply"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.run.email

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    dynamic "volumes" {
      for_each = google_sql_database_instance.app
      content {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [volumes.value.connection_name]
        }
      }
    }

    dynamic "vpc_access" {
      for_each = google_compute_subnetwork.db
      content {
        egress = "PRIVATE_RANGES_ONLY"
        network_interfaces {
          network    = google_compute_network.db[0].id
          subnetwork = vpc_access.value.name
        }
      }
    }

    containers {
      image = local.image

      ports {
        container_port = 3847
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
      }

      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "GCP_REGION"
        value = var.region
      }
      env {
        name  = "VERTEX_MODEL"
        value = var.vertex_model
      }
      env {
        name  = "DISCOVERY_ENGINE_LOCATION"
        value = var.discovery_location
      }
      env {
        name  = "DISCOVERY_DATA_STORE_ID"
        value = google_discovery_engine_data_store.products.data_store_id
      }
      env {
        name  = "DISCOVERY_ENGINE_ID"
        value = google_discovery_engine_search_engine.products.engine_id
      }
      env {
        name  = "BIGQUERY_DATASET"
        value = google_bigquery_dataset.analytics.dataset_id
      }
      env {
        name  = "GCS_BUCKET"
        value = google_storage_bucket.assets.name
      }
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }

      dynamic "volume_mounts" {
        for_each = google_sql_database_instance.app
        content {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }
    }
  }

  depends_on = [
    google_project_service.required,
    google_secret_manager_secret_version.database_url,
    google_secret_manager_secret_iam_member.run_database,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  count    = var.enable_cloud_run ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.app[0].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
