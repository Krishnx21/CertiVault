# =============================================================================
# CertiVault — DocumentDB Module Outputs
# =============================================================================

output "cluster_endpoint" {
  description = "Writer endpoint for the DocumentDB cluster"
  value       = aws_docdb_cluster.main.endpoint
}

output "cluster_reader_endpoint" {
  description = "Reader endpoint for load-balanced read queries"
  value       = aws_docdb_cluster.main.reader_endpoint
}

output "cluster_port" {
  description = "Port the DocumentDB cluster listens on"
  value       = aws_docdb_cluster.main.port
}

output "cluster_identifier" {
  description = "DocumentDB cluster identifier"
  value       = aws_docdb_cluster.main.cluster_identifier
}

output "cluster_arn" {
  description = "ARN of the DocumentDB cluster"
  value       = aws_docdb_cluster.main.arn
}

output "master_username" {
  description = "Master username for the DocumentDB cluster"
  value       = aws_docdb_cluster.main.master_username
  sensitive   = true
}

output "master_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the master credentials and connection URI"
  value       = aws_secretsmanager_secret.docdb_master.arn
}

output "master_secret_name" {
  description = "Name of the Secrets Manager secret (use in app IAM policy)"
  value       = aws_secretsmanager_secret.docdb_master.name
}

output "security_group_id" {
  description = "Security group ID attached to the DocumentDB cluster"
  value       = aws_security_group.docdb.id
}

output "connection_uri_secret_arn" {
  description = "Retrieve full MongoDB URI with: aws secretsmanager get-secret-value --secret-id <arn>"
  value       = aws_secretsmanager_secret.docdb_master.arn
}
