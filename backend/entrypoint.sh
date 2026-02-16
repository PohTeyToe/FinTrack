#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Loading demo data (if fixtures exist)..."
python manage.py loaddata fixtures/demo_data.json 2>/dev/null || echo "No demo data to load or already loaded."

echo "Starting gunicorn on port ${PORT:-8000}..."
exec gunicorn fintrack.wsgi:application --bind "0.0.0.0:${PORT:-8000}" --workers 3
