#!/bin/bash
set -e

echo "Running migrations (30s timeout)..."
timeout 30 python manage.py migrate --noinput || {
  echo "WARNING: migrate failed or timed out — starting server anyway"
}

echo "Loading demo data (if fixtures exist)..."
timeout 15 python manage.py loaddata fixtures/demo_data.json 2>/dev/null || echo "No demo data to load or already loaded."

echo "Starting gunicorn on port ${PORT:-8000}..."
exec gunicorn fintrack.wsgi:application --bind "0.0.0.0:${PORT:-8000}" --workers 2
