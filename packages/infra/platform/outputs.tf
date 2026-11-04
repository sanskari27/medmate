output "region" {
  value = var.aws_region
}

output "account_id" {
  value = local.account_id
}

output "instance_id" {
  value = aws_instance.platform.id
}

output "eip" {
  value = aws_eip.platform.public_ip
}

output "bucket" {
  value = aws_s3_bucket.repo.bucket
}

output "bucket_regional_domain_name" {
  value = aws_s3_bucket.repo.bucket_regional_domain_name
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.address
}

output "rds_secret_arn" {
  value = aws_db_instance.postgres.master_user_secret[0].secret_arn
}

output "zone_ids" {
  value = local.zone_ids
}

output "deploy_role_arn" {
  value = try(aws_iam_role.deploy[0].arn, "")
}

output "infra_role_arn" {
  value = try(aws_iam_role.infra[0].arn, "")
}
