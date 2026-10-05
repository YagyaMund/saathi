resource "random_password" "db" {
  length  = 24
  special = false
}

resource "google_sql_database_instance" "app" {
  count            = var.database_engine == "cloudsql" ? 1 : 0
  name             = "cove-pg"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier              = var.cloud_sql_tier
    availability_type = "ZONAL"
    disk_size         = 10
    disk_type         = "PD_SSD"

    backup_configuration {
      enabled = true
    }

    ip_configuration {
      ipv4_enabled = true
      ssl_mode     = "ENCRYPTED_ONLY"
    }
  }

  deletion_protection = false
  depends_on          = [google_project_service.required]
}

resource "google_sql_database" "app" {
  count    = var.database_engine == "cloudsql" ? 1 : 0
  name     = "cove"
  instance = google_sql_database_instance.app[0].name
}

resource "google_sql_user" "app" {
  count    = var.database_engine == "cloudsql" ? 1 : 0
  name     = "cove_app"
  instance = google_sql_database_instance.app[0].name
  password = random_password.db.result
}

resource "google_compute_network" "db" {
  count                   = var.database_engine == "alloydb" ? 1 : 0
  name                    = "cove-db"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.required]
}

resource "google_compute_subnetwork" "db" {
  count         = var.database_engine == "alloydb" ? 1 : 0
  name          = "cove-db"
  ip_cidr_range = "10.8.0.0/24"
  region        = var.region
  network       = google_compute_network.db[0].id
}

resource "google_compute_global_address" "private_service" {
  count         = var.database_engine == "alloydb" ? 1 : 0
  name          = "cove-alloydb-peering"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  address       = "10.16.0.0"
  network       = google_compute_network.db[0].id
}

resource "google_service_networking_connection" "db" {
  count                   = var.database_engine == "alloydb" ? 1 : 0
  network                 = google_compute_network.db[0].id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_service[0].name]

  depends_on = [google_project_service.required]
}

resource "google_alloydb_cluster" "app" {
  count      = var.database_engine == "alloydb" ? 1 : 0
  cluster_id = "cove"
  location   = var.region

  network_config {
    network = google_compute_network.db[0].id
  }

  initial_user {
    user     = "cove_app"
    password = random_password.db.result
  }

  depends_on = [google_service_networking_connection.db]
}

resource "google_alloydb_instance" "primary" {
  count         = var.database_engine == "alloydb" ? 1 : 0
  cluster       = google_alloydb_cluster.app[0].name
  instance_id   = "cove-primary"
  instance_type = "PRIMARY"

  machine_config {
    cpu_count = 2
  }

  depends_on = [google_service_networking_connection.db]
}

locals {
  image = (
    var.container_image != ""
    ? var.container_image
    : "${var.region}-docker.pkg.dev/${var.project_id}/cove/app:latest"
  )

  database_url = concat(
    [
      for instance in google_sql_database_instance.app :
      "postgresql://cove_app:${random_password.db.result}@/cove?host=/cloudsql/${instance.connection_name}"
    ],
    [
      for instance in google_alloydb_instance.primary :
      "postgresql://cove_app:${random_password.db.result}@${instance.ip_address}:5432/postgres?sslmode=require"
    ],
  )[0]
}

resource "google_secret_manager_secret" "database_url" {
  secret_id = "cove-database-url"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = local.database_url
}

resource "google_secret_manager_secret_iam_member" "run_database" {
  secret_id = google_secret_manager_secret.database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.run.email}"
}
