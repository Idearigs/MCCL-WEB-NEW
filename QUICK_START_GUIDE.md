# Quick Start Guide - New Features

## 🚀 What's Been Implemented

### ✅ Email Notifications
- Order confirmation emails with order details
- Order status update emails (automatic when admin changes status)
- Professional HTML templates with McCulloch branding

### ✅ Admin Order Management
- Click order status badge in admin orders list
- Select new status from dropdown (no modal needed!)
- Status updates instantly
- Customer automatically receives email

### ✅ Google Authentication in Checkout
- Unauthenticated users see auth modal on checkout page
- Options: Sign in with Google or continue as guest
- After signup, immediately shows checkout form
- Logged-in users can see order history later

---

## ⚡ IMPORTANT: Setup Email Feature

### Step 1: Gmail Configuration (5 minutes)

1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication (if not already)
3. Search for "App passwords"
4. Select: Mail → Windows Computer
5. Copy the 16-character password

### Step 2: Update .env File

Open `Server/.env` and add:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
SUPPORT_EMAIL=support@mcculloch.com
FRONTEND_URL=http://localhost:8080
```

### Step 3: Install Dependency

```bash
cd "C:\xampp\htdocs\testmccl\McCulloch Website\McCulloch Website\Server"
npm install nodemailer
```

### Step 4: Restart Server

```bash
# Kill existing process and restart
npm run dev
```

---

## 🧪 Quick Testing (5 minutes)

### Test Email Feature:
1. Go to http://localhost:8080
2. Add item to cart
3. Go to checkout
4. Fill form and complete payment (use 4242 4242 4242 4242)
5. Check email for order confirmation
6. Go to Admin Orders
7. Click status badge → select "processing"
8. Check email for status update

### Test Google Auth:
1. Go to http://localhost:8080/checkout
2. Auth modal appears
3. Click "Continue with Google"
4. Sign in with Google
5. Redirected back to checkout
6. Proceed with payment

### Test Quick Status Change:
1. Go to Admin → Orders
2. Click any order's status badge
3. Dropdown appears
4. Select different status
5. Order updates immediately
6. Customer email sent (if email configured)

---

## 📋 What Each Feature Does

### 1. Email System

**Order Confirmation Email:**
- Sent when payment succeeds
- Contains: Order number, items, total, shipping address
- Includes: Tracking link, order details
- Template: Professional McCulloch design

**Status Update Email:**
- Sent when admin changes order status
- Status-specific message (e.g., "Shipped - Track your package")
- Color-coded badge matching admin UI
- Professional email template

### 2. Admin Orders - Quick Status Change

**Before:** Click order → open modal → change status
**After:** Click status badge → select from dropdown → instant update

**Benefits:**
- Faster workflow for admin
- Real-time list updates
- Automatic customer notification
- No modal needed

### 3. Checkout Auth Modal

**Shows:**
- When user not logged in
- When visiting checkout page
- Only shows once per session

**Options:**
- Sign in with Google
- Create account with Google
- Continue as guest

**After Auth:**
- Redirected back to checkout
- Credentials saved (localStorage + server)
- Can later view order history

---

## 📊 Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Email: Order Confirmation | ✅ Done | Requires .env setup |
| Email: Status Updates | ✅ Done | Automatic when status changes |
| Admin: Inline Status Change | ✅ Done | Works immediately |
| Checkout: Google Auth Modal | ✅ Done | Shows automatically |
| Customer: View Order History | 🔄 In Progress | Page creation in progress |
| Account: Show Real Order Data | 🔄 In Progress | Fetching data in progress |

---

## 🔗 Important Files

### New Files Created:
- `Server/services/emailService.js` - Email templates
- `Client/src/components/CheckoutAuthModal.tsx` - Auth modal

### Modified Files:
- `Server/controllers/stripeController.js` - Email sending
- `Client/src/pages/Checkout.tsx` - Auth modal integration
- `Client/src/admin/pages/AdminOrders.tsx` - Inline status dropdown

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] .env file has email credentials
- [ ] nodemailer installed (`npm list nodemailer`)
- [ ] Server restarted successfully
- [ ] No console errors on startup
- [ ] Auth modal appears on checkout (when not logged in)
- [ ] Can sign in with Google
- [ ] Status dropdown appears in admin orders
- [ ] Test email received when order placed
- [ ] Test email received when status changed

---

## 🚨 If Something Doesn't Work

### Emails not sending:
```bash
# Check server logs for errors
# Verify .env credentials are correct
# Make sure Gmail allows 3rd party apps
# Try sending to Gmail account first (same as GMAIL_USER)
```

### Auth modal not showing:
```bash
# Check browser console for errors
# Clear browser cache (Ctrl+Shift+Delete)
# Verify localStorage is enabled
# Check /admin path works
```

### Status dropdown not working:
```bash
# Check API endpoint responds
# curl http://localhost:5000/api/v1/payments/order/any-id/status
# Verify admin is authenticated
# Check browser console for JS errors
```

---

## 📞 Support

### Check Server Logs:
- All errors logged to console
- Look for "[ERROR]" messages
- Check email sending status

### Check Browser Console:
- Press F12 while on page
- Go to "Console" tab
- Look for red error messages

### Check Database:
- Verify orders are created
- Verify order items are created
- Verify customer_email is populated

---

## 🎯 Next Phase (Coming Soon)

1. **Order History Page** - Customers see all their orders
2. **Account Profile Updates** - Shows real order count & total spent
3. **Order Tracking** - Track individual order status
4. **Email Customization** - Brand colors and contact info
5. **SMS Alerts** - Optional SMS notifications

---

## 📱 Quick Reference

### Email Setup:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=16-char-password-here
SUPPORT_EMAIL=support@mcculloch.com
FRONTEND_URL=http://localhost:8080
```

### API Endpoints Used:
- `POST /api/v1/payments/confirm` - Creates order, sends email
- `PATCH /api/v1/payments/order/{id}/status` - Updates status, sends email
- `GET /api/v1/auth/google` - OAuth with Google

### Key Components:
- `CheckoutAuthModal.tsx` - Auth UI
- `emailService.js` - Email templates
- `stripeController.js` - Payment handling

---

**Setup Time:** ~10 minutes
**Testing Time:** ~5 minutes
**Total:** Ready to use in 15 minutes!

