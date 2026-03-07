#!/bin/bash

echo "Starting deployment..."

cd /home/ec2-user/gmb-automation || exit

echo "Installing dependencies..."
npm install

echo "Fixing permissions..."
chown -R ec2-user:ec2-user /home/ec2-user/gmb-automation

echo "Deployment completed"