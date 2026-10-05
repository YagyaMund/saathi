variable "project_id" {
  type        = string
  description = "Google Cloud project id. Billing must already be enabled."
}

variable "region" {
  type        = string
  description = "Region for Cloud Run, Cloud SQL or AlloyDB, BigQuery, and the Vertex connection."
  default     = "us-central1"
}

variable "database_engine" {
  type        = string
  description = "Operational database. cloudsql (default) or alloydb. Only one is provisioned."
  default     = "cloudsql"

  validation {
    condition     = contains(["cloudsql", "alloydb"], var.database_engine)
    error_message = "database_engine must be cloudsql or alloydb."
  }
}

variable "discovery_location" {
  type        = string
  description = "Discovery Engine location. global is the usual choice for Vertex AI Search."
  default     = "global"
}

variable "vertex_model" {
  type        = string
  description = "Gemini model id used by the app and the BigQuery AI example."
  default     = "gemini-2.5-flash"
}

variable "container_image" {
  type        = string
  description = "Cloud Run image. Empty uses the Artifact Registry latest tag produced by cloudbuild.yaml."
  default     = ""
}

variable "enable_cloud_run" {
  type        = bool
  description = "Create the Cloud Run service. Set false on the first apply, before the image exists."
  default     = true
}

variable "cloud_sql_tier" {
  type        = string
  description = "Cloud SQL machine tier. Ignored when database_engine is alloydb."
  default     = "db-g1-small"
}

variable "force_destroy_bucket" {
  type        = bool
  description = "Allow terraform destroy to delete the asset bucket even when it still holds objects."
  default     = false
}
