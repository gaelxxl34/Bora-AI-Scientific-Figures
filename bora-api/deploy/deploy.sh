#!/bin/bash
# Quick deploy — run on the droplet to pull latest backend changes and restart
# Usage: bash deploy.sh

set -e

echo "Pulling latest changes..."
sudo -u bora bash -c 'cd /home/bora/app && git pull'

echo "Installing any new dependencies..."
sudo -u bora bash -c 'cd /home/bora/app/bora-api && source venv/bin/activate && pip install -r requirements.txt -q'

echo "Restarting Bora API..."
sudo systemctl restart bora-api

echo "Status:"
sudo systemctl status bora-api --no-pager -l

echo ""
echo "Done! Check logs with: journalctl -u bora-api -f"
