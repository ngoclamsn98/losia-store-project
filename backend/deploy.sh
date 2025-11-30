#!/bin/bash
cd /var/www/myproject
git pull origin main
npm install --production
pm2 restart all
echo "Deploy completed at $(date)" >> deploy.log