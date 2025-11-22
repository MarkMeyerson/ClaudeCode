#!/bin/bash
echo "Installing dependencies..."
npm install --legacy-peer-deps
echo "Building with Vite..."
./node_modules/.bin/vite build
echo "Build complete!"
