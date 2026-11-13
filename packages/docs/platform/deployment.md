# Deployment

`packages/apps/<name>/project.yaml` is the deploy contract. `scripts/validate_projects.py` checks every application. `scripts/deploy_app.py <name>` performs the publish used by `.github/workflows/deploy.yml`.

React:

1. Export `build.env`.
2. Run `build.install`, then `build.command`.
3. Sync `build.output` to `s3://medmate-repo/static-sites/<name>/`.
4. Invalidate the CloudFront distribution in `/medmate-repo/<name>/distribution_id`.

`quality` in `project.yaml` chooses the gates that must pass before that application is published. Each key is `true`. Leaving `quality` out publishes the application without those checks. React and Next.js accept `typecheck`, `lint`, `format`, and `test`. Java accepts `compile` (`mvn -B -DskipTests compile`), `test` (`mvn -B test`), and `verify` (`mvn -B verify`). `.github/workflows/quality.yml` runs those gates only for applications whose own files changed, and records `quality/<app>/<gate>`. Deploy reads those results. It does not compare the previous commit again. An application with no recorded results for that publish is published without waiting.

Next.js, Node, and Java:

1. Build the Dockerfile for `linux/amd64` and push it to the application's ECR repository.
2. Ask the shared instance, through SSM, to pull that image and restart only that container. When the application has a database, the instance first copies the current `ensure-database` script and runs it.
3. Caddy routes each hostname in `project.yaml` to the container. Certificates are issued on the instance after DNS points at the Elastic IP.

Defaults when a block is omitted: npm, `npm ci`, `npm run build`, output `dist`, health path `/`, 512 MB, 0.5 CPU, database off, uploads off. Next.js and Node listen on port 3000 and Java on port 8080 unless `runtime.port` is set.

If the AWS CLI is signed in with `aws login`, Terraform does not see that session on its own. Point it at `scripts/aws-export.sh`:

```bash
chmod +x scripts/aws-export.sh
cat > packages/infra/aws-login.config <<EOF
[default]
region = ap-south-1
credential_process = $(pwd)/scripts/aws-export.sh
EOF
export AWS_CONFIG_FILE="$(pwd)/packages/infra/aws-login.config"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
```

Apply infrastructure before the first deploy:

```bash
terraform -chdir=packages/infra/bootstrap init
terraform -chdir=packages/infra/bootstrap apply
terraform -chdir=packages/infra/platform init -backend-config=backend.hcl
terraform -chdir=packages/infra/platform apply
terraform -chdir=packages/infra/dispensary init -backend-config=backend.hcl
terraform -chdir=packages/infra/dispensary apply
terraform -chdir=packages/infra/medmate-server init -backend-config=backend.hcl
terraform -chdir=packages/infra/medmate-server apply
python3 scripts/deploy_app.py medmate-server
python3 scripts/deploy_app.py dispensary
```

After the GitHub repository exists, apply the platform with `github_repository` set to `owner/name` and the owner and repository IDs from GitHub. Actions tokens use the immutable subject `repo:owner@id/name@id`. Store the role outputs:

```bash
gh variable set AWS_DEPLOY_ROLE_ARN --body "<deploy_role_arn>"
gh variable set AWS_INFRA_ROLE_ARN --body "<infra_role_arn>"
```

`.github/workflows/infra.yml` plans on pull requests and applies on `main`. `.github/workflows/deploy.yml` publishes changed applications after that Infra run has finished. An app-only push deploys immediately unless an Infra run is still applying.

## SSM parameters

Run **SSM parameter** from the Actions tab (`.github/workflows/ssm-parameter.yml`, `workflow_dispatch`). The run assumes `AWS_INFRA_ROLE_ARN` and writes `/medmate-repo/<scope>/<name>`.

- `scope`: `common`, or an application name.
- `name`: one path segment of letters, numbers, `.`, `_`, or `-`.
- `type`: `String` or `SecureString`.
- `value`: the parameter value. The run page shows this input.

A rejected scope prints the scopes allowed for that checkout. `common` is always allowed. An application is allowed when `packages/apps/<name>/project.yaml` names that directory and `packages/infra/<name>` exists. Adding an application by the onboarding steps adds its scope on the next run.

A later Infra apply overwrites the value when Terraform already manages that name, such as `/medmate-repo/common/bucket` or `/medmate-repo/<name>/ecr_repository`. `SecureString` uses the AWS-managed `alias/aws/ssm` key. The platform instance and the deploy role can read it after the platform stack that grants `kms:Decrypt` has been applied.
