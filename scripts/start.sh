#!/bin/bash
echo "Starting deployment..."

export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd /home/ec2-user/gmb-automation || exit

echo "Installing dependencies..."
npm install

echo "Removing old Next.js build..."
rm -rf .next

echo "Building application..."
npm run build

echo "Reloading PM2 (zero downtime)..."
pm2 reload limbuAi || pm2 start npm --name "limbuAi" -- start

pm2 save

echo "Fixing permissions..."
chown -R ec2-user:ec2-user /home/ec2-user/gmb-automation

echo "Deployment completed"
