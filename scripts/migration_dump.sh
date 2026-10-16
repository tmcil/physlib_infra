#!/bin/bash

export PGPASSWORD="YWRtaW4="

# Dump the new database schema on top of existing pgdump
pg_dump -h localhost -p 5433 -U admin -d postgres-db \
    --no-owner --no-acl --schema-only -f pgdump.sql || exit 1

unset PGPASSWORD="YWRtaW4="