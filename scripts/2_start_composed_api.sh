#!/bin/bash
export API_PORT=8080
export PG_PORT=5432
export DOCKER_API_PORT=$API_PORT:
export DOCKER_PG_PORT=$PG_PORT:
API_IMAGE_TAG="permitservice2:latest" APP_CONF_PATH="./conf" APP_ENV='local' docker-compose up