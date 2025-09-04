#!/bin/bash

sudo dnf install -y nginx
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
sudo systemctl status nginx

curl http://localhost:48300/health


# kill all chrome instances
pkill -f chrome
# start new chrome instance with remote debugging port 48300
google-chrome --remote-debugging-port=48300 --user-data-dir=/tmp/chrome-profile --headless --disable-gpu --no-sandbox --disable-first-run --disable-extensions