#!/bin/bash

docker compose build
docker compose push

docker stack deploy --compose-file docker-compose.yml ai-escape-room

int_handler()
{
    echo "Interrupted."
    docker stack rm ai-escape-room
    # Kill the parent process of the script.
    kill $PPID
    exit 1
}
trap 'int_handler' INT

docker service logs -f ai-escape-room_escape-room

# We never reach this part.
exit 0
