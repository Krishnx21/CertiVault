# =============================================================================
# CertiVault — Root Module
# Wires all child modules together and passes outputs between them.
# =============================================================================

# ── VPC ───────────────────────────────────────────────────────────────────────
module "vpc" {
  source = "./modules/vpc"

  project_name         = var.project_name
  environment          = var.environment
  aws_region           = var.aws_region
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# ── S3 Document Storage ───────────────────────────────────────────────────────
module "s3" {
  source = "./modules/s3"

  project_name            = var.project_name
  environment             = var.environment
  glacier_transition_days = var.s3_glacier_transition_days
  frontend_domain         = var.frontend_domain
  eks_node_role_arn       = module.eks.node_role_arn
}

# ── ECR Repositories ──────────────────────────────────────────────────────────
module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment
}

# ── ElastiCache Redis ─────────────────────────────────────────────────────────
module "elasticache" {
  source = "./modules/elasticache"

  project_name            = var.project_name
  environment             = var.environment
  node_type               = var.redis_node_type
  engine_version          = var.redis_engine_version
  num_cache_nodes         = var.redis_num_cache_nodes
  subnet_ids              = module.vpc.private_subnet_ids
  vpc_id                  = module.vpc.vpc_id
  allowed_security_groups = [module.eks.node_security_group_id]
}

# ── DocumentDB Cluster ───────────────────────────────────────────────────────
module "documentdb" {
  source = "./modules/documentdb"

  project_name            = var.project_name
  environment             = var.environment
  engine_version          = var.docdb_engine_version
  instance_class          = var.docdb_instance_class
  instance_count          = var.docdb_instance_count
  master_username         = var.docdb_master_username
  database_name           = var.docdb_database_name
  backup_retention_days   = var.docdb_backup_retention_days
  deletion_protection     = var.docdb_deletion_protection
  subnet_ids              = module.vpc.private_subnet_ids
  vpc_id                  = module.vpc.vpc_id
  allowed_security_groups = [module.eks.node_security_group_id]
}

# ── EKS Cluster ───────────────────────────────────────────────────────────────
module "eks" {
  source = "./modules/eks"

  project_name       = var.project_name
  environment        = var.environment
  cluster_version    = var.eks_cluster_version
  node_instance_type = var.node_instance_type
  min_nodes          = var.min_nodes
  max_nodes          = var.max_nodes
  desired_nodes      = var.desired_nodes
  node_disk_size     = var.node_disk_size
  private_subnet_ids = module.vpc.private_subnet_ids
  vpc_id             = module.vpc.vpc_id
}
