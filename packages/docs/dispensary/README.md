# dispensary

`https://dispensary.nammamedmate.com` is the structured replacement for the pharmacy console. The pharmacy app and its infrastructure stay in the repo for comparison.

Local development runs on port 3204 (`make dispensary`). Vite proxies `/auth` to medmate-server on port 8080 and `/sms-mock` to the SMS mock on port 8090. Start those with `make api` and `make sms-mock`.

Login sends `accountType: "pharmacy"`. In dev, the dashed OTP box shows the latest code the SMS mock recorded for that phone. A pharmacy owner whose account is disabled lands on `/account-restricted`, with the heading "Your account is restricted." and a Contact us link to `mailto:support@nammamedmate.com`, ahead of PIN setup, setup, application status, and the dashboard. Pharmacy staff of that owner stay on the login screen, which shows "This pharmacy is restricted." The signed-in home, Settings, and Reports are empty shells. Manage Users is the first Management item for an approved pharmacy owner.

The site is a static Vite build. It does not use Postgres or the uploads prefix. Infrastructure is `packages/infra/dispensary`. Terraform is applied by the Infra workflow after merge, not during app setup.
