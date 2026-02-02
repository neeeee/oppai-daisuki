#!/usr/bin/env bash
set -euo pipefail

# === CONFIG ===
MONGO_URI="mongodb://localhost:27017"
BACKUP_ROOT="./dump"    # path to the folder containing DB subfolders (from mongodump)
TARGET_DB_SUFFIX="_dev" # suffix appended to restore DB (e.g. prod_db -> prod_db_dev)
# =================

# find all first-level DB directories inside the dump
DB_FOLDERS=("${BACKUP_ROOT}"/*)
if [ ${#DB_FOLDERS[@]} -eq 0 ]; then
  echo "❌ No database folders found under ${BACKUP_ROOT}"
  exit 1
fi

for DB_FOLDER in "${DB_FOLDERS[@]}"; do
  if [ ! -d "$DB_FOLDER" ]; then
    continue
  fi

  SRC_DB=$(basename "$DB_FOLDER")
  DEST_DB="${SRC_DB}${TARGET_DB_SUFFIX}"

  echo "---------------------------------------------"
  echo "🔹 Restoring database:"
  echo "    Source: ${SRC_DB}"
  echo "    Target: ${DEST_DB}"
  echo "    Path:   ${DB_FOLDER}"
  echo "---------------------------------------------"

  echo "🧹 Dropping existing dev database [${DEST_DB}]..."
  mongosh --quiet --eval "db.getSiblingDB('${DEST_DB}').dropDatabase()"

  echo "📦 Restoring collections..."
  mongorestore \
    --uri="${MONGO_URI}" \
    --db="${DEST_DB}" \
    --drop \
    "${DB_FOLDER}"

  echo "✅ Restore complete for ${DEST_DB}"
  echo
done

echo "🎉 All databases restored successfully!"
