#!/bin/bash
# Hand Terraform fresh credentials from the local AWS CLI login.
unset AWS_CONFIG_FILE AWS_PROFILE AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_CREDENTIAL_EXPIRATION
exec aws configure export-credentials --format process
