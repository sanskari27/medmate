provider "aws" {
  region = "ap-south-1"

  default_tags {
    tags = {
      Project   = "medmate"
      ManagedBy = "terraform"
      App       = "todo-server"
    }
  }
}

data "terraform_remote_state" "platform" {
  backend = "s3"

  config = {
    bucket         = "medmate-tfstate-105927215604"
    key            = "platform/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "medmate-tfstate-lock"
  }
}

locals {
  project          = yamldecode(file("${path.module}/../../apps/todo-server/project.yaml"))
  database_enabled = try(local.project.resources.database.enabled, false)
  uploads_enabled  = try(local.project.resources.uploads.enabled, false)
  extra_prefix     = trim(try(local.project.resources.uploads.prefix, ""), "/")
  uploads_prefix   = join("/", compact(["app-uploads", local.project.name, local.extra_prefix]))
  records = [
    for record in local.project.routing.records : {
      zone_id = data.terraform_remote_state.platform.outputs.zone_ids[record.zone]
      hosts   = record.hosts
    }
  ]
}

module "service" {
  source = "../modules/app-service"

  name             = local.project.name
  kind             = local.project.kind
  records          = local.records
  eip              = data.terraform_remote_state.platform.outputs.eip
  instance_id      = data.terraform_remote_state.platform.outputs.instance_id
  region           = data.terraform_remote_state.platform.outputs.region
  port             = try(local.project.runtime.port, local.project.kind == "next" ? 3000 : 8080)
  health_path      = try(local.project.runtime.healthPath, "/")
  memory           = try(local.project.runtime.memory, "512m")
  cpus             = tostring(try(local.project.runtime.cpus, "0.5"))
  runtime_env      = try(local.project.runtime.env, {})
  database_enabled = local.database_enabled
  database_name    = try(local.project.resources.database.name, replace(local.project.name, "-", "_"))
  uploads_enabled  = local.uploads_enabled
  uploads_prefix   = local.uploads_prefix
}
