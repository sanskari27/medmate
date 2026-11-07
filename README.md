# Medmate

Applications live in `packages/apps`. Shared infrastructure lives in `packages/infra`. Notes for each application live in `packages/docs`.

An application ships with a `project.yaml` file and does not define its own AWS infrastructure. React sites are published to `s3://medmate-repo/static-sites/<app-name>/` and served by CloudFront. Next.js, Node, and Java applications run as containers on one shared EC2 instance. Todos and other records go to the shared Postgres instance. Uploaded files go to `s3://medmate-repo/app-uploads/<app-name>/`.

DNS records are created only in the existing zones `nammamedmate.com` and `medmatepharmacy.com`.

The sample applications are:

- [todo-react](packages/apps/todo-react) at `https://todo.medmatepharmacy.com`
- [todo-server](packages/apps/todo-server) at `https://api.todo.medmatepharmacy.com`

Platform operations are described in [packages/docs/platform](packages/docs/platform/architecture.md).
