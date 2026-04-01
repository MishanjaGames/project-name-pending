#!/bin/sh
set -e

# Replace build-time placeholders with real runtime values in all JS files.
# This allows a single Docker image to work with any server hostname/IP.

API_URL="${REACT_APP_API_URL:-http://localhost:4040/api}"
RTC_URL="${REACT_APP_RTC_URL:-http://localhost:5050}"
USE_HTTPS="${REACT_APP_USE_HTTPS:-false}"

echo "Runtime config:"
echo "  REACT_APP_API_URL=$API_URL"
echo "  REACT_APP_RTC_URL=$RTC_URL"
echo "  REACT_APP_USE_HTTPS=$USE_HTTPS"

find /usr/share/nginx/html -name "*.js" | while read f; do
  sed -i \
    -e "s|__REACT_APP_API_URL__|$API_URL|g" \
    -e "s|__REACT_APP_RTC_URL__|$RTC_URL|g" \
    -e "s|__REACT_APP_USE_HTTPS__|$USE_HTTPS|g" \
    "$f"
done

exec nginx -g "daemon off;"
