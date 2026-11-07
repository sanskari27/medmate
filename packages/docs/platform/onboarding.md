# Onboard an application

1. Add `packages/apps/<name>` with source and `project.yaml`. The directory name and `name` must match. `kind` is `react`, `next`, `node`, or `java`.
2. Request hosts only inside `nammamedmate.com` or `medmatepharmacy.com`. Apex names and subdomains are both allowed. The platform creates the records. It does not create a hosted zone.
3. Add `packages/docs/<name>` from `packages/docs/_template`.
4. Add `packages/infra/<name>` that reads `project.yaml` and calls `modules/static-site` or `modules/app-service`. Do not put Terraform, CDK, Pulumi, or CloudFormation in the application directory.
5. Apply that stack, then run `python3 scripts/deploy_app.py <name>` or push the application to `main`.

After `packages/infra/<name>` exists, `<name>` is a scope for `.github/workflows/ssm-parameter.yml`. The workflow reads scopes from the repo on each run, so leave that workflow file unchanged. Until that infra directory exists, `<name>` is not a scope.

A static site receives a CloudFront distribution whose origin path is `/static-sites/<name>`. A container receives an ECR repository, an A record to the shared Elastic IP, and, when requested, a database on the shared Postgres instance.
