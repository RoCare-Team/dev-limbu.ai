#!/bin/bash
set -e

# Load nvm so npm/pm2 are available
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd /home/ec2-user

# Swap staging into place; keep old build as rollback
[ -d gmb-automation ] && mv gmb-automation gmb-automation-old
mv gmb-automation-staging gmb-automation
cd /home/ec2-user/gmb-automation

# Which port is live now? Boot new version on the other.
CURRENT=$(grep -oP '\d+' /etc/nginx/active_port.conf)
if [ "$CURRENT" = "3000" ]; then NEW=3001; else NEW=3000; fi
echo "Active port is $CURRENT — booting new version on $NEW"

pm2 delete "limbuAi-$NEW" 2>/dev/null || true
PORT=$NEW pm2 start npm --name "limbuAi-$NEW" -- start

# Wait until new port answers before flipping
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:$NEW" >/dev/null; then echo "Up on $NEW"; break; fi
  [ "$i" = "30" ] && { echo "Failed on $NEW — aborting"; pm2 delete "limbuAi-$NEW" 2>/dev/null || true; exit 1; }
  echo "waiting for $NEW... ($i)"; sleep 1
done

# Flip nginx gracefully
echo "set \$active_port $NEW;" | sudo tee /etc/nginx/active_port.conf
sudo nginx -s reload

# Drain, then stop old version
sleep 3
pm2 delete "limbuAi-$CURRENT" 2>/dev/null || true
pm2 save
echo "Traffic now on $NEW"