#!/bin/bash
# This script provisions Aiven resources for functional test purposes
# Usage: avn-test-resources.sh -f <config-path> -c <command> -h <hash> -t <token>
# Where:
#   - config-path: path to the json configuration file. If omitted, defaults to '.avn-test-resources.json' in the current folder.
#   - command: name of the command to execute, from 'create' and 'delete', each creating or deleting Aiven resources respectively.
#   - hash: a hash string that helps generating unique resource names. Turns handy for concurrent builds. 
#        Can be omitted, in that case the name of the resource will not contain any hash.
#   - token: a valid Aiven token.

set -euo pipefail
IFS=$'\n\t'

echo "Gitlab CI/CD test resources provisioning"

CONF_FILE=".avn-test-resources.json"
COMMAND=""
HASH=""
AVN_TOKEN=""

####### Read command and flags #######

while getopts f:c:h:t: option; do
    case "${option}" in
    f) CONF_FILE=${OPTARG} ;;
    c) COMMAND=${OPTARG} ;;
    h) HASH=${OPTARG} ;;
    t) AVN_TOKEN=${OPTARG} ;;
    esac
done

####### Check command and flags #######

case "$COMMAND" in
create) COMMAND=create ;;
delete) COMMAND=delete ;;
*)
    echo "Unrecognized command '$COMMAND' or command not provided"
    exit 2
    ;;
esac

if [ ! -f "$CONF_FILE" ]; then
    echo "Configuration file '$CONF_FILE' does not exist"
    exit 1
fi

echo "Will be executing command $COMMAND using config file located at --> $CONF_FILE"

####### Service specific functions #######

FINAL_DB_NAME=""

# $1 -> project name
# $2 -> service name
_get_service_info() {
    BASE_URL="https://api.aiven.io/v1/project/<project>/service/<service_name>"
    GET_SERVICE_INFO_URL=$(echo ${BASE_URL/'<project>'/$1})
    GET_SERVICE_INFO_URL=$(echo ${BASE_URL/'<service_name>'/$2})
    RESPONSE=$(curl -v -H "Content-Type: application/json" -H "Authorization: aivenv1 ${AVN_TOKEN}" $GET_SERVICE_INFO_URL)
    echo $RESPONSE
}

# $1 -> database name
# $2 -> hash
_compute_db_name() {
    FINAL_DB_NAME=$1
    if [[ $1 =~ "HASH" ]]; then
        echo "DB - Use of hash in database name. Requires substitution"
        if [ -z "$HASH" ]; then
            echo "DB - No hash provided, cannot substitute."
            exit 1
        else
            # FINAL_HASH=$(echo $HASH | cut -c1-12)
            FINAL_DB_NAME=$(echo ${1/'${HASH}'/$2})
            echo "DB - Database name now sports hash in name: $FINAL_DB_NAME"
        fi
    else
        echo "DB - No need for hash substitution in database name"
    fi
}

# $1 -> project name
# $2 -> service name
# $3 -> database name
# $4 -> hash
_create_pg_database() {
    # create database
    _compute_db_name $3 $4
    BASE_URL="https://api.aiven.io/v1/project/<project>/service/<service_name>/db"
    AVN_URL=$(echo ${BASE_URL/'<project>'/$1})
    AVN_URL=$(echo ${AVN_URL/'<service_name>'/$2})
    echo "PG - '$FINAL_DB_NAME' has to be created in instance $2 for project $1"
    AVN_PAYLOAD="{\"database\":\"$FINAL_DB_NAME\"}"
    CURL_RESULT=$(curl -X POST -H "Content-Type: application/json" -H "Authorization: aivenv1 ${AVN_TOKEN}" -d "$AVN_PAYLOAD" $AVN_URL)
    MESSAGE=$(echo $CURL_RESULT | jq -r '.message')
    if [[ "created" != "$MESSAGE" ]]; then
        echo "PG - Creation of database $FINAL_DB_NAME was not successful: $MESSAGE"
        exit 1
    fi
}

# $1 -> project name
# $2 -> service name
# $3 -> database name
# $4 -> hash
_drop_pg_database() {
    _compute_db_name $3 $4
    BASE_URL="https://api.aiven.io/v1/project/<project>/service/<service_name>/db/<dbname>"
    AVN_URL=$(echo ${BASE_URL/'<project>'/$1})
    AVN_URL=$(echo ${AVN_URL/'<service_name>'/$2})
    AVN_URL=$(echo ${AVN_URL/'<dbname>'/$FINAL_DB_NAME})
    echo "PG - '$FINAL_DB_NAME' has to be deleted from instance $2 for project $1"
    CURL_RESULT=$(curl -X DELETE -H "Content-Type: application/json" -H "Authorization: aivenv1 ${AVN_TOKEN}" $AVN_URL)
    MESSAGE=$(echo $CURL_RESULT | jq -r '.message')
    if [[ "deleted" != "$MESSAGE" ]]; then
        echo "PG - Creation of database $FINAL_DB_NAME was not successful: $MESSAGE"
        exit 1
    fi
}

####### Actually read the configuration file and act accordingly #######
if ! [ -x "$(command -v jq)" ]; then
  echo 'Error: jq is not installed.' >&2
  exit 1
fi
for row in $(jq -c .resources[] $CONF_FILE); do
    RESOURCE_TYPE=$(echo $row | jq -r '.type')
    RESOURCE_NAME=$(echo $row | jq -r '.name')
    AVN_PROJET=$(echo $row | jq -r '.project')
    AVN_SERVICE=$(echo $row | jq -r '.service')
    case "${COMMAND}" in
    create)
        case "${RESOURCE_TYPE}" in
        postgresql)
            echo "Found Postgresql resource named '$RESOURCE_NAME'"
            DB_NAME=$(echo $row | jq -r '.database')
            _create_pg_database $AVN_PROJET $AVN_SERVICE $DB_NAME $HASH
            ;;
        *)
            echo "Unrecognized resource type"
            exit 2
            ;;
        esac
        ;;
    delete)
        case "${RESOURCE_TYPE}" in
        postgresql)
            echo "Found Postgresql resource named '$RESOURCE_NAME'"
            DB_NAME=$(echo $row | jq -r '.database')
            _drop_pg_database $AVN_PROJET $AVN_SERVICE $DB_NAME $HASH
            ;;
        *)
            echo "Unrecognized resource type"
            exit 2
            ;;
        esac
        ;;
    *)
        echo "Unrecognized command"
        exit 2
        ;;
    esac
done
