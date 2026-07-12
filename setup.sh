#!/usr/bin/env bash

set -Eeuo pipefail

#######################################
# Configuration
#######################################
MIN_NODE_MAJOR=20

#######################################
# Colors
#######################################
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
NC="\033[0m"

#######################################
# Helper Functions
#######################################
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

cleanup() {
    cd "$ROOT_DIR" >/dev/null 2>&1 || true
}

trap cleanup EXIT

#######################################
# Banner
#######################################
echo "========================================"
echo "      CertiVault Setup Script"
echo "========================================"
echo

ROOT_DIR="$(pwd)"

#######################################
# Check Node.js
#######################################
if ! command -v node >/dev/null 2>&1; then
    error "Node.js is not installed."
    echo
    echo "Please install Node.js ${MIN_NODE_MAJOR}+ from:"
    echo "https://nodejs.org/"
    exit 1
fi

NODE_VERSION="$(node -v)"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"

if (( NODE_MAJOR < MIN_NODE_MAJOR )); then
    error "Detected Node.js ${NODE_VERSION}"
    error "Node.js ${MIN_NODE_MAJOR}+ is required."
    exit 1
fi

#######################################
# Step 1
#######################################
info "[1/5] Node.js version"
echo "$NODE_VERSION"
echo

#######################################
# Step 2
#######################################
info "[2/5] Installing root dependencies..."
npm install
echo

#######################################
# Step 3
#######################################
info "[3/5] Installing backend dependencies..."

if [[ ! -d backend ]]; then
    error "backend directory not found."
    exit 1
fi

pushd backend >/dev/null
npm install
popd >/dev/null

echo

#######################################
# Step 4
#######################################
info "[4/5] Installing frontend dependencies..."

if [[ ! -d frontend ]]; then
    error "frontend directory not found."
    exit 1
fi

pushd frontend >/dev/null
npm install
popd >/dev/null

echo

#######################################
# Step 5
#######################################
info "[5/5] Setting up environment files..."

# Backend
if [[ ! -f backend/.env ]]; then
    if [[ -f backend/.env.example ]]; then
        cp backend/.env.example backend/.env
        success "Created backend/.env"
    else
        warn "backend/.env.example not found. Skipping."
    fi
else
    warn "backend/.env already exists."
fi

# Frontend
if [[ ! -f frontend/.env ]]; then
    if [[ -f frontend/.env.example ]]; then
        cp frontend/.env.example frontend/.env
        success "Created frontend/.env"
    else
        cat > frontend/.env <<EOF
# Frontend environment
VITE_API_URL=http://localhost:5000/api/v1
EOF
        success "Created frontend/.env"
    fi
else
    warn "frontend/.env already exists."
fi

echo
echo "========================================"
success "Setup completed successfully!"
echo "========================================"
echo
echo "Next steps:"
echo "  1. Configure your MongoDB connection in backend/.env"
echo "  2. Configure your JWT secrets in backend/.env"
echo "  3. Run: npm start"
echo
echo "Frontend : http://localhost:5173"
echo "Backend  : http://localhost:5000"
echo