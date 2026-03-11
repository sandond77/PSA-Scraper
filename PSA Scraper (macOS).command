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

mkdir -p "$HOME/Desktop/PSA Scrapes"

echo "Ensuring browser is ready..."
npx patchright install chromium
echo ""

node run-psa-firstview.mjs

echo ""
read -p "Press Enter to close..."
