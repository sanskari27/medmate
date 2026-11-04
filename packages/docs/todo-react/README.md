# todo-react

`https://todo.medmatepharmacy.com` is a Vite React page. It lists todos, adds one, marks one complete, deletes one, and can attach a file.

The API address is `https://api.todo.medmatepharmacy.com`, baked in as `VITE_API_URL` at build time. The page is published to `s3://medmate-repo/static-sites/todo-react/` and served by CloudFront. It does not use Postgres or the uploads prefix.

Infrastructure for the distribution and the DNS alias is `packages/infra/todo-react`.
