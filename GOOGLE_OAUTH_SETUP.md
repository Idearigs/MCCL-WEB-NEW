# Google OAuth Setup Guide

## ✅ Changes Made

1. **Email Verification Disabled** (temporarily)
   - All new signups are auto-verified
   - No email required until SMTP is configured
   - Simple sign up → login flow

2. **Google Sign-In Added**
   - "Continue with Google" button in auth modal
   - Auto-creates account from Google profile
   - No password needed for Google users

---

## 🔧 To Enable Google Sign-In

### Step 1: Create Google Cloud Project

1. Go to: https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name: `McCulloch Jewellers`
4. Click "Create"

### Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click "Enable"

### Step 3: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Click "Configure Consent Screen" first:
   - User Type: **External**
   - App name: `McCulloch Jewellers`
   - User support email: `your-email@gmail.com`
   - Developer contact: `your-email@gmail.com`
   - Click "Save and Continue" (skip optional fields)

4. Back to "Create OAuth client ID":
   - Application type: **Web application**
   - Name: `McCulloch Web`

   - **Authorized JavaScript origins:**
     - `http://localhost:8080` (for development)
     - `https://buymediamonds.co.uk` (for production)

   - **Authorized redirect URIs:**
     - `http://localhost:5000/api/v1/auth/google/callback` (development)
     - `https://api.buymediamonds.co.uk/api/v1/auth/google/callback` (production)

   - Click "Create"

5. **Copy the credentials:**
   - Client ID: `123456789-abc123def456.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-abcd1234efgh5678`

### Step 4: Update .env File

Add to `Server/.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcd1234efgh5678
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback
```

For production, update to:
```env
GOOGLE_CALLBACK_URL=https://api.buymediamonds.co.uk/api/v1/auth/google/callback
```

### Step 5: Restart Server

```bash
# Restart your backend
cd Server
npm run dev
```

---

## 🎯 How It Works

### User Flow:

1. **User clicks "Continue with Google"**
   - Redirects to Google login page
   - User signs in with Google account

2. **Google redirects back to your app**
   - URL: `http://localhost:5000/api/v1/auth/google/callback`
   - Includes Google profile data

3. **Backend checks if user exists**
   - If exists: Return user + tokens
   - If new: Create account with Google data

4. **Frontend receives tokens**
   - Redirects to `/auth/callback?accessToken=xxx&refreshToken=yyy`
   - Stores tokens in localStorage
   - Redirects to `/account`

5. **User is logged in!**
   - No password needed
   - Email pre-verified (from Google)
   - Profile picture from Google

---

## 🔒 Security Notes

- Google accounts are **pre-verified** (email_verified = TRUE)
- No password stored for Google users (password_hash = 'GOOGLE_OAUTH')
- User can't use email/password login if signed up with Google
- Tokens are short-lived (15min access, 7 days refresh)

---

## 📝 What's in the Database

When a user signs in with Google:

```sql
INSERT INTO users (
  email,                -- from Google
  first_name,           -- from Google (given name)
  last_name,            -- from Google (family name)
  email_verified,       -- TRUE (Google verified)
  avatar_url,           -- Google profile picture
  password_hash         -- 'GOOGLE_OAUTH' (no password)
)
```

---

## 🧪 Testing

1. Start backend: `cd Server && npm run dev`
2. Start frontend: `cd Client && npm run dev`
3. Open: http://localhost:8080
4. Click Account → "Continue with Google"
5. Sign in with Google
6. Should redirect to Account page logged in!

---

## 🚀 For Production

1. **Update Google OAuth credentials:**
   - Add production domains to authorized origins
   - Add production callback URL

2. **Update .env on VPS:**
   ```env
   GOOGLE_CALLBACK_URL=https://api.buymediamonds.co.uk/api/v1/auth/google/callback
   FRONTEND_URL=https://buymediamonds.co.uk
   ```

3. **Redeploy backend with new env vars**

---

## 🐛 Troubleshooting

**Issue: "Redirect URI mismatch"**
- Check callback URL in Google Console matches `.env` exactly
- Make sure to include `/api/v1/auth/google/callback`

**Issue: "Google+ API not enabled"**
- Enable Google+ API in Google Cloud Console

**Issue: "User not created"**
- Check server logs for database errors
- Verify database migration ran successfully

---

## 📧 Email Setup (For Later)

When you're ready to enable email verification:

1. **Set up SMTP** (Resend/SendGrid/Unsend)
2. **Update `Server/routes/users.js`:**
   - Uncomment email sending code (lines 119-125)
   - Remove auto-verification (lines 111-117)
3. **Update `.env` with SMTP credentials**
4. **Restart server**

---

## ✨ Features Now Available

✅ **Email/Password Signup** - Auto-verified for now
✅ **Email/Password Login** - Standard authentication
✅ **Google Sign-In** - One-click OAuth
✅ **Account Page** - User profile management
✅ **Favorites** - Wishlist functionality
✅ **JWT Tokens** - Secure session management

🔜 **Email Verification** - When SMTP is configured
🔜 **Password Reset** - Email-based recovery
🔜 **Welcome Emails** - After verification

---

## 🎉 Summary

**What works NOW:**
- ✅ Sign up with email/password (auto-verified)
- ✅ Sign in with email/password
- ✅ Sign in with Google (needs OAuth setup)
- ✅ No email sending (disabled until SMTP ready)
- ✅ Full account management

**Next steps:**
1. Get Google OAuth credentials (5 min)
2. Configure SMTP when ready (later)
3. Test everything works!
