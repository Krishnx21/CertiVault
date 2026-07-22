variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "glacier_transition_days" {
  type    = number
  default = 90
}

variable "frontend_domain" {
  type = string
}

variable "eks_node_role_arn" {
  description = "IAM role ARN of EKS nodes — granted s3:GetObject + s3:PutObject"
  type        = string
}
