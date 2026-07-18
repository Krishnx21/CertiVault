output "backend_repository_url" {
  description = "ECR URL for the backend image"
  value       = aws_ecr_repository.repos["backend"].repository_url
}

output "frontend_repository_url" {
  description = "ECR URL for the frontend image"
  value       = aws_ecr_repository.repos["frontend"].repository_url
}

output "backend_repository_arn" {
  value = aws_ecr_repository.repos["backend"].arn
}

output "frontend_repository_arn" {
  value = aws_ecr_repository.repos["frontend"].arn
}

output "registry_id" {
  description = "AWS account ID that owns the ECR registry"
  value       = aws_ecr_repository.repos["backend"].registry_id
}
