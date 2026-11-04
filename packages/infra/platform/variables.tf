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
