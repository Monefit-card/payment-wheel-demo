#!/bin/bash
export PATH="/Users/Alexander/.local/share/fnm/node-versions/v20.20.2/installation/bin:$PATH"
cd /Users/Alexander/Desktop/Code/payment-wheel-demo
exec node node_modules/.bin/next dev --port 3001
