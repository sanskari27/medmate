# admin

`https://admin.nammamedmate.com` is the platform-staff shell. It is a separate app from dispensary.

Local development runs on port 3205 (`make admin`). Vite proxies `/auth`, `/pharmacy-applications`, `/pharmacies`, and `/pharmacy-owners` to medmate-server on port 8080 and `/sms-mock` to the SMS mock on port 8090. Start those with `make api` and `make sms-mock`.

Login offers one choice per role: Platform admin, Compliance, Finance, Sales, and Support. Platform admin sends `accountType: "admin"`. The other four send `accountType: "staff"`, and the person must pick a subtype they hold. The sidebar role is that choice, and it stays across refresh. Reviews stays visible when the account is a platform admin or the subtypes include compliance, even if they signed in as Finance, Sales, or Support. Finance, sales, and support who open `/reviews` go to `/dashboard`. Pharmacies lists every pharmacy owner. The signed-out screen uses the same layout as dispensary. The business-type cards and business-name field stay on screen and are not sent. In dev, the dashed OTP box shows the latest code the SMS mock recorded for that phone. The signed-in home is an empty shell. Reviews lists applications waiting for compliance or final review.

The site is a static Vite build. It does not use Postgres or the uploads prefix. Infrastructure is `packages/infra/admin`. Terraform is applied by the Infra workflow after merge, not during app setup.
