# medicine_data

The Node medicine-data process, its host, and its Terraform stack are removed.

The Postgres database `medicine_data` remains on the shared instance. medmate-server opens it through the secret `medmate/medicine-data/database`. The role is `medicine_data_user`. Catalog tables and migrations live in `medmate-server-catalog`.
