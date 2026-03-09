#!/bin/bash
echo "Starting deployment..."

export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd /home/ec2-user/gmb-automation || exit

echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

echo "Restarting PM2..."
/home/ec2-user/.nvm/versions/node/v20.20.0/bin/pm2 restart limbuAi

echo "Fixing permissions..."
chown -R ec2-user:ec2-user /home/ec2-user/gmb-automation

echo "Deployment completed"
