variable "project_name"         { type = string }
variable "environment"           { type = string }
variable "aws_region"            { type = string }
variable "vpc_cidr"              { type = string }
variable "public_subnet_cidrs"   { type = list(string) }
variable "private_subnet_cidrs"  { type = list(string) }
