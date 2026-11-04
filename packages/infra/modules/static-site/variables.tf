variable "name" {
  type = string
}

variable "kind" {
  type = string
}

variable "records" {
  type = list(object({
    zone_id = string
    hosts   = list(string)
  }))
}

variable "bucket_regional_domain_name" {
  type = string
}

variable "static_prefix" {
  type = string
}

variable "pretty_html" {
  type    = bool
  default = false
}
