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

# Warm-start: reuse deps and Next's incremental cache from the live release
if [ -d /home/ec2-user/gmb-automation/node_modules ]; then
  cp -a /home/ec2-user/gmb-automation/node_modules \
        /home/ec2-user/gmb-automation-staging/node_modules
fi
mkdir -p /home/ec2-user/gmb-automation-staging/.next
if [ -d /home/ec2-user/gmb-automation/.next/cache ]; then
  cp -a /home/ec2-user/gmb-automation/.next/cache \
        /home/ec2-user/gmb-automation-staging/.next/cache
fi

npm install
npm run build