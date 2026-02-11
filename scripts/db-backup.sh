#!/bin/bash
set -euo pipefail

ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="medix_${ENVIRONMENT}_${TIMESTAMP}.sql.gz"
S3_BUCKET="medix-${ENVIRONMENT}-backups"

echo "📦 Starting database backup for ${ENVIRONMENT}..."

# Get RDS endpoint from terraform output
DB_HOST=$(cd infra/terraform && terraform output -raw rds_endpoint 2>/dev/null || echo "localhost")
DB_NAME="medix"
DB_USER="medix_admin"

# Use pg_dump with compression
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --verbose \
  | gzip > "/tmp/${BACKUP_FILE}"

echo "📤 Uploading to S3..."
aws s3 cp "/tmp/${BACKUP_FILE}" "s3://${S3_BUCKET}/backups/${BACKUP_FILE}" \
  --sse aws:kms \
  --storage-class STANDARD_IA

# Cleanup local
rm -f "/tmp/${BACKUP_FILE}"

# Verify
aws s3 ls "s3://${S3_BUCKET}/backups/${BACKUP_FILE}"

echo "✅ Backup complete: ${BACKUP_FILE}"
echo ""

# Retention: delete backups older than 30 days
echo "🧹 Cleaning old backups..."
aws s3 ls "s3://${S3_BUCKET}/backups/" | while read -r line; do
  CREATE_DATE=$(echo "$line" | awk '{print $1}')
  FILE_NAME=$(echo "$line" | awk '{print $4}')
  if [[ -n "$FILE_NAME" ]]; then
    FILE_AGE=$(( ($(date +%s) - $(date -d "$CREATE_DATE" +%s)) / 86400 ))
    if [[ $FILE_AGE -gt 30 ]]; then
      echo "  Deleting old backup: $FILE_NAME ($FILE_AGE days old)"
      aws s3 rm "s3://${S3_BUCKET}/backups/${FILE_NAME}"
    fi
  fi
done

echo "✅ Backup and cleanup complete!"