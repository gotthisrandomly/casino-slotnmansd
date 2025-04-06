#!/bin/bash

# Slot King Casino - Android Deployment Script
# This script deploys the application to an Android device running a web server

# Configuration
APP_NAME="slot-king-casino"
ANDROID_SERVER_IP="192.168.1.100"  # Replace with your Android device IP
ANDROID_SERVER_PORT="8080"         # Replace with your Android server port
ANDROID_SERVER_USERNAME="admin"    # Replace with your Android server username
ANDROID_SERVER_PATH="/data/www"    # Replace with your Android server web directory
BUILD_DIR="./out"                  # Next.js static export directory

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment of ${APP_NAME} to Android HTTP Server...${NC}"

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
  echo -e "${RED}Error: Build directory not found. Run 'npm run build' first.${NC}"
  exit 1
fi

# Build the application for production
echo -e "${YELLOW}Building application for production...${NC}"
npm run build

# Export the application to static files
echo -e "${YELLOW}Exporting application to static files...${NC}"
npm run export

# Create a deployment package
echo -e "${YELLOW}Creating deployment package...${NC}"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
DEPLOY_PACKAGE="${APP_NAME}-${TIMESTAMP}.tar.gz"
tar -czf $DEPLOY_PACKAGE -C $BUILD_DIR .

# Deploy to Android server
echo -e "${YELLOW}Deploying to Android server at ${ANDROID_SERVER_IP}:${ANDROID_SERVER_PORT}...${NC}"
scp $DEPLOY_PACKAGE ${ANDROID_SERVER_USERNAME}@${ANDROID_SERVER_IP}:${ANDROID_SERVER_PATH}

# Extract the package on the server
echo -e "${YELLOW}Extracting package on the server...${NC}"
ssh ${ANDROID_SERVER_USERNAME}@${ANDROID_SERVER_IP} "cd ${ANDROID_SERVER_PATH} && tar -xzf ${DEPLOY_PACKAGE} && rm ${DEPLOY_PACKAGE}"

# Clean up local deployment package
echo -e "${YELLOW}Cleaning up local deployment package...${NC}"
rm $DEPLOY_PACKAGE

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Your application is now available at http://${ANDROID_SERVER_IP}:${ANDROID_SERVER_PORT}/${NC}"

exit 0

