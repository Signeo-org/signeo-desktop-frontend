#!/usr/bin/env bash
# =============================================================================
# Signeo Frontend - Unified Build Script
# =============================================================================
# Usage:
#   ./build.sh         # Dev server
#   ./build.sh -prod   # Production build
# =============================================================================

set -e

# Parse arguments
MODE="dev"
while [[ $# -gt 0 ]]; do
    case $1 in
        -dev|--dev) MODE="dev"; shift ;;
        -prod|--prod) MODE="prod"; shift ;;
        *) shift ;;
    esac
done

# Path resolution
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Check pnpm
if ! command -v pnpm &>/dev/null; then
    echo "ERROR: pnpm not installed. Run: npm install -g pnpm"
    exit 1
fi

# Install deps if needed
[ ! -d "node_modules" ] && pnpm install

if [ "$MODE" = "dev" ]; then
    echo -e "\n🚀 Frontend - Development\n"
    pnpm dev
elif [ "$MODE" = "prod" ]; then
    echo -e "\n📦 Frontend - Production\n"
    pnpm build
    echo -e "\n✅ Build complete: dist/release/"
fi
