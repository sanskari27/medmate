# Platform

The platform runs in `ap-south-1`.

- One EC2 instance, `t3.small` by default, runs Docker and Caddy. Change `ec2_instance_type` in `packages/infra/platform` and apply to move to a larger size. The Elastic IP stays with the instance. Containers do not keep user files on the instance disk.
- One Postgres instance, `db.t4g.micro`, is private to that EC2 security group. The master password is stored by RDS in Secrets Manager. Each application that opts in gets its own database and user.
- The bucket `medmate-repo` holds static sites under `static-sites/<app-name>/` and uploads under `app-uploads/<app-name>/`. CloudFront can read only `static-sites/*`. The instance role can write only `app-uploads/*`.
- Terraform state is in a separate private bucket, `medmate-tfstate-<account-id>`, with a DynamoDB lock table.
- Shared values are published under `/medmate-repo/common/`. Each application gets `/medmate-repo/<app-name>/`.

`nammamedmate.com` and `medmatepharmacy.com` are existing public hosted zones. Terraform reads them and creates only the records an application requests.

GitHub Actions assumes a deploy role for application publishes and an infra role for Terraform. Those roles are created when `github_repository` is set, and they trust the account's existing GitHub Actions identity provider. Until then, apply and deploy from a machine that already has AWS credentials.
