#!/bin/bash

export PGPASSWORD="YWRtaW4="

# Start a fresh Docker container
docker rm -f postgres-db 2>/dev/null || true
docker run --name postgres-db \
    -e POSTGRES_USER=admin \
    -e POSTGRES_DB=postgres-db \
    -e POSTGRES_PASSWORD=YWRtaW4= \
    -p 5433:5432 -d postgres:18 || exit 1

# Wait for PostgreSQL to become ready (up to 60 seconds)
echo "Waiting for PostgreSQL to start..."
for i in {1..30}; do
    if pg_isready -h localhost -p 5433 -U admin -d postgres-db; then
        break
    fi

    if [ "$i" -eq 30 ]; then
        echo "PostgreSQL failed to become ready. Container logs:"
        docker logs postgres-db
        exit 1
    fi

    sleep 2
done

# Import the current database state
psql -v ON_ERROR_STOP=1 \
    -h localhost -p 5433 -U admin -d postgres-db \
    -f pgdump.sql || exit 1

# Stamp the migrations
alembic stamp head

## Can be done manually!!!!!!!!!!!!!!!!!!!
# Generate the migration
# alembic revision --autogenerate -m "$MIGRATION_MESSAGE" || exit 1
# Apply the migration
# alembic upgrade head || exit 1

unset PGPASSWORD
