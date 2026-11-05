# Deployment

`packages/apps/<name>/project.yaml` is the deploy contract. `scripts/validate_projects.py` checks every application. `scripts/deploy_app.py <name>` performs the publish used by `.github/workflows/deploy.yml`.

React:

1. Export `build.env`.
2. Run `build.install`, then `build.command`.
3. Sync `build.output` to `s3://medmate-repo/static-sites/<name>/`.
4. Invalidate the CloudFront distribution in `/medmate-repo/<name>/distribution_id`.

`quality` in `project.yaml` chooses the gates that must pass before that application is published. Each key is `true`. Leaving `quality` out publishes the application without those checks. React and Next.js accept `typecheck`, `lint`, `format`, and `test`. Java accepts `compile` (`mvn -B -DskipTests compile`), `test` (`mvn -B test`), and `verify` (`mvn -B verify`). `.github/workflows/quality.yml` runs the selected gates as a matrix and records `quality/<app>/<gate>` on the commit. Deploy publishes an application only after each of its gates has succeeded.

Next.js and Java:

1. Build the Dockerfile for `linux/amd64` and push it to the application's ECR repository.
2. Ask the shared instance, through SSM, to pull that image and restart only that container.
3. Caddy routes each hostname in `project.yaml` to the container. Certificates are issued on the instance after DNS points at the Elastic IP.

Defaults when a block is omitted: npm, `npm ci`, `npm run build`, output `dist`, health path `/`, 512 MB, 0.5 CPU, database off, uploads off. Next.js listens on port 3000 and Java on port 8080 unless `runtime.port` is set.

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
terraform -chdir=packages/infra/todo-react init -backend-config=backend.hcl
terraform -chdir=packages/infra/todo-react apply
terraform -chdir=packages/infra/todo-server init -backend-config=backend.hcl
terraform -chdir=packages/infra/todo-server apply
python3 scripts/deploy_app.py todo-server
python3 scripts/deploy_app.py todo-react
```

After the GitHub repository exists, apply the platform with `github_repository` set to `owner/name` and the owner and repository IDs from GitHub. Actions tokens use the immutable subject `repo:owner@id/name@id`. Store the role outputs:

```bash
gh variable set AWS_DEPLOY_ROLE_ARN --body "<deploy_role_arn>"
gh variable set AWS_INFRA_ROLE_ARN --body "<infra_role_arn>"
```

`.github/workflows/infra.yml` plans on pull requests and applies on `main`. `.github/workflows/deploy.yml` publishes changed applications after that Infra run has finished. An app-only push deploys immediately unless an Infra run is still applying.
