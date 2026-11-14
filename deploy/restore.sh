#!/usr/bin/env bash
# ==============================================================================
# SMART CLINIC OS — DISASTER RECOVERY & RESTORATION SCRIPT
# Restores PostgreSQL database and clinical storage from backup archive
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <path_to_dump_file> [target_db_name]"
    echo "Example: $0 /var/backups/smartclinic/database/smartclinic_db_20261113.dump smart_clinic_os_restore"
    exit 1
fi

DUMP_FILE="$1"
TARGET_DB="${2:-smart_clinic_os}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

if [ ! -f "${DUMP_FILE}" ]; then
    echo "ERROR: Backup file ${DUMP_FILE} does not exist!"
    exit 1
fi

echo "=== Smart Clinic OS Disaster Recovery Restoration ==="
echo "Restoring from: ${DUMP_FILE}"
echo "Target Database: ${TARGET_DB} on ${DB_HOST}:${DB_PORT}"

# Terminate active connections to target database if exists
echo "Disconnecting active users on ${TARGET_DB}..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${TARGET_DB}' AND pid <> pg_backend_pid();" || true

# Recreate target database
echo "Recreating clean database ${TARGET_DB}..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${TARGET_DB};"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${TARGET_DB};"

# Restore database schema and data
echo "Restoring schema and records with pg_restore..."
pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TARGET_DB}" -v "${DUMP_FILE}"

echo "Validating table count..."
TABLE_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TARGET_DB}" -t -c \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "[OK] Restored ${TABLE_COUNT} tables into ${TARGET_DB}."

echo "=== Disaster Recovery Restoration Successfully Verified ==="

