#!/bin/bash
# Bora API — DigitalOcean Droplet Setup Script
# Run as root: bash setup-droplet.sh

set -e

echo "════════════════════════════════════════"
echo "  Bora API — Droplet Setup"
echo "════════════════════════════════════════"

# 1. System updates & dependencies
echo "[1/7] Updating system..."
apt update && apt upgrade -y
apt install -y python3 python3-pip python3-venv git nginx certbot python3-certbot-nginx ufw

# 2. Firewall
echo "[2/7] Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 3. Create app user (don't run the app as root)
echo "[3/7] Creating app user..."
useradd -m -s /bin/bash bora || true
mkdir -p /home/bora
chown bora:bora /home/bora

# 4. Clone repo & set up backend
echo "[4/7] Setting up repository..."
sudo -u bora bash -c '
  cd /home/bora
  if [ -d "app" ]; then
    echo "Repo already exists, pulling latest..."
    cd app && git pull
  else
    git clone https://github.com/gaelxxl34/Bora-AI-Scientific-Figures.git app
  fi
  cd /home/bora/app/bora-api
  python3 -m venv venv
  source venv/bin/activate
  pip install --upgrade pip
  pip install -r requirements.txt
  pip install uvicorn[standard]
'

# 5. Create .env placeholder
echo "[5/7] Creating .env file..."
cat > /home/bora/app/bora-api/.env << 'ENVEOF'
# ══ Bora API — Production Environment ══
# Fill in your actual values below

# AI
ANTHROPIC_API_KEY=your-key-here
OPENAI_API_KEY=your-key-here

# Database (Supabase Postgres)
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@db.ananejrhkkmkkyupnwye.supabase.co:5432/postgres

# Auth (Supabase)
SUPABASE_URL=https://ananejrhkkmkkyupnwye.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
ENVIRONMENT=production
ENVEOF
chown bora:bora /home/bora/app/bora-api/.env
chmod 600 /home/bora/app/bora-api/.env

echo ""
echo "⚠️  IMPORTANT: Edit /home/bora/app/bora-api/.env with your actual keys"
echo "    nano /home/bora/app/bora-api/.env"
echo ""

# 6. Create systemd service
echo "[6/7] Creating systemd service..."
cat > /etc/systemd/system/bora-api.service << 'EOF'
[Unit]
Description=Bora API — AI Scientific Figures Backend
After=network.target

[Service]
User=bora
Group=bora
WorkingDirectory=/home/bora/app/bora-api
EnvironmentFile=/home/bora/app/bora-api/.env
ExecStart=/home/bora/app/bora-api/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable bora-api

# 7. Nginx reverse proxy
echo "[7/7] Configuring Nginx..."
cat > /etc/nginx/sites-available/bora-api << 'EOF'
server {
    listen 80;
    server_name _;  # Replace _ with your domain when ready

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE streaming support (critical for AI chat)
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/bora-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo ""
echo "════════════════════════════════════════"
echo "  Setup complete!"
echo "════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Edit .env:       nano /home/bora/app/bora-api/.env"
echo "  2. Start the API:   systemctl start bora-api"
echo "  3. Check status:    systemctl status bora-api"
echo "  4. View logs:       journalctl -u bora-api -f"
echo ""
echo "To deploy updates later:"
echo "  sudo -u bora bash -c 'cd /home/bora/app && git pull'"
echo "  sudo systemctl restart bora-api"
echo ""
echo "To add SSL (after pointing your domain):"
echo "  certbot --nginx -d api.yourdomain.com"
echo ""
