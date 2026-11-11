# pharmacy

`https://pharmacy.nammamedmate.com` is the Namma MedMate pharmacy console. It is a Vite React application. CloudFront serves `index.html` for client-side routes such as `/pos` and `/inventory`.

The console calls `https://api.nammamedmate.com`. During local development, Vite proxies `/api` to medmate-server on port 8080, so the browser stays on one origin. That API currently exposes actuator health only.

Files are published to `s3://medmate-repo/static-sites/pharmacy/`. The site does not use Postgres or the uploads prefix.

Infrastructure for the certificate, distribution, and DNS alias is `packages/infra/pharmacy`.
