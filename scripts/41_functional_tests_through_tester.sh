#!/bin/bash
# Starts functional tests using the tester image

# Stop any remaining composition
docker-compose down

# Stop any remaining tester waiting
docker rm -f permit_service2_tester

# Build project and Docker image
npm run build
npm run docker:build

# Start API composition
bash ./scripts/22_start_composed_api_daemon.sh

# Build tester image
npm run docker:build:tester

# Extract assigned Docker ports 
IFS=":" read host DOCKER_API_PORT <<< $(docker-compose port api 8080)
IFS=":" read host DOCKER_PG_PORT <<< $(docker-compose port postgres 5432)

# Wait for API to be up
HEALTH_URL="http://localhost:"$DOCKER_API_PORT"/_health"
echo $HEALTH_URL
until $(curl --output /dev/null --silent --head --fail $HEALTH_URL); do
    printf '.'
    sleep 5
done

# Start tester image
#API_PORT="${API_PORT:-8080}"
#PG_PORT="${PG_PORT:-5432}"
docker run -itd -e API_PORT=$DOCKER_API_PORT -e PG_PORT=$DOCKER_PG_PORT  -e APP_ENV='test' --network="host" --name permit_service2_tester permitservice2-test

# Have the tester image to execute tests
docker exec -ti permit_service2_tester sh -c "run-test"