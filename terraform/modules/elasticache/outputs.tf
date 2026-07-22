output "primary_endpoint" {
  description = "Primary endpoint address for the Redis cluster"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "port" {
  description = "Port Redis is listening on"
  value       = aws_elasticache_cluster.redis.port
}

output "cluster_id" {
  value = aws_elasticache_cluster.redis.id
}

output "security_group_id" {
  description = "Security group attached to the Redis cluster"
  value       = aws_security_group.redis.id
}
