# =============================================================================
# CertiVault — S3 Document Storage Module
# =============================================================================
# Creates an S3 bucket for user-uploaded documents with:
#   - Random suffix to guarantee globally unique name
#   - Block all public access
#   - AES256 server-side encryption
#   - Versioning enabled (recover accidentally deleted docs)
#   - CORS for frontend domain
#   - Lifecycle: move to Glacier Instant Retrieval after N days
#   - Bucket policy: allow only the EKS node role + deny plain HTTP
# =============================================================================

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

locals {
  bucket_name = "${var.project_name}-documents-${random_id.bucket_suffix.hex}"
}

# ── Bucket ────────────────────────────────────────────────────────────────────
resource "aws_s3_bucket" "documents" {
  bucket        = local.bucket_name
  force_destroy = false # never wipe documents on terraform destroy

  tags = { Name = local.bucket_name, Purpose = "document-storage" }
}

# ── Block all public access ───────────────────────────────────────────────────
resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── Versioning ────────────────────────────────────────────────────────────────
resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ── Encryption (AES256) ───────────────────────────────────────────────────────
resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# ── CORS (allow frontend to PUT signed URLs) ──────────────────────────────────
resource "aws_s3_bucket_cors_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = [var.frontend_domain]
    expose_headers  = ["ETag", "Content-Length", "Content-Type"]
    max_age_seconds = 3600
  }
}

# ── Lifecycle: archive to Glacier after N days ───────────────────────────────
resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    id     = "archive-old-documents"
    status = "Enabled"

    filter { prefix = "" } # applies to all objects

    transition {
      days          = var.glacier_transition_days
      storage_class = "GLACIER_IR" # Glacier Instant Retrieval (ms access)
    }

    # Expire non-current versions after 30 days to control storage costs
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# ── Bucket Policy ─────────────────────────────────────────────────────────────
resource "aws_s3_bucket_policy" "documents" {
  bucket = aws_s3_bucket.documents.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # Allow EKS node role to read and write documents
      {
        Sid    = "AllowEKSNodeAccess"
        Effect = "Allow"
        Principal = {
          AWS = var.eks_node_role_arn
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.documents.arn}/*"
      },
      # Allow EKS node role to list the bucket
      {
        Sid    = "AllowEKSNodeList"
        Effect = "Allow"
        Principal = {
          AWS = var.eks_node_role_arn
        }
        Action   = ["s3:ListBucket", "s3:GetBucketLocation"]
        Resource = aws_s3_bucket.documents.arn
      },
      # Deny all non-HTTPS traffic
      {
        Sid       = "DenyHTTP"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.documents.arn,
          "${aws_s3_bucket.documents.arn}/*"
        ]
        Condition = {
          Bool = { "aws:SecureTransport" = "false" }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.documents]
}
