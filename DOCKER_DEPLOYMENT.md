# 🐳 Docker Deployment Guide - Frontend + Backend

## 📦 What's Included

This Docker setup runs **both Frontend and Backend together** on your VPS with:

- ✅ **Frontend (React + Vite + Nginx)** - Port 3000
- ✅ **Backend (Node.js + Express)** - Port 5000
- ✅ **Nginx Reverse Proxy** (Optional) - Port 80/443
- ✅ **Persistent storage** for uploads
- ✅ **Health checks** for both services
- ✅ **Auto-restart** on failure

---

## 🎯 Three Deployment Options

### **Option 1: Simple Deployment (Coolify - Recommended)**

Deploy Frontend and Backend as **separate services** in Coolify.

#### Frontend Configuration:
```
Name: McCulloch-Frontend
Build Pack: Dockerfile
Dockerfile: Dockerfile.frontend
Port: 80
Domain: buymediamonds.co.uk
```

#### Backend Configuration:
```
Name: McCulloch-Backend
Build Pack: Dockerfile
Dockerfile: Server/Dockerfile
Port: 3000
Port Mapping: 5000:3000
Domain: api.buymediamonds.co.uk
```

**Frontend Environment Variables:**
```env
VITE_API_URL=https://api.buymediamonds.co.uk/api/v1
```

**Backend Environment Variables:**
Copy all from `.env.production` file.

---

### **Option 2: Docker Compose on VPS (Manual)**

Run both services with one command using Docker Compose.

#### Step 1: Prepare Environment
```bash
# SSH into your VPS
ssh user@31.97.116.89

# Clone or copy your repository
git clone <your-repo-url> mcculloch
cd mcculloch
```

#### Step 2: Configure Environment Variables
```bash
# Copy and edit .env file
cp .env.production .env
nano .env

# Update with your actual values:
# - Database passwords
# - JWT secrets
# - Domain names
```

#### Step 3: Deploy
```bash
# Build and start all services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Check status
docker-compose -f docker-compose.production.yml ps
```

#### Step 4: Initialize Database
```bash
# Access backend container
docker exec -it mcculloch-backend sh

# Sync database tables
node -e "require('./models').sequelize.sync({ alter: true })"

# Create admin user
node quick-admin.js

# Exit
exit
```

#### Services Running:
- **Frontend:** http://31.97.116.89:3000
- **Backend:** http://31.97.116.89:5000/api/v1
- **Nginx Proxy (optional):** http://31.97.116.89:80

---

### **Option 3: Docker Compose with Nginx Proxy (Advanced)**

Unified routing through Nginx for production.

#### Step 1-2: Same as Option 2

#### Step 3: Deploy with Nginx
```bash
# Start with nginx proxy
docker-compose -f docker-compose.production.yml --profile with-proxy up -d

# This starts:
# - frontend (port 3000)
# - backend (port 5000)
# - nginx (port 80)
```

#### Nginx Routes:
- `http://buymediamonds.co.uk/` → Frontend
- `http://buymediamonds.co.uk/api/` → Backend API
- `http://buymediamonds.co.uk/uploads/` → Backend uploads

---

## 🔧 Configuration Files

### File Structure
```
McCulloch Website/
├── docker-compose.production.yml    # Multi-service compose
├── Dockerfile.frontend              # Frontend build
├── nginx.conf                       # Nginx reverse proxy config
├── .env.production                  # Environment variables template
├── .dockerignore                    # Files to exclude
├── Client/
│   ├── package.json
│   └── ...
└── Server/
    ├── Dockerfile                   # Backend build
    ├── package.json
    └── ...
```

### Environment Variables (.env.production)

```env
# Database
PG_HOST=31.97.116.89
PG_PORT=5433
PG_DATABASE=mcculloch_db
PG_USERNAME=mcculloch_admin
PG_PASSWORD=#mcculloch_admin#20026

# MongoDB
MONGODB_URI=mongodb://mcculloch-mdb:%23mcculloch_admin%2320026@31.97.116.89:27019/mcculloch_logs

# JWT
JWT_SECRET=mcculloch_jwt_secret_key_2024_production_secure_random_string
JWT_REFRESH_SECRET=mcculloch_refresh_secret_2024_production

# CORS
ALLOWED_ORIGINS=https://buymediamonds.co.uk,http://buymediamonds.co.uk,http://localhost:3000
```

---

## 🧪 Testing After Deployment

### Test Frontend
```bash
# Check if frontend is running
curl http://31.97.116.89:3000
# or
curl https://buymediamonds.co.uk

# Should return HTML
```

### Test Backend
```bash
# Health check
curl http://31.97.116.89:5000/api/v1/health
# or
curl https://api.buymediamonds.co.uk/api/v1/health

# Response: {"success":true,"message":"API is healthy"}

# Test products endpoint
curl http://31.97.116.89:5000/api/v1/products

# Test watches endpoint
curl http://31.97.116.89:5000/api/v1/watches/brands
```

### Test Frontend-Backend Connection
```bash
# Open browser and check:
https://buymediamonds.co.uk

# Open developer console (F12)
# Check Network tab for API calls
# Should see calls to api.buymediamonds.co.uk
```

---

## 🔄 Update & Redeploy

### Option 1: Coolify
1. Push code to Git
2. Click "Redeploy" in Coolify for each service

