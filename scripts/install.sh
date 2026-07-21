#!/bin/bash
set -e

# Load nvm so npm/node are available
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Free previous backup first
rm -rf /home/ec2-user/gmb-automation-old

cd /home/ec2-user/gmb-automation-staging
sudo chown -R ec2-user:ec2-user /home/ec2-user/gmb-automation-staging

# .env is not in git — copy it before building
cp /home/ec2-user/gmb-automation/.env /home/ec2-user/gmb-automation-staging/.env

npm ci || npm install
npm run build