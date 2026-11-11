# 0006. Presigned pharmacy document links

Status: accepted

## Context

Compliance and admin read each pharmacy document from the application detail. [0005](0005-pharmacy-document-storage.md) keeps the bucket private and serves bytes through an authorized route. A browser cannot attach that session to a stored-file URL, so the detail response needs a link that opens the object.

## Decision

- Each document in `GET /pharmacy-applications/{id}` includes `url`.
- When `APP_UPLOADS_BUCKET` is set, `url` is a presigned S3 GET for that object. It lasts 15 minutes. The bucket stays private.
- When the in-memory store is active, `url` is `/pharmacies/{pharmacyId}/documents/{slot}`.
- `GET /pharmacies/{pharmacyId}/documents/{slot}` still returns the bytes to an authorized caller.

## Consequences

- Anyone who has the presigned URL can fetch that object until it expires.
- The response does not include the object key as its own field.
- Local and test runs do not need AWS credentials to build a document link.
