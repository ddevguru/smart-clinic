#!/usr/bin/env bash
# ==============================================================================
# SMART CLINIC OS — AUTOMATED PRODUCTION BACKUP SCRIPT
# Performs compressed, timestamped PostgreSQL dump & storage archive
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/smartclinic}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DB_NAME="${DB_NAME:-smart_clinic_os}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS=30

mkdir -p "${BACKUP_DIR}/database"
mkdir -p "${BACKUP_DIR}/storage"

echo "=== Starting Smart Clinic OS Automated Backup: ${TIMESTAMP} ==="

# 1. PostgreSQL Database Dump (Custom compressed format)
DB_BACKUP_FILE="${BACKUP_DIR}/database/smartclinic_db_${TIMESTAMP}.dump"
echo "Dumping database ${DB_NAME} to ${DB_BACKUP_FILE}..."
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -F c -b -v -f "${DB_BACKUP_FILE}" "${DB_NAME}"

# Verify backup file size is greater than 10KB
FILE_SIZE=$(stat -c%s "${DB_BACKUP_FILE}" 2>/dev/null || stat -f%z "${DB_BACKUP_FILE}")
if [ "${FILE_SIZE}" -lt 10240 ]; then
    echo "ERROR: Backup file ${DB_BACKUP_FILE} size (${FILE_SIZE} bytes) is suspiciously small!"
    exit 1
fi
echo "[OK] Database backup successful: ${FILE_SIZE} bytes."

# 2. Storage Directory Archive (Prescriptions, receipts, lab PDFs)
STORAGE_SRC="${STORAGE_SRC:-/app/server/storage}"
STORAGE_BACKUP_FILE="${BACKUP_DIR}/storage/smartclinic_storage_${TIMESTAMP}.tar.gz"
if [ -d "${STORAGE_SRC}" ]; then
    echo "Archiving storage files from ${STORAGE_SRC}..."
    tar -czf "${STORAGE_BACKUP_FILE}" -C "${STORAGE_SRC}" .
    echo "[OK] Storage backup successful: $(stat -c%s "${STORAGE_BACKUP_FILE}" 2>/dev/null || stat -f%z "${STORAGE_BACKUP_FILE}") bytes."
fi

# 3. Retention Policy Pruning: Delete backups older than 30 days
echo "Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}/database" -name "smartclinic_db_*.dump" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}/storage" -name "smartclinic_storage_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "=== Smart Clinic OS Backup Completed Successfully at $(date) ==="

