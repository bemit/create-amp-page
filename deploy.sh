#!/bin/bash

echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >.npmrc

echo "Token length: ${#NPM_TOKEN}"

# npm ping

npm publish build

rm .npmrc
