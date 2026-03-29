#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations using Alembic
# Note: If you don't use alembic for migrations, you can skip this or add your custom migration script.
if [ -f "alembic.ini" ]; then
  echo "Running database migrations..."
  alembic upgrade head
else
  echo "No alembic.ini found, skipping migrations."
fi
