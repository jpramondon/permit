#!/bin/bash
docker run -it -e APP_CONF_PATH="./conf" -e APP_ENV='local' --rm -p8080:8080 --entrypoint "/bin/bash" gearedminds/permit:latest