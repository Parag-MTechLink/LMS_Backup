#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations using Alembic
if [ -f "alembic.ini" ]; then
  echo "Running database migrations..."
  alembic upgrade head
else
  echo "No alembic.ini found, skipping migrations."
fi
