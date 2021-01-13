#!/bin/bash
docker run -d --rm -e POSTGRES_USER=permit -e POSTGRES_PASSWORD=permit -e POSTGRES_DB=permit -p 5432:5432 --name permit_pg_local postgres:12