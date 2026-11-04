locals {
  github_owner = var.github_repository == "" ? "" : split("/", var.github_repository)[0]
  github_name  = var.github_repository == "" ? "" : split("/", var.github_repository)[1]
  github_subject = "repo:${local.github_owner}@${var.github_owner_id}/${local.github_name}@${var.github_repository_id}:*"
}

data "aws_iam_openid_connect_provider" "github" {
  count = var.github_repository == "" ? 0 : 1
  url   = "https://token.actions.githubusercontent.com"
}

data "aws_iam_policy_document" "github_trust" {
  count = var.github_repository == "" ? 0 : 1

  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github[0].arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [local.github_subject]
    }
  }
}

resource "aws_iam_role" "deploy" {
  count              = var.github_repository == "" ? 0 : 1
  name               = "medmate-gha-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_trust[0].json

  lifecycle {
    precondition {
      condition     = var.github_owner_id != "" && var.github_repository_id != ""
      error_message = "github_owner_id and github_repository_id are required. Actions uses an immutable subject of repo:owner@id/name@id."
    }
  }
}

resource "aws_iam_role_policy" "deploy" {
  count = var.github_repository == "" ? 0 : 1
  name  = "medmate-gha-deploy"
  role  = aws_iam_role.deploy[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ListStaticSites"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.repo.arn
        Condition = {
          StringLike = { "s3:prefix" = ["static-sites/*"] }
        }
      },
      {
        Sid      = "WriteStaticSites"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.repo.arn}/static-sites/*"
      },
      {
        Sid      = "InvalidatePlatformDistributions"
        Effect   = "Allow"
        Action   = ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation", "cloudfront:GetDistribution"]
        Resource = "arn:aws:cloudfront::${local.account_id}:distribution/*"
        Condition = {
          StringEquals = { "aws:ResourceTag/Project" = "medmate" }
        }
      },
      {
        Sid      = "PushApplicationImages"
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Sid    = "PushMedmateRepositories"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
        ]
        Resource = "arn:aws:ecr:${var.aws_region}:${local.account_id}:repository/medmate/*"
      },
      {
        Sid      = "ReadDeployParameters"
        Effect   = "Allow"
        Action   = ["ssm:GetParameter", "ssm:GetParameters"]
        Resource = "arn:aws:ssm:${var.aws_region}:${local.account_id}:parameter/medmate-repo/*"
      },
      {
        Sid    = "RestartContainers"
        Effect = "Allow"
        Action = ["ssm:SendCommand"]
        Resource = [
          "arn:aws:ec2:${var.aws_region}:${local.account_id}:instance/${aws_instance.platform.id}",
          "arn:aws:ssm:${var.aws_region}::document/AWS-RunShellScript",
        ]
      },
      {
        Sid      = "ReadCommandResult"
        Effect   = "Allow"
        Action   = ["ssm:GetCommandInvocation", "ssm:ListCommandInvocations"]
        Resource = "*"
      },
      {
        Sid    = "DenyInfrastructureChanges"
        Effect = "Deny"
        Action = [
          "ec2:RunInstances",
          "ec2:TerminateInstances",
          "rds:CreateDBInstance",
          "rds:DeleteDBInstance",
          "route53:CreateHostedZone",
          "route53:DeleteHostedZone",
          "s3:CreateBucket",
          "s3:DeleteBucket",
        ]
        Resource = "*"
      },
    ]
  })
}

resource "aws_iam_role" "infra" {
  count              = var.github_repository == "" ? 0 : 1
  name               = "medmate-gha-infra"
  assume_role_policy = data.aws_iam_policy_document.github_trust[0].json
}

resource "aws_iam_role_policy" "infra" {
  count = var.github_repository == "" ? 0 : 1
  name  = "medmate-gha-infra"
  role  = aws_iam_role.infra[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ManagePlatform"
        Effect = "Allow"
        Action = [
          "ec2:*",
          "rds:*",
          "s3:*",
          "dynamodb:*",
          "route53:*",
          "cloudfront:*",
          "acm:*",
          "ssm:*",
          "secretsmanager:*",
          "ecr:*",
          "logs:*",
          "iam:*",
          "kms:*",
          "sts:GetCallerIdentity",
        ]
        Resource = "*"
      },
      {
        Sid      = "DenyAccountChanges"
        Effect   = "Deny"
        Action   = ["organizations:*", "account:*"]
        Resource = "*"
      },
    ]
  })
}

resource "aws_ssm_parameter" "deploy_role_arn" {
  count = var.github_repository == "" ? 0 : 1
  name  = "/medmate-repo/common/deploy_role_arn"
  type  = "String"
  value = aws_iam_role.deploy[0].arn
}
