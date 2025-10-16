# Google OAuth Setup - Step by Step Guide

## 📋 What You'll Get

After this setup, users can click "Continue with Google" to sign in instantly with their Google account.

---

## 🚀 Step-by-Step Instructions

### Step 1: Go to Google Cloud Console

1. **Open your browser**
2. **Go to:** https://console.cloud.google.com/
3. **Sign in** with your Google account (use idearigs@gmail.com or any Gmail)

---

### Step 2: Create a New Project

1. **At the top of the page**, you'll see a dropdown that says "Select a project"
2. **Click** on it
3. **Click** "NEW PROJECT" button (top right of the popup)

   **Fill in:**
   - Project name: `McCulloch Jewellers`
   - Location: Leave as "No organization"

4. **Click** "CREATE"
5. **Wait** 10-15 seconds for project to be created
6. **Select** your new project from the dropdown

---

### Step 3: Enable Google+ API

1. **In the left sidebar**, click **"APIs & Services"** → **"Library"**
   (or go directly to: https://console.cloud.google.com/apis/library)

2. **In the search box**, type: `Google+ API`

3. **Click** on "Google+ API" from results

4. **Click** the blue **"ENABLE"** button

5. **Wait** for it to enable (5-10 seconds)

---

### Step 4: Configure OAuth Consent Screen

1. **In the left sidebar**, click **"OAuth consent screen"**
   (or go to: https://console.cloud.google.com/apis/credentials/consent)

2. **Choose User Type:**
   - Select **"External"**
   - Click **"CREATE"**

3. **Fill in App Information:**

   **OAuth consent screen (Step 1):**
   - App name: `McCulloch Jewellers`
   - User support email: `idearigs@gmail.com` (or your email)
   - App logo: (Skip for now)

   **Developer contact information:**
   - Email: `idearigs@gmail.com`

   - Click **"SAVE AND CONTINUE"**

4. **Scopes (Step 2):**
   - Click **"ADD OR REMOVE SCOPES"**
   - Check these scopes:
     ✅ `.../auth/userinfo.email`
     ✅ `.../auth/userinfo.profile`
   - Click **"UPDATE"**
   - Click **"SAVE AND CONTINUE"**

5. **Test users (Step 3):**
   - Click **"ADD USERS"**
   - Add your email: `idearigs@gmail.com`
   - Click **"ADD"**
   - Click **"SAVE AND CONTINUE"**

6. **Summary (Step 4):**
   - Review everything
   - Click **"BACK TO DASHBOARD"**

---

### Step 5: Create OAuth Credentials

1. **In the left sidebar**, click **"Credentials"**
   (or go to: https://console.cloud.google.com/apis/credentials)

2. **Click** the **"+ CREATE CREDENTIALS"** button at the top

3. **Select** "OAuth client ID"

4. **If you see "Configure Consent Screen"** - you already did this in Step 4, so this shouldn't appear

5. **Fill in the form:**

   **Application type:**
   - Select **"Web application"**

   **Name:**
   - Enter: `McCulloch Web App`

   **Authorized JavaScript origins:**
   - Click **"+ ADD URI"**
   - Enter: `http://localhost:8080`
   - Click **"+ ADD URI"** again
   - Enter: `https://buymediamonds.co.uk`

   **Authorized redirect URIs:**
   - Click **"+ ADD URI"**
   - Enter: `http://localhost:5000/api/v1/auth/google/callback`
   - Click **"+ ADD URI"** again
   - Enter: `https://api.buymediamonds.co.uk/api/v1/auth/google/callback`

6. **Click** "CREATE"

---

### Step 6: Copy Your Credentials

**A popup will appear with your credentials!**

**YOU'LL SEE:**
```
OAuth client created

Your Client ID
123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com

Your Client Secret
GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
```

**COPY BOTH OF THESE!** Keep them safe!

---

### Step 7: Add Credentials to Your Server

1. **Open your project** in VS Code or your editor

2. **Navigate to:** `Server/.env`

3. **Add these lines** (replace with your actual credentials):

```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:8080
```

4. **Save** the file

---

### Step 8: Restart Your Server

**In your terminal:**

```bash
# Stop the server (Ctrl+C if running)

# Restart it
cd "C:\xampp\htdocs\TESTMCCL\McCulloch Website\McCulloch Website\Server"
npm run dev
```

---

### Step 9: Test Google Sign-In! 🎉

1. **Open your browser** → http://localhost:8080

2. **Click** the Account icon (top right)

3. **You should see** the Auth modal with:
   - "Continue with Google" button (with Google logo)
   - OR divider
   - Email/password form

4. **Click** "Continue with Google"

5. **You'll be redirected to Google** to sign in

6. **Sign in** with your Google account

7. **Grant permissions** when asked

8. **You'll be redirected back** to your site - LOGGED IN! ✅

9. **Check Account page** - Your name and email from Google should appear!

---

## 🎯 Summary of What You Did

✅ Created Google Cloud Project
✅ Enabled Google+ API
✅ Configured OAuth Consent Screen
✅ Created OAuth Client ID
✅ Added JavaScript origins (your website URLs)
✅ Added redirect URIs (where Google sends users back)
✅ Got Client ID & Client Secret
✅ Added to `.env` file
✅ Restarted server

---

## 🐛 Troubleshooting

### Error: "Redirect URI mismatch"
**Fix:**
- Go back to Google Console → Credentials
- Click on your OAuth client
- Make sure redirect URI is **EXACTLY**: `http://localhost:5000/api/v1/auth/google/callback`
- Save and try again

### Error: "Google+ API not enabled"
**Fix:**
- Go to APIs & Services → Library
- Search "Google+ API"
- Click Enable

### Error: "Access blocked: This app's request is invalid"
**Fix:**
- Make sure you completed OAuth Consent Screen setup
- Add your email to Test Users
- Make sure app is not published (keep in Testing mode)

### Can't find the "CREATE CREDENTIALS" button?
**Fix:**
- Make sure you selected your project (top left dropdown)
- Go to: APIs & Services → Credentials
- The button is at the top of the page

---

## 📸 Visual Checklist

After completing all steps, you should have:

✅ **Google Cloud Console:**
- [ ] Project created: "McCulloch Jewellers"
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth client ID created
- [ ] Redirect URIs added

✅ **Your Code:**
- [ ] Client ID in `.env`
- [ ] Client Secret in `.env`
- [ ] Server restarted
- [ ] "Continue with Google" button appears
- [ ] Google sign-in works!

---

## 🎉 You're Done!

Users can now sign in with:
- ✅ Email/Password (manual signup)
- ✅ Google Account (one-click)

Both methods work perfectly!

Need help with any step? Let me know which step you're stuck on!
