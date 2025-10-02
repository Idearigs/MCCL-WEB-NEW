# 🎯 How to Create New Service in Coolify

## Step-by-Step Guide to Add Backend Service

---

## 📍 Step 1: Navigate to Your Project

1. **Login to Coolify**
   - Go to your Coolify URL (your VPS IP or domain)
   - Login with your credentials

2. **Go to Projects**
   - Click **"Projects"** in the left sidebar
   - You should see your **"MCCL"** project (or whatever you named it)

3. **Open Your Project**
   - Click on the **"MCCL"** project card

---

## ➕ Step 2: Add New Service

You should now see your current services (likely just the frontend/MCCL service).

1. **Click "Add New Resource"** or **"+"** button
   - Look for a button that says **"Add Resource"**, **"New Service"**, or **"+"**
   - Usually located at the top right or center of the screen

2. **Select Service Type**
   - Choose **"Application"**
   - Then select **"Public Repository"** or **"Git"**

---

## 📝 Step 3: Configure Git Source

1. **Repository Settings**
   ```
   Source: [Select your Git provider - GitHub/GitLab/etc]
   Repository: [Select your repository]
   Branch: main (or your deployment branch)
   ```

2. **Click Continue or Next**

---

## ⚙️ Step 4: General Configuration

Now you'll see the configuration page similar to your screenshot.

### General Tab

Fill in these fields:

```
Name: McCulloch-Backend
Description: (optional) Backend API for McCulloch Website
```

### Build Pack

```
Build Pack: Dockerfile
```

### Dockerfile Location

```
Dockerfile Location: ./Dockerfile
```

### Base Directory

```
Base Directory: /Server
```

**Important:** The base directory should be `/Server` because that's where your backend code lives!

---

## 🌐 Step 5: Network Configuration

Click on the **"Network"** tab (or scroll down to Network section)

### Ports Configuration

```
Ports Exposes: 3000
```

**Port Mapping:**
```
Ports Mappings: 5000:3000
```

This means:
- Container runs on port 3000 internally
- Exposed as port 5000 externally
- You'll access it via: `http://31.97.116.89:5000`

### Domains (Optional but Recommended)

If you want to use a subdomain for your API:

```
Domains: api.buymediamonds.co.uk
```

Or leave empty to use IP:Port

```
Direction: ☑ Allow www & non-www (if using domain)
```

---

## 📦 Step 6: Environment Variables

Click on the **"Environment Variables"** tab

This is **THE MOST IMPORTANT STEP!**

Click **"Add Variable"** button for each of these:

### Copy All These Variables:

```env
NODE_ENV=production
PORT=3000
API_VERSION=v1
PG_HOST=31.97.116.89
PG_PORT=5433
PG_DATABASE=mcculloch_db
PG_USERNAME=mcculloch_admin
PG_PASSWORD=#mcculloch_admin#20026
MONGODB_URI=mongodb://mcculloch-mdb:%23mcculloch_admin%2320026@31.97.116.89:27019/mcculloch_logs
JWT_SECRET=mcculloch_jwt_secret_key_2024_production_secure_random_string
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=mcculloch_refresh_secret_2024_production
ALLOWED_ORIGINS=https://buymediamonds.co.uk,http://buymediamonds.co.uk,https://www.buymediamonds.co.uk,http://www.buymediamonds.co.uk,http://31.97.116.89:3000
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
LOG_FORMAT=combined
```

### How to Add:

For each variable:
1. Click **"Add Variable"** or **"+"**
2. Enter **Key** (e.g., `NODE_ENV`)
3. Enter **Value** (e.g., `production`)
4. Click **Save** or **Add**
5. Repeat for all variables

**Tip:** Some Coolify versions allow bulk import. Look for **"Import"** or **"Bulk Add"** button.

---

## 💾 Step 7: Persistent Storage

Click on the **"Persistent Storage"** or **"Volumes"** tab

This is for file uploads to persist across deployments.

Click **"Add Volume"** or **"Add Storage"**

```
Name: backend-uploads
Source Path: /app/uploads
Destination Path: /uploads
Type: Volume
```

Or fill in the form:

```
Volume Name: backend-uploads
Mount Path (Container): /app/uploads
Host Path (optional): leave empty
```

---

## 🔧 Step 8: Advanced Settings (Optional)

Click on **"Advanced"** tab

### Health Check
```
Leave as default (already configured in Dockerfile)
```

### Restart Policy
```
Restart Policy: unless-stopped
```

### Resource Limits (Optional)
```
Memory Limit: 1GB (or leave empty)
CPU Limit: 1 (or leave empty)
```

---

## 💾 Step 9: Save Configuration

1. **Review All Settings**
   - Make sure all tabs are filled correctly
   - Double-check environment variables
   - Verify port mappings

2. **Click "Save" or "Create"**
   - Usually at the top right or bottom of the page
   - This creates the service but doesn't deploy yet

---

## 🚀 Step 10: Deploy the Service

After saving, you should see your new service in the project.

1. **Find the "Deploy" Button**
   - Should be on the service card or detail page
   - Might say **"Deploy"**, **"Build & Deploy"**, or **"Start"**

2. **Click Deploy**
   - This will start building your Docker image
   - You'll see build logs

3. **Monitor the Deployment**
   - Watch the logs for any errors
   - Look for: **"🚀 Server running on port 3000"**
   - Status should change to **"Running"**

---

## ✅ Step 11: Verify Deployment

### Check Service Status

In Coolify:
- Service should show **"Running"** or **"Healthy"** status
- No errors in logs

### Test Endpoints

Open terminal or browser:

```bash
# Test health check
curl http://31.97.116.89:5000/api/v1/health

# Should return: {"success":true,"message":"API is healthy"}

# Test brands endpoint
curl http://31.97.116.89:5000/api/v1/watches/brands
```

