#!/bin/bash
# Quick-apply script — fixes the index.html caching bug causing 404 on JS assets.
# Run on the VPS: bash update-nginx-cache.sh

set -e

echo "Updating buymediamonds.co.uk nginx config..."

sudo tee /etc/nginx/sites-available/buymediamonds.co.uk > /dev/null <<'EOF'
server {
    listen 80;
    server_name buymediamonds.co.uk www.buymediamonds.co.uk;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # NEVER cache HTML — browsers must always fetch fresh index.html
    location ~* \.html$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }

    # Cache hashed assets forever (Vite content-hashes them — safe)
    location ~* ^/assets/.*\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp|avif)$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable" always;
    }

    # SPA routes + everything else
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
EOF

echo "Testing nginx config..."
sudo nginx -t && sudo systemctl reload nginx

echo "Done. Pull latest code and restart the frontend process:"
echo "  cd /path/to/project && git pull origin main && pm2 restart all"
