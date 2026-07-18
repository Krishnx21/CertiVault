# =============================================================================
# CertiVault — Terraform Remote State (S3 + DynamoDB)
# =============================================================================
# BEFORE running terraform init for the first time, create these manually:
#
#   aws s3api create-bucket \
#     --bucket certivault-terraform-state \
#     --region ap-south-1 \
#     --create-bucket-configuration LocationConstraint=ap-south-1
#
#   aws s3api put-bucket-versioning \
#     --bucket certivault-terraform-state \
#     --versioning-configuration Status=Enabled
#
#   aws s3api put-bucket-encryption \
#     --bucket certivault-terraform-state \
#     --server-side-encryption-configuration \
#       '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
#
#   aws dynamodb create-table \
#     --table-name certivault-terraform-locks \
#     --attribute-definitions AttributeName=LockID,AttributeType=S \
#     --key-schema AttributeName=LockID,KeyType=HASH \
#     --billing-mode PAY_PER_REQUEST \
#     --region ap-south-1
#
# After creating the resources above, run:
#   terraform init
# =============================================================================

terraform {
  backend "s3" {
    bucket         = "certivault-terraform-state"
    key            = "certivault/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "certivault-terraform-locks"
  }
}
