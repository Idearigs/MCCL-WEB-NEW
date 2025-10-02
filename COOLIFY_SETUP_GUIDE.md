# 🎯 Coolify Configuration Guide - Frontend + Backend

Based on your current Coolify setup, here's what you need to configure for both services.

---

## 📋 Current Setup Analysis

From your screenshot, you already have:
- ✅ Name: MCCL
- ✅ Build Pack: Dockerfile
- ✅ Dockerfile Location: `./Dockerfile`
- ✅ Base Directory: `/`
- ✅ Domain configured
- ✅ Ports: 3000:3000

---

## 🔄 What Needs to Change

You need to create **TWO separate services** in Coolify:

### **Service 1: Frontend (Current Configuration)**
### **Service 2: Backend (New Configuration)**

---

## 🎨 Frontend Service Configuration

### General Tab
```
Name: McCulloch-Frontend
Build Pack: Dockerfile
Dockerfile Location: ./Dockerfile.frontend
Base Directory: /
```

### Network Tab
```
Ports Exposes: 80
Ports Mappings: 3000:80
Domain: buymediamonds.co.uk (or your domain)
Direction: ✅ Allow www & non-www
```

### Build Tab
```
Dockerfile Location: ./Dockerfile.frontend
Docker Build Stage Target: (leave empty)
```

### Environment Variables Tab
```env
NODE_ENV=production
VITE_API_URL=https://api.buymediamonds.co.uk/api/v1
```

*Note: If you don't have a separate API subdomain, use:*
```env
VITE_API_URL=http://31.97.116.89:5000/api/v1
```

### Advanced Tab
- No persistent storage needed for frontend

---

## ⚙️ Backend Service Configuration

Click **"Add New Service"** in your MCCL project.

### General Tab
```
Name: McCulloch-Backend
Build Pack: Dockerfile
Dockerfile Location: ./Dockerfile
Base Directory: /Server
```

### Network Tab
```
Ports Exposes: 3000
Ports Mappings: 5000:3000
Domain: api.buymediamonds.co.uk (recommended)
       OR leave empty to use IP: http://31.97.116.89:5000
Direction: ✅ Allow www & non-www (if using domain)
```

### Build Tab
```
Base Directory: /Server
Dockerfile Location: ./Dockerfile
Docker Build Stage Target: (leave empty)
Custom Docker Options: (leave empty)
```

### Environment Variables Tab

Copy **ALL** these variables:

```env
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database Configuration
PG_HOST=31.97.116.89
PG_PORT=5433
PG_DATABASE=mcculloch_db
PG_USERNAME=mcculloch_admin
PG_PASSWORD=#mcculloch_admin#20026

# MongoDB Configuration
MONGODB_URI=mongodb://mcculloch-mdb:%23mcculloch_admin%2320026@31.97.116.89:27019/mcculloch_logs

# JWT Configuration
JWT_SECRET=mcculloch_jwt_secret_key_2024_production_secure_random_string
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=mcculloch_refresh_secret_2024_production

# CORS Configuration (UPDATE with your actual frontend URL)
ALLOWED_ORIGINS=https://buymediamonds.co.uk,http://buymediamonds.co.uk,https://www.buymediamonds.co.uk,http://www.buymediamonds.co.uk,http://31.97.116.89:3000,https://31.97.116.89:3000

# Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads

# Security Configuration
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=combined
```

### Persistent Storage Tab

Add a volume for uploads:

```
Name: backend-uploads
Source Path: /app/uploads
Destination Path: /uploads
Type: Volume
```

### Advanced Tab
```
Healthcheck: (leave as default, already configured in Dockerfile)
Restart Policy: unless-stopped
```

---

## 📝 Step-by-Step Deployment Process

### Step 1: Update Existing Frontend Service

1. Go to your **MCCL service** in Coolify
2. Go to **Configuration** tab
3. Update **Dockerfile Location** to: `./Dockerfile.frontend`
4. Go to **Network** tab
5. Update **Ports Mappings** to: `3000:80`
6. Go to **Environment Variables**
7. Add: `VITE_API_URL=https://api.buymediamonds.co.uk/api/v1`
8. Click **"Save"**

### Step 2: Create Backend Service

1. Go to **Projects** → **MCCL** → Click **"Add New Service"**
2. Select **"Application"**
3. Choose **"Docker"** as source
4. Configure as shown in "Backend Service Configuration" above
5. Click **"Save"**

### Step 3: Deploy Both Services

1. **Deploy Backend First:**
   - Go to Backend service
   - Click **"Deploy"**
   - Wait for deployment to complete
   - Check logs for "🚀 Server running on port 3000"

2. **Initialize Backend Database:**
   ```bash
   # Find backend container
   docker ps | grep mcculloch-backend

   # Access container
   docker exec -it <backend-container-id> sh

   # Sync database
   node -e "require('./models').sequelize.sync({ alter: true })"

   # Create admin user
   node quick-admin.js

   # Exit
   exit
   ```

3. **Deploy Frontend:**
   - Go to Frontend service
   - Click **"Deploy"**
   - Wait for deployment to complete

### Step 4: Verify Deployment

```bash
# Test backend health
curl http://31.97.116.89:5000/api/v1/health
# or
curl https://api.buymediamonds.co.uk/api/v1/health

# Test frontend
curl http://31.97.116.89:3000
# or
curl https://buymediamonds.co.uk

# Test API from frontend perspective
curl https://buymediamonds.co.uk
# Open browser console (F12) and check Network tab
```

---

## 🔍 Configuration Verification Checklist

