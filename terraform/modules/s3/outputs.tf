output "bucket_name" {
  description = "Name of the S3 document storage bucket"
  value       = aws_s3_bucket.documents.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.documents.arn
}

output "bucket_region" {
  description = "AWS region the bucket is in"
  value       = aws_s3_bucket.documents.region
}

output "bucket_domain_name" {
  description = "Bucket regional domain name (for pre-signed URLs)"
  value       = aws_s3_bucket.documents.bucket_regional_domain_name
}
