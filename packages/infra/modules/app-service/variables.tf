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

variable "eip" {
  type = string
}

variable "instance_id" {
  type = string
}

variable "region" {
  type = string
}

variable "port" {
  type = number
}

variable "health_path" {
  type = string
}

variable "memory" {
  type = string
}

variable "cpus" {
  type = string
}

variable "runtime_env" {
  type = map(string)
}

variable "database_enabled" {
  type = bool
}

variable "database_name" {
  type = string
}

variable "uploads_enabled" {
  type = bool
}

variable "uploads_prefix" {
  type = string
}
