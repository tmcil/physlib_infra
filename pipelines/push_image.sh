#!/bin/bash

if [ -z "$VERSION_TAG" ]; then
    echo "Error: VERSION_TAG is not set"
    exit 1
fi

docker tag backend:${VERSION_TAG} thomasm012/backend:${VERSION_TAG}
docker push thomasm012/backend:${VERSION_TAG}