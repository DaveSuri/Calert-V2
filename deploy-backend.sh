#!/bin/bash

# Deploy Calert Backend to Google Cloud Run
# This script automates the backend deployment process

echo "🚀 Deploying Calert Backend to Google Cloud Run..."

# Set your Google Cloud project ID
PROJECT_ID="calert-h175v"
SERVICE_NAME="calert-backend"
REGION="us-west1"

# Set the project
gcloud config set project $PROJECT_ID

# Build and deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="API_KEY=AIzaSyBQboyVKlOf2qDV9XqGHDaa-sugLKiRILg,APP_TOKEN=calert-secure-token-2024" \
  --port 8080 \
  --memory 1Gi \
  --cpu 1

echo "✅ Backend deployment complete!"
echo "🌐 Your backend URL will be: https://$SERVICE_NAME-$PROJECT_ID.$REGION.run.app"