If using domain:
```bash
curl https://api.buymediamonds.co.uk/api/v1/health
```

---

## 🗄️ Step 12: Initialize Database

**IMPORTANT:** First-time deployment only!

Find your backend container name/ID:

### Method 1: Via Coolify Terminal

Some Coolify versions have a **"Terminal"** or **"Console"** button:
1. Click **"Terminal"** on your backend service
2. Run these commands:

```bash
# Sync database tables
node -e "require('./models').sequelize.sync({ alter: true })"

# Create admin user
node quick-admin.js
```

### Method 2: Via SSH

If Coolify doesn't have terminal access:

```bash
# SSH to your VPS
ssh user@31.97.116.89

# Find container name
docker ps | grep mcculloch

# Access container (replace <container-name> with actual name)
docker exec -it <container-name> sh

# Sync database
node -e "require('./models').sequelize.sync({ alter: true })"

# Create admin user
node quick-admin.js

# Exit
exit
```

You should see output like:
```
✅ Database synced successfully!
✅ Admin user created!
Email: admin@mcculloch.com
Password: [your password]
```

---

## 📋 Quick Checklist

Before clicking "Deploy", verify:

- [ ] **General Tab**
  - [ ] Name: McCulloch-Backend
  - [ ] Build Pack: Dockerfile
  - [ ] Dockerfile Location: ./Dockerfile
  - [ ] Base Directory: /Server ⚠️ **Important!**

- [ ] **Network Tab**
  - [ ] Ports Exposes: 3000
  - [ ] Ports Mappings: 5000:3000
  - [ ] Domain (if using): api.buymediamonds.co.uk

- [ ] **Environment Variables Tab**
  - [ ] All 18+ variables added
  - [ ] DATABASE credentials correct
  - [ ] MONGODB_URI correct
  - [ ] JWT_SECRET set
  - [ ] ALLOWED_ORIGINS includes frontend URL

- [ ] **Persistent Storage Tab**
  - [ ] Volume added for uploads
  - [ ] Source: /app/uploads

- [ ] **Advanced Tab**
  - [ ] Restart policy: unless-stopped

---

## 🎯 Visual Flow Chart

```
┌─────────────────────────────────────┐
│  1. Go to Projects → MCCL           │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  2. Click "Add New Resource" / "+"  │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  3. Select "Application" → "Git"    │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  4. Configure Git Source            │
│     - Repository                    │
│     - Branch: main                  │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  5. Fill General Configuration      │
│     - Name: McCulloch-Backend       │
│     - Build Pack: Dockerfile        │
│     - Base Dir: /Server ⚠️          │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  6. Configure Network               │
│     - Ports: 5000:3000              │
│     - Domain (optional)             │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  7. Add ALL Environment Variables   │
│     (18+ variables)                 │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  8. Add Persistent Storage          │
│     - backend-uploads volume        │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  9. Review & Save                   │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  10. Click "Deploy"                 │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  11. Monitor Deployment Logs        │
│      Wait for "Running" status      │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  12. Initialize Database            │
│      (First time only)              │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  ✅ Backend Service Running!         │
│     Test: curl .../health           │
└─────────────────────────────────────┘
```

---

## ❓ Common Questions

### Q: Where do I find the "Add New Resource" button?

**A:** After clicking on your MCCL project, look for:
- **"+ New Resource"** button (usually top right)
- **"Add Resource"** button
- **"+"** icon
- Sometimes it's in a dropdown menu

### Q: What if I make a mistake?

**A:** You can edit the configuration after creating:
1. Click on the service
2. Go to **"Configuration"** or **"Settings"**
3. Update any field
4. Click **"Save"**
5. **"Redeploy"** for changes to take effect

### Q: Can I copy environment variables in bulk?

**A:** Depends on Coolify version:
- Some have **"Bulk Import"** or **"Import from .env"**
- Some require adding one by one
- Check for **"Import"** button in Environment Variables tab

### Q: Do I need to stop the frontend to add backend?

**A:** No! You can run multiple services simultaneously. They won't conflict.

### Q: What if base directory is wrong?

**A:** If you set base directory incorrectly:
1. Deployment will fail
2. Logs will show: "Dockerfile not found" or similar
3. Edit the service configuration
4. Update **Base Directory** to `/Server`
5. Redeploy

---

## 🐛 Troubleshooting

### Deployment Fails - "Dockerfile not found"

**Fix:**
- Check **Base Directory** is set to `/Server`
- Check **Dockerfile Location** is `./Dockerfile`

### Deployment Fails - "npm: not found" or build errors

**Fix:**
- Check you're using the correct Dockerfile
- Verify Dockerfile exists at `Server/Dockerfile`
- Check build logs for specific error

### Service Won't Start - "Port already in use"

**Fix:**
- Change external port mapping (e.g., `5001:3000` instead of `5000:3000`)
- Or stop the service using that port

### Can't Connect to Database

**Fix:**
- Verify environment variables are correct
- Check database is accessible from VPS
- Test: `telnet 31.97.116.89 5433`

---

## 📞 Next Steps After Service Creation

1. ✅ Service created and running
2. ✅ Database initialized
3. ➡️ **Update Frontend** to use new backend URL
4. ➡️ Test frontend-backend connection
5. ➡️ Test admin login
6. ➡️ Verify all features work

---

## 📚 Related Guides

- **COOLIFY_SETUP_GUIDE.md** - Complete Coolify configuration
- **DOCKER_DEPLOYMENT.md** - Docker Compose alternative
- **Server/QUICK_DEPLOY.md** - Quick commands
- **DEPLOYMENT_SUMMARY.md** - Overview

---

**Need Help?** Check the deployment guides or Coolify documentation!

Good luck! 🚀
