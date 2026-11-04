# todo-server

`https://api.todo.medmatepharmacy.com` is a Java 21 Spring Boot API. It runs in Docker on the shared EC2 instance, with a 768 MB limit, and listens on port 8080.

Endpoints:

- `GET /health`
- `GET /api/todos`
- `POST /api/todos` as multipart with `title` and an optional `file`
- `PATCH /api/todos/{id}` with `{ "completed": true }`
- `DELETE /api/todos/{id}`
- `GET /api/todos/{id}/attachment` redirects to a five-minute S3 URL

Rows are stored in the shared Postgres database `todo`. Files are stored at `s3://medmate-repo/app-uploads/todo-server/`. The container has no data volume. Browser calls are allowed from `https://todo.medmatepharmacy.com`.

Infrastructure for the repository, DNS record, and database is `packages/infra/todo-server`.
