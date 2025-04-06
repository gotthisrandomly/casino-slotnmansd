#!/bin/bash

# Slot King Casino - Vercel Deployment Script
# This script automates the deployment process to Vercel

# Configuration
APP_NAME="slot-king-casino"
VERCEL_ORG_ID=""  # Your Vercel organization ID
VERCEL_PROJECT_ID=""  # Your Vercel project ID
ENVIRONMENT="production"  # Options: production, preview, development

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment of ${APP_NAME} to Vercel (${ENVIRONMENT})...${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo -e "${RED}Error: Vercel CLI is not installed. Install it with 'npm i -g vercel'.${NC}"
  exit 1
fi

# Check if user is logged in to Vercel
VERCEL_TOKEN=$(vercel whoami 2>/dev/null)
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}You are not logged in to Vercel. Please log in:${NC}"
  vercel login
fi

# Run tests before deployment
echo -e "${YELLOW}Running tests before deployment...${NC}"
npm test

# Check if tests passed
if [ $? -ne 0 ]; then
  echo -e "${RED}Tests failed. Aborting deployment.${NC}"
  exit 1
fi

# Create a .vercel/output/config.json file to disable service workers
mkdir -p .vercel/output
echo '{
  "version": 3,
  "routes": [
    {
      "src": "/(.*)",
      "headers": {
        "Service-Worker-Allowed": "false",
        "Service-Worker": "script-src-elem \'none\'"
      },
      "continue": true
    }
  ]
}' > .vercel/output/config.json

# Deploy to Vercel
echo -e "${YELLOW}Deploying to Vercel...${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
  # Production deployment
  vercel --prod
elif [ "$ENVIRONMENT" = "preview" ]; then
  # Preview deployment
  vercel
else
  # Development deployment
  vercel --env NEXT_PUBLIC_ENV=development
fi

# Check if deployment was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Deployment failed.${NC}"
  exit 1
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Your application is now available on Vercel.${NC}"

exit 0

