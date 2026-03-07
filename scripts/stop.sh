#!/bin/bash

# Kill any existing node/next processes
pm2 stop gmb-automation 2>/dev/null || true
pm2 delete gmb-automation 2>/dev/null || true
pm2 kill 2>/dev/null || true

exit 0