# =============================================================================
# CertiVault — Root Module Outputs
# =============================================================================
# After `terraform apply`, retrieve any value with:
#   terraform output <output_name>
#   terraform output -json | jq .
# =============================================================================

# ── VPC ───────────────────────────────────────────────────────────────────────
output "vpc_id" {
  description = "ID of the CertiVault VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets (for load balancer / NAT)"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets (for EKS nodes / Redis)"
  value       = module.vpc.private_subnet_ids
}

# ── S3 ────────────────────────────────────────────────────────────────────────
output "s3_bucket_name" {
  description = "Name of the S3 document storage bucket"
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "ARN of the S3 document storage bucket"
  value       = module.s3.bucket_arn
}

output "s3_bucket_region" {
  description = "AWS region the bucket resides in"
  value       = module.s3.bucket_region
}

# ── ECR ───────────────────────────────────────────────────────────────────────
output "ecr_backend_url" {
  description = "ECR repository URL for the backend image"
  value       = module.ecr.backend_repository_url
}

output "ecr_frontend_url" {
  description = "ECR repository URL for the frontend image"
  value       = module.ecr.frontend_repository_url
}

# ── DocumentDB ───────────────────────────────────────────────────────────────
output "docdb_cluster_endpoint" {
  description = "Writer endpoint for the DocumentDB cluster"
  value       = module.documentdb.cluster_endpoint
}

output "docdb_cluster_reader_endpoint" {
  description = "Reader endpoint for load-balanced read queries"
  value       = module.documentdb.cluster_reader_endpoint
}

output "docdb_cluster_port" {
  description = "Port the DocumentDB cluster listens on"
  value       = module.documentdb.cluster_port
}

output "docdb_master_secret_arn" {
  description = "Secrets Manager ARN containing the DocumentDB master password + connection URI"
  value       = module.documentdb.master_secret_arn
}

# ── Redis ─────────────────────────────────────────────────────────────────────
output "redis_endpoint" {
  description = "Primary endpoint for the ElastiCache Redis cluster"
  value       = module.elasticache.primary_endpoint
}

output "redis_port" {
  description = "Port for the Redis cluster"
  value       = module.elasticache.port
}

# ── EKS ───────────────────────────────────────────────────────────────────────
output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "Endpoint URL of the EKS Kubernetes API server"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_arn" {
  description = "ARN of the EKS cluster"
  value       = module.eks.cluster_arn
}

output "eks_cluster_ca_data" {
  description = "Base64-encoded CA certificate for the EKS cluster"
  value       = module.eks.cluster_ca_data
  sensitive   = true
}

output "eks_oidc_provider_arn" {
  description = "ARN of the EKS OIDC provider (for IRSA)"
  value       = module.eks.oidc_provider_arn
}

# ── kubeconfig helper ─────────────────────────────────────────────────────────
output "kubeconfig_command" {
  description = "Run this command to configure kubectl for the EKS cluster"
  value       = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.aws_region}"
}
