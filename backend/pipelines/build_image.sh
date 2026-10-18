#!/bin/bash

if [ -z "$VERSION_TAG" ]; then
    echo "Error: VERSION_TAG is not set"
    exit 1
fi

docker build -t backend:${VERSION_TAG} .