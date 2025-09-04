#!/bin/bash

sudo dnf install -y nginx
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
sudo systemctl status nginx