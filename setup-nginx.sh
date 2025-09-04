#!/bin/bash

sudo dnf install -y nginx
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
sudo systemctl status nginx

#curl http://localhost:48300/health
curl http://localhost:9223/health

# kill all chrome instances
pkill -f chrome
# start new chrome instance with remote debugging port 48300
#google-chrome --remote-debugging-port=48300 --user-data-dir=/tmp/chrome-profile --headless --disable-gpu --no-sandbox --disable-first-run --disable-extensions
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-profile --headless --disable-gpu --no-sandbox --disable-first-run --disable-extensions --hide-scrollbars --mute-audio --disable-background-networking --disable-sync --disable-translate --disable-default-apps --disable-popup-blocking --disable-background-timer-throttling --disable-renderer-backgrounding --disable-device-discovery-notifications --disable-component-update --disable-domain-reliability --safebrowsing-disable-auto-update --metrics-recording-only --no-first-run --enable-automation --password-store=basic --use-mock-keychain &

