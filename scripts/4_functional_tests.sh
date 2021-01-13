#!/usr/bin/env bash

# Function to show help
show_help() {
cat << EOF
Usage: ${0##*/} [-hk] [-t TAG]

Run tests having given TAG, or all tests if no TAG given.

    -h              display this help and exit.
    -k              keep alive & do not clear database.
                    This should be used with -t (or you will fail a lot of tests)
    -t TAG          run only tests tagged TAG.
EOF
}

docker-compose down

# Initialize our own variables
tag=""
keep=0
while getopts "hkt:" opt; do
    case $opt in
        t)
            tag=$OPTARG
            ;;
        k)
            keep=1
            ;;
        *)
            show_help
            exit 0
            ;;
    esac
done
shift $((OPTIND-1))


if [ $tag ]; then
    tagOption="--tags @$tag"
fi

runningOnPgPort=$(lsof -i:5432 | grep LISTEN | wc -l)
if [[ $runningOnPgPort -ne 0 ]]; then
    echo "ERROR: Port 5432 is already used by the following process:"
    echo "$(lsof -i:5432 | grep LISTEN)"
    exit 1
fi
runningOnApiPort=$(lsof -i:8080 | grep LISTEN | wc -l)
if [[ $runningOnApiPort -ne 0 ]]; then
    echo "ERROR: Port 8080 is already used by the following process:"
    echo "$(lsof -i:8080 | grep LISTEN)"
    exit 1
fi

npm run build
npm run docker:build
API_IMAGE_TAG="permitservice2:latest" APP_CONF_PATH="./conf" APP_ENV='test' docker-compose up -d
#bash ./scripts/22_start_composed_api_daemon.sh

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

# docker logs permit_api_1

KEEP=$keep API_PORT=$DOCKER_API_PORT PG_PORT=$DOCKER_PG_PORT npm run test:functional -- $tagOption