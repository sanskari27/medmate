# nammamedmate

`https://nammamedmate.com` and `https://www.nammamedmate.com` are the Namma MedMate marketing site. It is a Vite React site: every page is prerendered to HTML, and CloudFront rewrites extensionless paths to those files. Canonical links use `https://www.nammamedmate.com`.

Demo requests, pharmacy early-access signups, and contact messages post to `POST https://api.nammamedmate.com/api/v1/leads`. That API is not in this repository. A later server will store these requests for the admin panel. Until it exists, the form shows its error state when the request fails.

## Lead payload

```json
{
  "type": "demo | early-access | contact",
  "name": "",
  "phone": "",
  "email": "",
  "pharmacyName": "",
  "cityPincode": "",
  "preferredTime": "",
  "monthlySales": "",
  "subject": "",
  "message": "",
  "source": "",
  "notes": "",
  "companyWebsite": ""
}
```

`type` is `demo` for the demo dialog, `early-access` for the pharmacy-owner form, and `contact` for the contact page. `companyWebsite` is a honeypot. The browser does not send the request when that field is filled.

Files are published to `s3://medmate-repo/static-sites/nammamedmate/`. The site does not use Postgres or the uploads prefix.

Infrastructure for the certificate, distribution, and DNS aliases is `packages/infra/nammamedmate`. Do not apply that stack while the previous landing CloudFront distribution still owns `nammamedmate.com` and `www.nammamedmate.com`. Release those aliases first, then apply this stack and deploy.
