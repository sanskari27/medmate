# Data rules

Containers are stateless. The deploy script refuses to mount host volumes into an application container.

- Records belong in the shared Postgres instance.
- Files supplied by a user belong in `s3://medmate-repo/app-uploads/<app-name>/`.
- A React site cannot request a database or an uploads prefix, because it has no server.
- A React publish goes to `s3://medmate-repo/static-sites/<app-name>/`.
- Database passwords and the RDS master secret are not committed. The instance reads them at container start and writes an env file under `/opt/medmate/env` for that process. That file is platform credentials, not user content.

Replacing the EC2 instance does not move user data. The Elastic IP, RDS instance, and bucket remain.
