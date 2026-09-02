#!/usr/bin/env bash
# ==============================================================================
# Production Deployment Script for Google Cloud Run
# MindScribe AI - Secure Journal Application
# ==============================================================================

set -euo pipefail

# Configuration
SERVICE_NAME="mindscribe-journal"
REGION="${GCP_REGION:-us-central1}"
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "")}"

if [ -z "$PROJECT_ID" ]; then
  echo "Error: GCP Project ID is not set. Run 'gcloud config set project YOUR_PROJECT_ID' or set GCP_PROJECT_ID."
  exit 1
fi

echo "=========================================================="
echo " Deploying MindScribe AI to Google Cloud Run"
echo " Project: $PROJECT_ID | Region: $REGION | Service: $SERVICE_NAME"
echo "=========================================================="

# 1. Verify Secret Manager has GEMINI_API_KEY
echo "🔍 Checking Google Secret Manager for GEMINI_API_KEY..."
if ! gcloud secrets describe GEMINI_API_KEY --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "⚠️ Warning: Secret 'GEMINI_API_KEY' was not found in Secret Manager."
  echo "To create it, run:"
  echo "  echo -n 'YOUR_GEMINI_KEY' | gcloud secrets create GEMINI_API_KEY --data-file=- --project=$PROJECT_ID"
  read -p "Do you want to continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 2. Build and Deploy using Cloud Run Source Deploy
echo "🚀 Building container image and deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,GCP_PROJECT_ID=$PROJECT_ID" \
  --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1

echo "=========================================================="
echo "✅ Deployment completed successfully!"
echo "Service URL:"
gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)'
echo "=========================================================="
