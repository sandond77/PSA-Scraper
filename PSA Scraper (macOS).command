#!/bin/bash
# Double-click this file to launch the PSA Card Image Scraper.
# Requires Node.js — download from https://nodejs.org if needed.

set -e
cd "$(dirname "$0")/src"

if ! command -v node &>/dev/null; then
  echo ""
  echo "ERROR: Node.js is not installed."
  echo "Download it from https://nodejs.org then try again."
  echo ""
  read -p "Press Enter to close..."
  exit 1
fi

if [ ! -d "node_modules/patchright" ]; then
  echo ""
  echo "First-time setup: installing dependencies..."
  npm install
  echo ""
fi

echo "Ensuring browser is ready..."
npx patchright install chromium
echo ""

while true; do
  node run-psa-firstview.mjs

  echo ""
  echo "Run again? (y/n) — auto-closing in 10 seconds..."
  read -t 10 -p "> " again
  echo ""
  if [[ "$again" != "y" && "$again" != "Y" ]]; then
    echo "Closing..."
    break
  fi
done
