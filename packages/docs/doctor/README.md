# Doctor portal

Hostname: doctor.nammamedmate.com

What it does: The clinic dashboard for a doctor's practice. Staff sign in with a
mobile number, a one-time code and a personal PIN, and each role lands on the
screen its work starts from: a doctor on their own patients, a nurse on the
patients needing attention, the front desk on who is waiting and what is owed,
and the clinic admin on the clinic. It reads the clinic's patients through the
clinic API and never holds a clinical record of its own.

Where its records are stored: Nowhere. The portal keeps no patient data. It
reads the clinic API, which reads the clinic's own database on the shared
Postgres instance. The only state it stores is the session, in the browser's
storage, and that holds an access token and a refresh token.

Where its files are stored: `packages/apps/doctor` in this repository. The
built site is published to the `static-sites/doctor` prefix of the shared S3
bucket and served through CloudFront.

How it is deployed: A static site. `packages/infra/doctor` calls the shared
`modules/static-site` module, which builds the app and publishes it to S3
behind a CloudFront distribution. The app is built with Vite; the client holds
no secrets, and `VITE_API_BASE_URL` points it at the clinic API.

Locally: `make doctor-app` serves it on http://127.0.0.1:3206, proxying
`/auth` to medmate-server on :8080, `/sms-mock` to :8090 and `/clinic-api` to
the clinic API on :8091. A local run sends the same one-time code every time,
`12345`, so a developer does not have to read it out of the SMS mock; the code
is shown on the code screen as well. The clinic's demo accounts are
`9845012345` (owner), `9886244120` (nurse), `9900122331` (front desk),
`9986041277` (doctor) and `9876500011` (receptionist, no grants). An account
that has no PIN yet is asked to choose one the first time it signs in.
