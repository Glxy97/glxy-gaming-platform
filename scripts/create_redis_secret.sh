#!/bin/bash

# Get the Redis password from the existing secret
REDIS_PASSWORD=$(docker secret inspect redis_password --format '{{.Spec.Data}}' | base64 -d)

# Create the correct Redis URL with the proper service name
echo "redis://:$REDIS_PASSWORD@glxy_stack_redis:6379" > /tmp/redis_url.txt

# Create a new secret with a different name
docker secret create redis_url_new /tmp/redis_url.txt

# Remove the temporary file
rm /tmp/redis_url.txt

echo "New redis_url_new secret created with correct URL"