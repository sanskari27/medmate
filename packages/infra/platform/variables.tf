variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "ec2_instance_type" {
  type    = string
  default = "t3.small"
}

variable "github_repository" {
  type        = string
  default     = ""
  description = "GitHub repository in owner/name form. Leave empty until the repository exists."
}

variable "github_owner_id" {
  type        = string
  default     = ""
  description = "GitHub owner account ID. Required with github_repository because Actions tokens use immutable subjects."
}

variable "github_repository_id" {
  type        = string
  default     = ""
  description = "GitHub repository ID. Required with github_repository because Actions tokens use immutable subjects."
}
