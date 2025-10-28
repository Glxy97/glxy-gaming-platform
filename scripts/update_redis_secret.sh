#!/bin/bash

# Get the Redis password from the existing secret
REDIS_PASSWORD=$(docker secret inspect redis_password --format '{{.Spec.Data}}' | base64 -d)

# Create the correct Redis URL with the proper service name
echo "redis://:$REDIS_PASSWORD@glxy_stack_redis:6379" | docker secret create redis_url_fixed -

# Remove the old redis_url secret
docker secret rm redis_url

# Rename the new secret to redis_url
docker secret rm redis_url_fixed