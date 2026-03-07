#!/bin/bash

export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

PM2=$(which pm2 || echo "/home/ec2-user/.nvm/versions/node/v20.20.0/bin/pm2")

cd /home/ec2-user/gmb-automation || exit

$PM2 restart limbuAi || $PM2 start npm --name "limbuAi" -- start
$PM2 save