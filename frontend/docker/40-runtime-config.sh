#!/bin/sh
# Runs at container start (nginx image entrypoint). Writes the backend URL from the
# API_BASE_URL environment variable into /config.js, so one image works in every environment.
set -eu
printf 'window.__LABLINK_CONFIG__ = { apiBaseUrl: "%s" };\n' "${API_BASE_URL:-}" > /usr/share/nginx/html/config.js
