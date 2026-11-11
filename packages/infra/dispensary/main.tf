provider "aws" {
  region = "ap-south-1"

  default_tags {
    tags = {
      Project   = "medmate"
      ManagedBy = "terraform"
      App       = "dispensary"
    }
  }
}

provider "aws" {
  alias  = "use1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = "medmate"
      ManagedBy = "terraform"
      App       = "dispensary"
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
  project = yamldecode(file("${path.module}/../../apps/dispensary/project.yaml"))
  records = [
    for record in local.project.routing.records : {
      zone_id = data.terraform_remote_state.platform.outputs.zone_ids[record.zone]
      hosts   = record.hosts
    }
  ]
}

module "site" {
  source = "../modules/static-site"

  providers = {
    aws      = aws
    aws.use1 = aws.use1
  }

  name                        = local.project.name
  kind                        = local.project.kind
  records                     = local.records
  bucket_regional_domain_name = data.terraform_remote_state.platform.outputs.bucket_regional_domain_name
  static_prefix               = "static-sites/${local.project.name}"
  pretty_html                 = false
}
