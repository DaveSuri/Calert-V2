#!/bin/bash

# Deploy Calert Frontend to Vercel
# This script automates the frontend deployment process

echo "🚀 Deploying Calert Frontend to Vercel..."

# Build the project first
echo "📦 Building the project..."
npm run build

# Deploy to Vercel with environment variables
echo "🌐 Deploying to Vercel..."
npx vercel --prod \
  --env GEMINI_API_KEY=AIzaSyBQboyVKlOf2qDV9XqGHDaa-sugLKiRILg \
  --build-env GEMINI_API_KEY=AIzaSyBQboyVKlOf2qDV9XqGHDaa-sugLKiRILg

echo "✅ Frontend deployment complete!"
echo "🌐 Your frontend will be available at the Vercel URL provided above"