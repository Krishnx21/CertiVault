# =============================================================================
# CertiVault — Root Module Variables
# =============================================================================

# ── General ───────────────────────────────────────────────────────────────────

variable "aws_region" {
  description = "AWS region to deploy all resources into"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Short project identifier — used as a prefix on all resource names"
  type        = string
  default     = "certivault"
}

variable "environment" {
  description = "Deployment environment: development | staging | production"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "environment must be one of: development, staging, production"
  }
}

# ── VPC ───────────────────────────────────────────────────────────────────────

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for the two public subnets (load balancer / NAT gateway)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for the two private subnets (app servers / EKS nodes)"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

# ── EKS ───────────────────────────────────────────────────────────────────────

variable "eks_cluster_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.29"
}

variable "node_instance_type" {
  description = "EC2 instance type for EKS worker nodes"
  type        = string
  default     = "t3.small"
}

variable "min_nodes" {
  description = "Minimum number of EKS worker nodes"
  type        = number
  default     = 2
}

variable "max_nodes" {
  description = "Maximum number of EKS worker nodes"
  type        = number
  default     = 5
}

variable "desired_nodes" {
  description = "Initial desired count of EKS worker nodes"
  type        = number
  default     = 2
}

variable "node_disk_size" {
  description = "Root EBS volume size (GB) for each EKS worker node"
  type        = number
  default     = 20
}

# ── ElastiCache (Redis) ───────────────────────────────────────────────────────

variable "redis_node_type" {
  description = "ElastiCache node type for Redis"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "redis_num_cache_nodes" {
  description = "Number of Redis cache nodes (1 = single node, no HA)"
  type        = number
  default     = 1
}

# ── DocumentDB ───────────────────────────────────────────────────────────────

variable "docdb_engine_version" {
  description = "DocumentDB engine version"
  type        = string
  default     = "5.0.0"
}

variable "docdb_instance_class" {
  description = "DocumentDB instance class (db.t3.medium is the minimum available)"
  type        = string
  default     = "db.t3.medium"
}

variable "docdb_instance_count" {
  description = "Number of DocumentDB cluster instances (1 = single node, ≥2 for HA)"
  type        = number
  default     = 1
}

variable "docdb_master_username" {
  description = "Master username for DocumentDB"
  type        = string
  default     = "certivault"
}

variable "docdb_database_name" {
  description = "Initial database name inside the DocumentDB cluster"
  type        = string
  default     = "certivault"
}

variable "docdb_backup_retention_days" {
  description = "Days to retain automated DocumentDB backups (1–35)"
  type        = number
  default     = 7
}

variable "docdb_deletion_protection" {
  description = "Enable deletion protection on the DocumentDB cluster"
  type        = bool
  default     = true
}

# ── S3 ────────────────────────────────────────────────────────────────────────

variable "s3_glacier_transition_days" {
  description = "Days after which objects transition to Glacier Instant Retrieval"
  type        = number
  default     = 90
}

variable "frontend_domain" {
  description = "Domain for CORS allow-origin on the S3 bucket (e.g. https://certivault.example.com)"
  type        = string
  default     = "https://certivault.example.com"
}
