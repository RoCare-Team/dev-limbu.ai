#!/bin/bash

cd /home/ec2-user/gmb-automation || exit

export PATH=$PATH:/usr/local/bin

pm2 restart limbuAi || pm2 start npm --name "limbuAi" -- start

pm2 save