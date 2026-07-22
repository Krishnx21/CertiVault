# =============================================================================
# CertiVault — Terraform Provider Configuration
# =============================================================================
# Requires Terraform >= 1.7 and AWS provider >= 5.0
# Run:  terraform init   to download providers
# =============================================================================

terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

# =============================================================================
# AWS Provider
# =============================================================================
provider "aws" {
  region = var.aws_region

  # All resources get these tags by default — no need to repeat on every resource
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "https://github.com/krishnx21/CertiVault"
    }
  }
}