### Option 2: Docker Compose
```bash
# SSH to VPS
ssh user@31.97.116.89
cd mcculloch

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build

# Check logs
docker-compose -f docker-compose.production.yml logs -f
```

---

## 📊 Monitoring & Logs

### View Logs
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Frontend only
docker-compose -f docker-compose.production.yml logs -f frontend

# Backend only
docker-compose -f docker-compose.production.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100
```

### Check Container Status
```bash
# List running containers
docker-compose -f docker-compose.production.yml ps

# Check resource usage
docker stats mcculloch-frontend mcculloch-backend

# Check health
docker inspect mcculloch-frontend | grep Health -A 10
docker inspect mcculloch-backend | grep Health -A 10
```

### Access Container Shell
```bash
# Frontend container
docker exec -it mcculloch-frontend sh

# Backend container
docker exec -it mcculloch-backend sh
```

---

## 🐛 Troubleshooting

### Frontend Won't Load

**Issue:** Frontend returns 502 or won't load

**Solution:**
```bash
# Check frontend logs
docker logs mcculloch-frontend

# Restart frontend
docker restart mcculloch-frontend

# Rebuild if needed
docker-compose -f docker-compose.production.yml up -d --build frontend
```

### Backend API Errors

**Issue:** Backend returns 500 or can't connect to database

**Solution:**
```bash
# Check backend logs
docker logs mcculloch-backend

# Check database connection
docker exec -it mcculloch-backend node check-db.js

# Restart backend
docker restart mcculloch-backend

# Re-sync database
docker exec -it mcculloch-backend node -e "require('./models').sequelize.sync({ alter: true })"
```

### Frontend Can't Reach Backend

**Issue:** CORS errors or API calls fail

**Solution:**
1. Check `VITE_API_URL` in frontend build
2. Verify `ALLOWED_ORIGINS` in backend environment
3. Check network connectivity:
```bash
docker exec -it mcculloch-frontend ping backend
```

### Port Already in Use

**Issue:** `port is already allocated`

**Solution:**
```bash
# Find process using port
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000

# Kill process or change port in docker-compose.yml
# Then restart
docker-compose -f docker-compose.production.yml up -d
```

### Uploads Not Persisting

**Issue:** Uploaded files disappear after container restart

**Solution:**
```bash
# Check volume
docker volume ls | grep mcculloch

# Inspect volume
docker volume inspect mcculloch_backend-uploads

# Verify mount
docker exec -it mcculloch-backend ls -la /app/uploads
```

---

## 🔐 Security Checklist

- [ ] `.env.production` not committed to Git
- [ ] Strong database passwords
- [ ] Strong JWT secrets (64+ characters)
- [ ] CORS restricted to production domains
- [ ] HTTPS enabled for production domain
- [ ] Nginx rate limiting configured
- [ ] File upload size limits set
- [ ] Admin passwords changed from defaults
- [ ] Firewall rules configured
- [ ] Regular backups scheduled

---

## 🚀 Performance Optimization

### Enable Nginx Caching
Edit `nginx.conf`:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=STATIC:10m inactive=7d use_temp_path=off;

location /assets/ {
    proxy_cache STATIC;
    proxy_cache_valid 200 7d;
}
```

### Optimize Frontend Build
In `Client/.env.production`:
```env
VITE_BUILD_OPTIMIZATION=true
```

### Enable Compression
Already enabled in nginx config (gzip).

---

## 📈 Scaling

### Horizontal Scaling (Multiple Instances)
```yaml
# In docker-compose.production.yml
backend:
  deploy:
    replicas: 3

frontend:
  deploy:
    replicas: 2
```

### Load Balancer
Update nginx.conf:
```nginx
upstream backend {
    least_conn;
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
}
```

---

## 📞 Quick Commands Reference

```bash
# Start services
docker-compose -f docker-compose.production.yml up -d

# Stop services
docker-compose -f docker-compose.production.yml down

# Restart services
docker-compose -f docker-compose.production.yml restart

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build

# Remove everything (including volumes)
docker-compose -f docker-compose.production.yml down -v

# Check status
docker-compose -f docker-compose.production.yml ps

# Update and redeploy
git pull && docker-compose -f docker-compose.production.yml up -d --build
```

---

## ✅ Deployment Success Indicators

Your deployment is successful when:

1. ✅ `docker-compose ps` shows all services as "Up (healthy)"
2. ✅ Frontend loads at `http://31.97.116.89:3000`
3. ✅ Backend health check returns 200: `http://31.97.116.89:5000/api/v1/health`
4. ✅ Frontend can fetch data from backend
5. ✅ Admin panel loads and login works
6. ✅ No errors in logs: `docker-compose logs`
7. ✅ File uploads work and persist
8. ✅ Database connections stable

---

## 📚 Additional Resources

- **Complete API Docs:** `Server/COMPLETE_DEPLOYMENT_GUIDE.md`
- **Database Schema:** `Server/DATABASE_SCHEMA.md`
- **Quick Deploy:** `Server/QUICK_DEPLOY.md`
- **Docker Compose Docs:** https://docs.docker.com/compose/

---

**Created:** 2025-10-02
**Version:** 1.0.0
**Services:** Frontend (React) + Backend (Node.js) + Nginx (Optional)
