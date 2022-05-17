#!/usr/bin/env bash
set -x
set -e

ROOT_DIR="$(pwd)"

OUTPUT_DIR="$(pwd)/dist"

cd $ROOT_DIR/lib

zip -q -r $OUTPUT_DIR/function.zip .