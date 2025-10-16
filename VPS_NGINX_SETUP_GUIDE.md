# 🔧 Professional VPS Setup with Nginx Reverse Proxy

## Overview

This guide sets up Nginx as a reverse proxy on your VPS to properly route domains to your Coolify-hosted services.

**What this does:**
- Routes `api.buymediamonds.co.uk` → Backend (port 5000)
- Routes `buymediamonds.co.uk` → Frontend (port 3000)
- Handles SSL certificates automatically
- Works alongside Coolify

---

## 📋 Prerequisites

- VPS with Coolify running
- Backend service running on port 5000
- Frontend service running on port 3000
- SSH access to your VPS
- DNS configured (see step 1)

---

## 🚀 Setup Steps

### Step 1: Configure DNS (In Cloudflare)

Before running the script, update your DNS:

1. Go to Cloudflare DNS management
2. Update these records (or add if missing):

```
Type: A
Name: api
Content: 31.97.116.89
Proxy status: DNS only (gray cloud) ⚠️ IMPORTANT
TTL: Auto

Type: A
Name: @
Content: 31.97.116.89
Proxy status: DNS only (gray cloud) ⚠️ IMPORTANT
TTL: Auto
```

**Why gray cloud?**
- Nginx will handle SSL
- Coolify needs direct access
- Cloudflare proxy conflicts with Let's Encrypt

Wait 5 minutes for DNS propagation.

---

### Step 2: SSH to Your VPS

```bash
ssh root@31.97.116.89
# or
ssh your-username@31.97.116.89
```

---

### Step 3: Upload and Run the Setup Script

**Option A: Copy-paste the script**

```bash
# Create the script file
nano nginx-setup.sh

# Paste the content from vps-nginx-setup.sh
# Press Ctrl+X, then Y, then Enter to save

# Make it executable
chmod +x nginx-setup.sh

# Run it
sudo ./nginx-setup.sh
```

**Option B: Download from your repo**

```bash
# If you pushed the script to Git
git clone <your-repo-url>
cd <repo-directory>
chmod +x vps-nginx-setup.sh
sudo ./vps-nginx-setup.sh
```

---

### Step 4: Install SSL Certificates

After the script completes and DNS is updated:

```bash
# Install SSL for backend API
sudo certbot --nginx -d api.buymediamonds.co.uk

# Install SSL for frontend
sudo certbot --nginx -d buymediamonds.co.uk -d www.buymediamonds.co.uk
```

Certbot will:
- ✅ Automatically configure SSL
- ✅ Set up auto-renewal
- ✅ Redirect HTTP to HTTPS

---

### Step 5: Verify Everything Works

```bash
# Test backend
curl https://api.buymediamonds.co.uk/api/v1/health

# Should return:
# {"success":true,"message":"API is healthy",...}

# Test frontend
curl https://buymediamonds.co.uk

# Should return HTML
```

---

## 🎯 What This Setup Does

### Before (Coolify alone):
```
Browser → api.buymediamonds.co.uk → Coolify Traefik → ❌ 404/503
```

### After (Nginx + Coolify):
```
Browser → api.buymediamonds.co.uk → Nginx :80/443 → Coolify service :5000 → ✅ Working!
Browser → buymediamonds.co.uk → Nginx :80/443 → Coolify service :3000 → ✅ Working!
```

---

## 📁 Configuration Files Location

After running the script, these files are created:

```
/etc/nginx/sites-available/api.buymediamonds.co.uk
/etc/nginx/sites-available/buymediamonds.co.uk
/etc/nginx/sites-enabled/api.buymediamonds.co.uk (symlink)
/etc/nginx/sites-enabled/buymediamonds.co.uk (symlink)
```

---

## 🔧 Troubleshooting

### Issue: "nginx: command not found"

The script should install it, but if not:
```bash
sudo apt update
sudo apt install -y nginx
```

---

### Issue: Port 80/443 already in use

Check what's using the ports:
```bash
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

If Coolify's Traefik is using them:
```bash
# Stop Traefik temporarily
docker stop $(docker ps -q --filter "name=traefik")
```

---

### Issue: SSL certificate fails

Make sure:
1. DNS is pointing to your VPS (wait 5-10 minutes)
2. Ports 80 and 443 are open in firewall
3. Domain is NOT proxied through Cloudflare (gray cloud)

Check DNS:
```bash
nslookup api.buymediamonds.co.uk
# Should show: 31.97.116.89
```

---

### Issue: "Connection refused"

Check if Coolify services are running:
```bash
# Check backend
curl http://localhost:5000/api/v1/health

# Check frontend
curl http://localhost:3000
```

If not working, restart services in Coolify dashboard.

---

## 🔄 Managing Nginx

### Check status:
```bash
sudo systemctl status nginx
```

### Restart Nginx:
```bash
sudo systemctl restart nginx
```

### Reload configuration (no downtime):
```bash
sudo systemctl reload nginx
```

### Check configuration syntax:
```bash
sudo nginx -t
```

### View error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

### View access logs:
```bash
sudo tail -f /var/log/nginx/access.log
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────┐
│  Internet                                    │
└────────────┬────────────────────────────────┘
             │
             │ DNS: api.buymediamonds.co.uk → 31.97.116.89
             │      buymediamonds.co.uk → 31.97.116.89
             │
             ▼
┌─────────────────────────────────────────────┐
│  VPS (31.97.116.89)                         │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Nginx :80 :443                        │ │
│  │  - SSL termination                     │ │
│  │  - Reverse proxy                       │ │
│  └──────┬──────────────────┬──────────────┘ │
│         │                  │                 │
│         │ :5000            │ :3000           │
│         ▼                  ▼                 │
│  ┌──────────────┐   ┌──────────────┐       │
│  │  Backend     │   │  Frontend    │       │
│  │  (Coolify)   │   │  (Coolify)   │       │
│  │  Node.js API │   │  React App   │       │
│  └──────────────┘   └──────────────┘       │
│                                              │
└─────────────────────────────────────────────┘
```

---

## ✅ Checklist

After setup, verify:

- [ ] DNS pointing to VPS (gray cloud in Cloudflare)
- [ ] Nginx installed and running
- [ ] Configuration files created
- [ ] SSL certificates installed
- [ ] Backend accessible: `https://api.buymediamonds.co.uk/api/v1/health`
- [ ] Frontend accessible: `https://buymediamonds.co.uk`
- [ ] No SSL warnings in browser
- [ ] Auto-renewal enabled: `sudo certbot renew --dry-run`

---

## 🎉 Benefits of This Setup

✅ **Professional SSL certificates** (Let's Encrypt, auto-renewed)
✅ **Proper domain routing** (no more 404/503 errors)
✅ **Works with Coolify** (services keep running as-is)
✅ **Industry standard** (Nginx reverse proxy)
✅ **Easy to maintain**
✅ **Free** (no additional costs)

---

## 📞 Next Steps

After setup is complete:

1. **Update frontend environment variable:**
   - In Coolify frontend service, set:
   ```
   VITE_API_URL=https://api.buymediamonds.co.uk/api/v1
   ```
   - Redeploy frontend

2. **Test all features:**
   - Admin login
   - Product pages
   - File uploads
   - Watch brands

3. **Set up monitoring:**
   - Check Nginx logs regularly
   - Monitor SSL certificate expiry (auto-renewed)
   - Set up uptime monitoring (UptimeRobot, etc.)

---

**Created:** 2025-10-03
**For:** McCulloch Jewellers Website
**VPS:** 31.97.116.89
