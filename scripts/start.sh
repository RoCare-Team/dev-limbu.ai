#!/bin/bash

cd /home/ec2-user/gmb-automation

pm2 restart limbuAi || pm2 start npm --name "limbuAi" -- start