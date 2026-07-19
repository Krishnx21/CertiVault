variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "node_type" {
  type    = string
  default = "cache.t3.micro"
}

variable "engine_version" {
  type    = string
  default = "7.0"
}

variable "num_cache_nodes" {
  type    = number
  default = 1
}

variable "subnet_ids" {
  type = list(string)
}

variable "vpc_id" {
  type = string
}

variable "allowed_security_groups" {
  description = "Security group IDs that are allowed to connect to Redis on port 6379"
  type        = list(string)
  default     = []
}
