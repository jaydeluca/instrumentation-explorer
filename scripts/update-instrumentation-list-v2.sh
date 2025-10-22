#!/bin/bash
# Wrapper script to integrate V2 data processing with existing GitHub Actions workflow
# This script:
# 1. Expects YAML files to already be downloaded (by update-instrumentation-list.py)
# 2. Generates V2 content-addressed data
# 3. Copies it to frontend/public/data/

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_PROCESSING_V2_DIR="$PROJECT_ROOT/data-processing-v2"

echo "🚀 Running V2 Data Processing Pipeline"
echo "======================================="
echo

# Check if data-processing-v2 exists
if [ ! -d "$DATA_PROCESSING_V2_DIR" ]; then
  echo "❌ Error: data-processing-v2 directory not found"
  exit 1
fi

# Change to data-processing-v2 directory
cd "$DATA_PROCESSING_V2_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo
fi

# Build if needed
if [ ! -d "dist" ]; then
  echo "🔨 Building TypeScript..."
  npm run build
  echo
fi

# Generate data with auto-detected versions
# Default: process 2 most recent versions
MODE="${V2_MODE:-recent}"
COUNT="${V2_COUNT:-2}"
INCLUDE_3_0="${V2_INCLUDE_3_0:-true}"

# Build the base command
if [ "$INCLUDE_3_0" = "true" ]; then
  INCLUDE_FLAG="--include-3.0"
else
  INCLUDE_FLAG=""
fi

case "$MODE" in
  latest)
    echo "📊 Processing: Latest version only"
    node dist/src/index.js --latest $INCLUDE_FLAG
    ;;
  all)
    echo "📊 Processing: All versions"
    node dist/src/index.js --all $INCLUDE_FLAG
    ;;
  recent)
    echo "📊 Processing: $COUNT most recent versions (including 3.0: $INCLUDE_3_0)"
    node dist/src/index.js --recent "$COUNT" $INCLUDE_FLAG
    ;;
  *)
    echo "📊 Processing: 2 most recent versions (default, including 3.0: $INCLUDE_3_0)"
    node dist/src/index.js --recent 2 $INCLUDE_FLAG
    ;;
esac

echo
echo "📋 Copying data to frontend..."
npm run copy-to-frontend

echo
echo "✅ V2 data processing complete!"
echo "   Data available at: frontend/public/data/"





