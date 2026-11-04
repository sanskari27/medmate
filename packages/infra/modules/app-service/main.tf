locals {
  host_zone = merge([
    for record in var.records : {
      for host in record.hosts : host => record.zone_id
    }
  ]...)
  hosts = sort(keys(local.host_zone))
  parameters = merge(
    {
      kind           = var.kind
      hosts          = join(",", local.hosts)
      ecr_repository = aws_ecr_repository.app.repository_url
      port           = tostring(var.port)
      health_path    = var.health_path
      memory         = var.memory
      cpus           = var.cpus
      runtime_env    = jsonencode(var.runtime_env)
    },
    var.uploads_enabled ? { uploads_prefix = var.uploads_prefix } : {},
    var.database_enabled ? {
      database_name        = var.database_name
      database_secret_name = "medmate/${var.name}/database"
    } : {},
  )
}

resource "aws_ecr_repository" "app" {
  name                 = "medmate/${var.name}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the newest ten images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_route53_record" "app" {
  for_each = local.host_zone
  zone_id  = each.value
  name     = each.key
  type     = "A"
  ttl      = 60
  records  = [var.eip]
}

resource "aws_ssm_parameter" "app" {
  for_each = local.parameters
  name     = "/medmate-repo/${var.name}/${each.key}"
  type     = "String"
  value    = each.value
}

resource "terraform_data" "database" {
  count = var.database_enabled ? 1 : 0

  triggers_replace = [
    var.database_name,
    var.instance_id,
  ]

  provisioner "local-exec" {
    command = <<-EOT
      bash "${path.module}/../../../../scripts/ssm-run.sh" ${var.instance_id} ${var.region} 180 <<'EOF'
      /opt/medmate/bin/ensure-database ${var.name} ${var.database_name}
      EOF
    EOT
  }

  depends_on = [aws_ssm_parameter.app]
}
