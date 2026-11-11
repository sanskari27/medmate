# 0005. Pharmacy document storage

Status: accepted

## Context

Pharmacy verification stores licence images and PDFs. The platform bucket `medmate-repo` already blocks public access. The previous service used `app-uploads/server-core/`. This process does not read that prefix. `project.yaml` left uploads disabled.

## Decision

- `resources.uploads.enabled` is true. The prefix is `app-uploads/medmate-server`.
- Pharmacy objects live at `app-uploads/medmate-server/pharmacy-documents/{pharmacyId}/{slot}`.
- Production writes them with the AWS SDK when `APP_UPLOADS_BUCKET` is set. The bucket stays private. Downloads go through an authorized API route.
- Local development and tests use an in-memory store so the suite does not need AWS credentials or the old prefix.
- Resend and the admin bootstrap token are SSM parameters under `/medmate-repo/medmate-server/`. Runtime does not read `/medmate-repo/server-core/`.

## Consequences

- Deploy writes `APP_UPLOADS_BUCKET` and `APP_UPLOADS_PREFIX` when uploads are enabled.
- A review response may also include a 15-minute presigned URL. See [0006](0006-presigned-pharmacy-document-links.md).
- An operator copies the Resend key to `/medmate-repo/medmate-server/resend_api_key` with the existing SSM workflow. Cutover deletes the server-core parameter.
- Losing the in-memory store on a local restart drops local documents. Production objects remain in S3.
