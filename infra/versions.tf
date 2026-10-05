terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # State holds the database password. Add a remote backend before sharing
  # this configuration, for example:
  # backend "gcs" {
  #   bucket = "PROJECT_ID-cove-tfstate"
  #   prefix = "cove"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
