# =============================================================================
# CertiVault — ECR Module
# =============================================================================
# Creates two private ECR repositories:
#   certivault-backend   → Node.js API image
#   certivault-frontend  → Nginx + React SPA image
#
# Features:
#   - Image scanning on every push (detects OS + package CVEs)
#   - AES256 encryption at rest
#   - Lifecycle policy: keep the 10 most recent images, delete older ones
#   - Force delete disabled (safety — prevents accidental destruction)
# =============================================================================

locals {
  repos = {
    backend  = "${var.project_name}-backend"
    frontend = "${var.project_name}-frontend"
  }
}

resource "aws_ecr_repository" "repos" {
  for_each = local.repos

  name                 = each.value
  image_tag_mutability = "MUTABLE" # allow re-tagging :latest
  force_delete         = false

  image_scanning_configuration {
    scan_on_push = true # automatically scan every pushed image
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = { Name = each.value, Component = each.key }
}

# ── Lifecycle policy: retain last 10 images ───────────────────────────────────
resource "aws_ecr_lifecycle_policy" "repos" {
  for_each   = aws_ecr_repository.repos
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images; expire older untagged images"
        selection = {
          tagStatus   = "untagged"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Keep last 10 tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v", "sha"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = { type = "expire" }
      }
    ]
  })
}
