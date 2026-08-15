variable "aws_region" {
  description = "AWS region for the DevSecOps platform"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name used for AWS resource naming"
  type        = string
  default     = "devsecops"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}
