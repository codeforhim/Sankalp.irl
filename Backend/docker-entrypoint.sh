#!/bin/sh
set -e

echo "Running database schema migration for priority scoring columns..."
node scripts/update_schema.js || echo "Schema migration skipped (columns may already exist)."

echo "Backfilling priority scores for existing complaints..."
node scripts/backfill_priorities.js || echo "Backfill skipped or completed."

echo "Starting backend server..."
exec npx nodemon -L server.js
