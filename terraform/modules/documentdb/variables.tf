# =============================================================================
# CertiVault — DocumentDB Module Variables
# =============================================================================

variable "project_name" {
  description = "Short project identifier — used as a prefix on all resource names"
  type        = string
}

variable "environment" {
  description = "Deployment environment: development | staging | production"
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs to place the DocumentDB cluster in"
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID the cluster will reside in"
  type        = string
}

variable "allowed_security_groups" {
  description = "Security group IDs allowed to connect on port 27017 (EKS nodes)"
  type        = list(string)
  default     = []
}

variable "engine_version" {
  description = "DocumentDB engine version"
  type        = string
  default     = "5.0.0"
}

variable "instance_class" {
  description = "DocumentDB instance class (db.t3.medium is the minimum for DocumentDB)"
  type        = string
  default     = "db.t3.medium"
}

variable "instance_count" {
  description = "Number of DocumentDB cluster instances (1 = single node, ≥2 for HA)"
  type        = number
  default     = 1

  validation {
    condition     = var.instance_count >= 1 && var.instance_count <= 16
    error_message = "instance_count must be between 1 and 16."
  }
}

variable "master_username" {
  description = "Master username for the DocumentDB cluster"
  type        = string
  default     = "certivault"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{0,62}$", var.master_username))
    error_message = "master_username must start with a letter and contain only letters, numbers, and underscores."
  }
}

variable "database_name" {
  description = "Default database name used in the application connection URI"
  type        = string
  default     = "certivault"
}

variable "backup_retention_days" {
  description = "Number of days to retain automated backups (1–35)"
  type        = number
  default     = 7

  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 35
    error_message = "backup_retention_days must be between 1 and 35."
  }
}

variable "deletion_protection" {
  description = "Enable deletion protection on the cluster (recommended true for production)"
  type        = bool
  default     = true
}