### Frontend Service ✅
- [ ] Dockerfile Location: `./Dockerfile.frontend`
- [ ] Port Mapping: `3000:80`
- [ ] Domain configured (or accessible via IP)
- [ ] Environment variable `VITE_API_URL` set
- [ ] Service shows "Running" status
- [ ] Can access website in browser

### Backend Service ✅
- [ ] Dockerfile Location: `./Dockerfile`
- [ ] Base Directory: `/Server`
- [ ] Port Mapping: `5000:3000`
- [ ] All environment variables copied
- [ ] Persistent storage configured for uploads
- [ ] Service shows "Running" status
- [ ] Health check passes: `/api/v1/health`

---

## 🔗 URL Structure

After both services are deployed:

### With Domains:
- **Frontend:** `https://buymediamonds.co.uk`
- **Backend API:** `https://api.buymediamonds.co.uk/api/v1`
- **Uploads:** `https://api.buymediamonds.co.uk/uploads/`

### With IP Addresses:
- **Frontend:** `http://31.97.116.89:3000`
- **Backend API:** `http://31.97.116.89:5000/api/v1`
- **Uploads:** `http://31.97.116.89:5000/uploads/`

---

## 🆚 Comparison: Before vs After

### Before (Current Screenshot):
```
MCCL Service:
- Dockerfile: ./Dockerfile (frontend only)
- Port: 3000:3000
- Status: Running ✅
```

### After (New Setup):
```
McCulloch-Frontend Service:
- Dockerfile: ./Dockerfile.frontend
- Port: 3000:80
- Domain: buymediamonds.co.uk
- Status: Running ✅

McCulloch-Backend Service:
- Dockerfile: ./Dockerfile
- Base Dir: /Server
- Port: 5000:3000
- Domain: api.buymediamonds.co.uk
- Persistent Storage: ✅
- Environment Variables: ✅
- Status: Running ✅
```

---

## 🚨 Important Notes

### 1. Don't Delete Current Service Yet!
Keep your current MCCL service running while you:
1. Create the new backend service
2. Test backend works
3. Then update frontend service

### 2. Update Frontend VITE_API_URL
The frontend MUST know where to find the backend. Options:

**Option A: Using subdomain (Recommended)**
```env
VITE_API_URL=https://api.buymediamonds.co.uk/api/v1
```

**Option B: Using IP and port**
```env
VITE_API_URL=http://31.97.116.89:5000/api/v1
```

### 3. CORS Configuration
Make sure backend `ALLOWED_ORIGINS` includes your frontend URL:
```env
ALLOWED_ORIGINS=https://buymediamonds.co.uk,http://31.97.116.89:3000
```

### 4. Database Must Be Accessible
Backend needs access to:
- PostgreSQL at `31.97.116.89:5433`
- MongoDB at `31.97.116.89:27019`

Test from backend container:
```bash
docker exec -it <backend-container> sh
nc -zv 31.97.116.89 5433  # Test PostgreSQL
nc -zv 31.97.116.89 27019 # Test MongoDB
```

---

## 🐛 Troubleshooting

### Issue: Frontend Can't Reach Backend

**Check:**
1. Is `VITE_API_URL` set correctly?
2. Is backend service running?
3. Test backend health: `curl http://31.97.116.89:5000/api/v1/health`
4. Check browser console for CORS errors
5. Verify `ALLOWED_ORIGINS` includes frontend URL

**Fix:**
- Redeploy frontend after updating `VITE_API_URL`
- Update backend `ALLOWED_ORIGINS` if CORS error
- Check Coolify logs for both services

### Issue: Backend Won't Start

**Check:**
1. Environment variables all set?
2. Database accessible from container?
3. Dockerfile location correct? (`/Server/Dockerfile`)
4. Base directory set to `/Server`?

**Fix:**
```bash
# Check logs
docker logs <backend-container>

# Check database connectivity
docker exec -it <backend-container> node check-db.js

# Re-sync database
docker exec -it <backend-container> node -e "require('./models').sequelize.sync({ alter: true })"
```

### Issue: Uploads Not Persisting

**Check:**
1. Persistent storage configured in Coolify?
2. Volume mounted correctly?

**Fix:**
- Add persistent storage in Coolify:
  - Name: `backend-uploads`
  - Source: `/app/uploads`
  - Destination: `/uploads`
- Redeploy backend

---

## ✅ Final Deployment Checklist

Before going live:

- [ ] Both services deployed successfully
- [ ] Frontend loads at domain/IP
- [ ] Backend health check passes
- [ ] Frontend can fetch data from backend (check browser console)
- [ ] Admin panel accessible
- [ ] Admin login works
- [ ] File uploads work
- [ ] Database initialized with tables
- [ ] Admin user created
- [ ] No errors in Coolify logs
- [ ] SSL certificates configured (if using domains)
- [ ] Environment variables secure (no defaults)
- [ ] Backups configured

---

## 📞 Quick Test Commands

After deployment, run these to verify:

```bash
# Test backend health
curl http://31.97.116.89:5000/api/v1/health

# Test watch brands API
curl http://31.97.116.89:5000/api/v1/watches/brands

# Test products API
curl http://31.97.116.89:5000/api/v1/products

# Test frontend
curl http://31.97.116.89:3000

# Test admin login
curl -X POST http://31.97.116.89:5000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mcculloch.com","password":"your_password"}'
```

---

**Ready to Deploy?** Follow Step 1-4 above! 🚀

**Need Help?** Check:
- `DOCKER_DEPLOYMENT.md` - Full Docker guide
- `Server/COMPLETE_DEPLOYMENT_GUIDE.md` - Backend API docs
- `Server/QUICK_DEPLOY.md` - Quick reference
