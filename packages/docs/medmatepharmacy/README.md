# medmatepharmacy

`https://medmatepharmacy.com` and `https://www.medmatepharmacy.com` are the public MedMate pharmacy website. It is a Vite React site: every page is prerendered to HTML, and CloudFront rewrites extensionless paths to those files.

The customer app address is `https://medmatepharmacy.com`, baked in as `VITE_APP_URL`. Waitlist sign-ups go to `https://api.nammamedmate.com`. Consultation requests go to `https://dispensary.nammamedmate.com`. Contact and pharmacy-partner forms post to `POST /api/v1/leads` on that same API, with `site` `medmatepharmacy`.

Files are published to `s3://medmate-repo/static-sites/medmatepharmacy/`. The site does not use Postgres or the uploads prefix.

Infrastructure for the certificate, distribution, and DNS aliases is `packages/infra/medmatepharmacy`.
