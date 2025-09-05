#!/usr/bin/env bash
set -e  # Exit on first error

# Set working directory to the script's location
cd "$(dirname "$0")/../" || exit 1

# ---------------------------------------------------
# 0) Ensure ../resources/SL exists
# ---------------------------------------------------
if [ ! -d "resources/SL" ]; then
    echo "[INFO] resources/SL not found. Copying from ../../../shared/database/SL..."
    mkdir -p resources
    cp -r ../../../shared/database/SL resources/
    echo "[INFO] Copy complete."
fi

# ---------------------------------------------------
# 1) Check if pnpm is installed
# ---------------------------------------------------
if ! command -v pnpm &> /dev/null; then
    echo "[ERROR] pnpm is not installed."
    echo "Please install it with one of the following commands:"
    echo "   curl -fsSL https://get.pnpm.io/install.sh | sh   # recommended"
    echo "   npm install -g pnpm"
    exit 1
fi

# ---------------------------------------------------
# 2) Install dependencies
# ---------------------------------------------------
echo "Installing frontend dependencies..."
pnpm install

# ---------------------------------------------------
# 3) Start the development server
# ---------------------------------------------------
echo "Starting frontend..."
pnpm build
