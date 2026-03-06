#!/bin/bash

echo "Starting deployment..."

cd /home/ec2-user/gmb-automation || exit

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

echo "Deployment completed"