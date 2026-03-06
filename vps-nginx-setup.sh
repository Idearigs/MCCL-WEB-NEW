#!/bin/bash
# VPS Nginx Setup Script for McCulloch Website
# This script sets up Nginx as a reverse proxy on your VPS

echo "🚀 Setting up Nginx reverse proxy on VPS..."

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration for backend API
echo "⚙️ Creating Nginx config for api.buymediamonds.co.uk..."
sudo tee /etc/nginx/sites-available/api.buymediamonds.co.uk > /dev/null <<'EOF'
server {
    listen 80;
    server_name api.buymediamonds.co.uk;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to backend service running on port 5000
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Handle uploads
    client_max_body_size 10M;
}
EOF

# Create Nginx configuration for frontend
echo "⚙️ Creating Nginx config for buymediamonds.co.uk..."
sudo tee /etc/nginx/sites-available/buymediamonds.co.uk > /dev/null <<'EOF'
server {
    listen 80;
    server_name buymediamonds.co.uk www.buymediamonds.co.uk;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to frontend service running on port 3000
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

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the sites
echo "🔗 Enabling sites..."
sudo ln -sf /etc/nginx/sites-available/api.buymediamonds.co.uk /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/buymediamonds.co.uk /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"

    # Reload Nginx
    echo "🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    sudo systemctl enable nginx

    echo ""
    echo "✅ Nginx reverse proxy setup complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Make sure your DNS is pointing to this server:"
    echo "   - api.buymediamonds.co.uk → 31.97.116.89 (DNS only/gray cloud)"
    echo "   - buymediamonds.co.uk → 31.97.116.89 (DNS only/gray cloud)"
    echo ""
    echo "2. Install SSL certificates (run after DNS is updated):"
    echo "   sudo certbot --nginx -d api.buymediamonds.co.uk"
    echo "   sudo certbot --nginx -d buymediamonds.co.uk -d www.buymediamonds.co.uk"
    echo ""
    echo "3. Test your domains:"
    echo "   curl http://api.buymediamonds.co.uk/api/v1/health"
    echo "   curl http://buymediamonds.co.uk"
    echo ""
else
    echo "❌ Nginx configuration has errors. Please check the output above."
    exit 1
fi
