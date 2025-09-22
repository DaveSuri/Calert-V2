#!/bin/bash

# Calert Netlify Deployment Script
# This script handles the full deployment process

echo "🚀 Starting Calert deployment to Netlify..."

# Step 1: Build the project
echo "📦 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Step 2: Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📥 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Step 3: Deploy to Netlify
echo "🌐 Deploying to Netlify..."
netlify deploy --prod --dir=dist

echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Visit your live URL (provided above)"
echo "2. Test Google OAuth login"
echo "3. Install Chrome extension from dist/ folder"
echo ""
echo "🔧 Chrome Extension Installation:"
echo "1. Open chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Click 'Load unpacked'"
echo "4. Select the dist/ folder"