provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "medmate"
      ManagedBy = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

data "aws_kms_alias" "ssm" {
  name = "alias/aws/ssm"
}

data "aws_route53_zone" "nammamedmate" {
  name         = "nammamedmate.com."
  private_zone = false
}

data "aws_route53_zone" "medmatepharmacy" {
  name         = "medmatepharmacy.com."
  private_zone = false
}

locals {
  account_id = data.aws_caller_identity.current.account_id
  subnet_id  = sort(data.aws_subnets.default.ids)[0]
  zone_ids = {
    "nammamedmate.com"    = data.aws_route53_zone.nammamedmate.zone_id
    "medmatepharmacy.com" = data.aws_route53_zone.medmatepharmacy.zone_id
  }
}

resource "aws_security_group" "ec2" {
  name        = "medmate-platform-ec2"
  description = "HTTP and HTTPS for the shared application host"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_vpc_security_group_egress_rule" "ec2" {
  security_group_id = aws_security_group.ec2.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.ec2.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.ec2.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_security_group" "rds" {
  name        = "medmate-platform-rds"
  description = "Postgres from the shared application host"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_vpc_security_group_ingress_rule" "postgres" {
  security_group_id            = aws_security_group.rds.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = aws_security_group.ec2.id
}

resource "aws_s3_bucket" "repo" {
  bucket = "medmate-repo"
}

resource "aws_s3_bucket_versioning" "repo" {
  bucket = aws_s3_bucket.repo.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "repo" {
  bucket = aws_s3_bucket.repo.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "repo" {
  bucket                  = aws_s3_bucket.repo.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "repo" {
  bucket = aws_s3_bucket.repo.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_policy" "repo" {
  bucket = aws_s3_bucket.repo.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.repo.arn,
          "${aws_s3_bucket.repo.arn}/*",
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "CloudFrontReadStaticSites"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.repo.arn}/static-sites/*"
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = local.account_id
          }
        }
      },
    ]
  })
}

resource "aws_s3_object" "scripts" {
  for_each = fileset("${path.module}/../scripts", "*.sh")
  bucket   = aws_s3_bucket.repo.id
  key      = "platform-scripts/${each.value}"
  source   = "${path.module}/../scripts/${each.value}"
  etag     = filemd5("${path.module}/../scripts/${each.value}")
}

resource "aws_iam_role" "ec2" {
  name = "medmate-platform-ec2"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ecr_read" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy" "ec2" {
  name = "medmate-platform-ec2"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ListApplicationPrefixes"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.repo.arn
        Condition = {
          StringLike = {
            "s3:prefix" = ["app-uploads/*", "platform-scripts/*"]
          }
        }
      },
      {
        Sid      = "ReadPlatformScripts"
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "${aws_s3_bucket.repo.arn}/platform-scripts/*"
      },
      {
        Sid      = "WriteApplicationUploads"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.repo.arn}/app-uploads/*"
      },
      {
        Sid      = "ReadPlatformParameters"
        Effect   = "Allow"
        Action   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:PutParameter"]
        Resource = "arn:aws:ssm:${var.aws_region}:${local.account_id}:parameter/medmate-repo/*"
      },
      {
        Sid      = "DecryptSsmParameters"
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = data.aws_kms_alias.ssm.target_key_arn
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ssm.${var.aws_region}.amazonaws.com"
          }
        }
      },
      {
        Sid    = "ApplicationSecrets"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:CreateSecret",
          "secretsmanager:PutSecretValue",
          "secretsmanager:TagResource",
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.aws_region}:${local.account_id}:secret:medmate/*",
          "arn:aws:secretsmanager:${var.aws_region}:${local.account_id}:secret:rds!*",
        ]
      },
    ]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "medmate-platform-ec2"
  role = aws_iam_role.ec2.name
}

resource "aws_instance" "platform" {
  ami                         = data.aws_ssm_parameter.al2023.value
  instance_type               = var.ec2_instance_type
  subnet_id                   = local.subnet_id
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  user_data_replace_on_change = true

  user_data = templatefile("${path.module}/user-data.sh.tftpl", {
    region = var.aws_region
    bucket = aws_s3_bucket.repo.bucket
  })

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  depends_on = [
    aws_iam_role_policy.ec2,
    aws_iam_role_policy_attachment.ssm,
    aws_iam_role_policy_attachment.ecr_read,
    aws_s3_object.scripts,
  ]

  tags = {
    Name = "medmate-platform"
  }
}

resource "aws_eip" "platform" {
  domain = "vpc"

  tags = {
    Name = "medmate-platform"
  }
}

resource "aws_eip_association" "platform" {
  instance_id   = aws_instance.platform.id
  allocation_id = aws_eip.platform.id
}

resource "aws_db_subnet_group" "postgres" {
  name       = "medmate-postgres"
  subnet_ids = data.aws_subnets.default.ids
}

resource "aws_db_instance" "postgres" {
  identifier                  = "medmate-postgres"
  engine                      = "postgres"
  engine_version              = "16.15"
  instance_class              = "db.t4g.micro"
  allocated_storage           = 20
  storage_type                = "gp3"
  storage_encrypted           = true
  username                    = "medmate"
  manage_master_user_password = true
  db_subnet_group_name        = aws_db_subnet_group.postgres.name
  vpc_security_group_ids      = [aws_security_group.rds.id]
  publicly_accessible         = false
  multi_az                    = false
  backup_retention_period     = 7
  deletion_protection         = true
  skip_final_snapshot         = false
  final_snapshot_identifier   = "medmate-postgres-final"
  auto_minor_version_upgrade  = true
  apply_immediately           = true
  copy_tags_to_snapshot       = true

  tags = {
    Name = "medmate-postgres"
  }
}

locals {
  common_parameters = {
    bucket                     = aws_s3_bucket.repo.bucket
    static_prefix              = "static-sites"
    uploads_prefix             = "app-uploads"
    region                     = var.aws_region
    ec2_instance_id            = aws_instance.platform.id
    eip                        = aws_eip.platform.public_ip
    rds_endpoint               = aws_db_instance.postgres.address
    rds_port                   = tostring(aws_db_instance.postgres.port)
    rds_secret_arn             = aws_db_instance.postgres.master_user_secret[0].secret_arn
    "zone/nammamedmate.com"    = data.aws_route53_zone.nammamedmate.zone_id
    "zone/medmatepharmacy.com" = data.aws_route53_zone.medmatepharmacy.zone_id
  }
}

resource "aws_ssm_parameter" "common" {
  for_each = local.common_parameters
  name     = "/medmate-repo/common/${each.key}"
  type     = "String"
  value    = each.value
}

resource "terraform_data" "instance_ready" {
  # depends_on does not re-run this check when the instance is replaced.
  triggers_replace = [
    aws_instance.platform.id,
  ]

  depends_on = [
    aws_instance.platform,
    aws_eip_association.platform,
    aws_s3_object.scripts,
    aws_ssm_parameter.common,
  ]

  provisioner "local-exec" {
    command = "bash \"${path.module}/../../../scripts/wait-instance.sh\" ${aws_instance.platform.id} ${var.aws_region}"
  }
}
