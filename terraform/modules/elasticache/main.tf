# =============================================================================
# CertiVault — ElastiCache Redis Module
# =============================================================================
# Creates:
#   Subnet group   → pins Redis to the private subnets
#   Security group → allows port 6379 only from EKS node security group
#   Cluster        → single-node Redis 7 (scale to cluster mode for prod HA)
#
# Note: For production HA, set num_cache_nodes > 1 or switch to
# aws_elasticache_replication_group with automatic_failover_enabled = true
# =============================================================================

locals {
  name = "${var.project_name}-${var.environment}"
}

# ── Subnet Group (private subnets only) ──────────────────────────────────────
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name}-redis-subnets"
  subnet_ids = var.subnet_ids

  tags = { Name = "${local.name}-redis-subnets" }
}

# ── Security Group ────────────────────────────────────────────────────────────
resource "aws_security_group" "redis" {
  name        = "${local.name}-redis-sg"
  description = "Allow Redis access from EKS nodes only"
  vpc_id      = var.vpc_id

  tags = { Name = "${local.name}-redis-sg" }
}

# Allow inbound Redis from each allowed security group (EKS nodes)
resource "aws_vpc_security_group_ingress_rule" "redis_from_eks" {
  count                        = length(var.allowed_security_groups)
  security_group_id            = aws_security_group.redis.id
  referenced_security_group_id = var.allowed_security_groups[count.index]
  from_port                    = 6379
  to_port                      = 6379
  ip_protocol                  = "tcp"
  description                  = "Redis from EKS nodes"
}

# Allow all outbound
resource "aws_vpc_security_group_egress_rule" "redis_egress" {
  security_group_id = aws_security_group.redis.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# ── ElastiCache Cluster ───────────────────────────────────────────────────────
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${local.name}-redis"
  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  num_cache_nodes      = var.num_cache_nodes
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_security_group.redis.id]

  # Maintenance window (low-traffic time — adjust for your timezone)
  maintenance_window = "sun:05:00-sun:06:00"

  # Automatic minor version upgrades
  auto_minor_version_upgrade = true

  tags = { Name = "${local.name}-redis" }
}
