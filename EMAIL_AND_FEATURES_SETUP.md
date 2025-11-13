# Email Notifications & Enhanced Features Setup Guide

## 📧 Email System Setup (CRITICAL - DO THIS FIRST)

### Step 1: Gmail Configuration

1. **Create a Gmail App Password:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Factor Authentication if not already enabled
   - Go to "App passwords" (search for it)
   - Select "Mail" and "Windows Computer"
   - Copy the generated 16-character password

2. **Add to .env file:**
   ```env
   # Email Configuration
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx  # The 16-char password from above
   SUPPORT_EMAIL=support@mcculloch.com
   FRONTEND_URL=http://localhost:8080
   ```

### Step 2: Install Email Dependency

```bash
cd "C:\xampp\htdocs\testmccl\McCulloch Website\McCulloch Website\Server"
npm install nodemailer
```

### Step 3: Verify Logger Utility Exists

The system uses a logger utility. If you don't have one, create `Server/utils/logger.js`:

```javascript
const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${message}`, JSON.stringify(meta));
  },
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${message}`, JSON.stringify(meta));
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${message}`, JSON.stringify(meta));
  }
};

module.exports = logger;
```

---

## 🎯 Features Implemented

### 1. ✅ Order Confirmation Emails
**Location:** `Server/services/emailService.js`

**Triggers When:**
- Customer completes payment successfully
- Order is created in the database

**Email Contents:**
- Order number (MCL-YYYYMMDD-XXXXX format)
- Customer name
- Order date
- List of items purchased (product name, qty, price)
- Total amount with breakdown (subtotal, tax, total)
- Shipping address
- Status tracking link
- Payment confirmation badge

**Styling:** Professional luxury email template with McCulloch branding

### 2. ✅ Order Status Update Emails
**Location:** `Server/services/emailService.js`

**Triggers When:**
- Admin changes order status to: pending → processing → shipped → delivered → cancelled

**Email Contents:**
- Order number
- New status with color-coded badge
- Status-specific message
- Tracking number (if available)
- Link to view full order details

**Status Messages:**
- **Processing:** "Your order is currently being prepared and packaged for shipment"
- **Shipped:** "Your order has been shipped! Track using: [tracking number]"
- **Delivered:** "Your order has been delivered successfully"
- **Cancelled:** "Your order has been cancelled. Contact support for details"

### 3. ✅ Quick Status Change in Admin Orders
**Location:** `Client/src/admin/pages/AdminOrders.tsx`

**Features:**
- Click the status badge in the Order Status column
- Dropdown appears with all 5 statuses
- Select new status to update immediately
- No need to open the modal
- Status updates and customer receives email automatically
- Loading state while updating

**How It Works:**
1. Admin clicks status badge
2. Dropdown menu appears
3. Admin selects new status
4. API sends status update request
5. Email automatically sent to customer
6. List updates in real-time

---

## 🔐 Backend Changes Made

### Modified Files:

#### 1. `Server/controllers/stripeController.js`
**Changes:**
- Added email service import
- Send order confirmation email after successful payment
- Send status update email when order status changes
- Error handling (email failures don't break order creation)

**Key Functions:**
```javascript
// Line 149-166: After order creation
await sendOrderConfirmationEmail({
  id, customerEmail, customerName, orderNumber,
  totalAmount, currency, items, shippingAddress, createdAt
});

// Line 487-500: When status is updated
await sendOrderStatusUpdateEmail({
  customerEmail, customerName, orderNumber, trackingNumber
}, newStatus);
```

#### 2. `Server/services/emailService.js` (NEW)
- `sendOrderConfirmationEmail()` - Sends order confirmation with HTML template
- `sendOrderStatusUpdateEmail()` - Sends status updates with custom messages
- Beautiful HTML email templates with McCulloch branding
- Nodemailer integration with Gmail

---

## 🎨 Frontend Changes Made

### Modified Files:

#### 1. `Client/src/admin/pages/AdminOrders.tsx`
**Changes:**
- Added state: `updatingOrderId`, `openStatusDropdown`
- Added `validStatuses` array
- Replaced static status badge with interactive dropdown
- Status dropdown shows all options
- Current status marked with ✓
- Loading state during update
- Smooth animations and hover effects

**User Experience:**
- Click status badge → dropdown appears
- Select new status → immediate update
- Email sent to customer automatically
- List refreshes in real-time

---

## 🚀 Testing the Features

### 1. Test Email System:
1. Make a payment in the application
2. Check customer email for order confirmation
3. Go to Admin Orders
4. Click order status badge
5. Change status (e.g., pending → processing)
6. Check customer email for status update

### 2. Test Email Content:
- Verify order number is correct
- Verify items are listed correctly
- Verify total amount is correct
- Verify shipping address is complete
- Verify status messages are appropriate

### 3. Admin Functionality:
- Click different status badges
- Verify dropdown appears
- Verify all 5 statuses are available
- Verify loading state appears
- Verify orders list updates
- Verify modal still works for detailed view

---

## 📋 Environment Variables Required

Add to your `.env` file in the Server directory:

```env
# Email Configuration (REQUIRED FOR EMAILS TO WORK)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
SUPPORT_EMAIL=support@mcculloch.com
FRONTEND_URL=http://localhost:8080

# Existing variables
DATABASE_URL=...
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
```

---

## ⚠️ Important Notes

### Email Sending:
- Emails are sent **asynchronously** (don't block the API response)
- If email fails, the order is still created successfully
- Check server logs for email errors
- Gmail might block the app initially - you'll need to approve it

### Rate Limiting:
- Gmail has rate limits (around 300 emails/hour)
- For testing, use small batches
- For production, consider SendGrid or AWS SES

### Email Delivery:
- May take 1-5 seconds per email
- Check spam folder if not received
- Verify sender address in Gmail settings

---

## 📚 Files Created/Modified

### Created:
- `Server/services/emailService.js` - Email service with templates

### Modified:
- `Server/controllers/stripeController.js` - Added email sending
- `Client/src/admin/pages/AdminOrders.tsx` - Added inline status dropdown

### To Create:
- `Server/utils/logger.js` - If doesn't exist

---

## 🎯 Next Steps (Optional Enhancements)

1. **Customer Order History Page** - Display all customer's orders
2. **Google Auth in Checkout** - Prompt user to sign in before checkout
3. **Email Templates** - Further customize with brand assets
4. **SMS Notifications** - Add SMS for order updates
5. **Email Analytics** - Track open rates and clicks

---

## 🐛 Troubleshooting

### Emails not sending?
1. Check `.env` file has correct credentials
2. Check Gmail account security settings
3. Verify app password (not regular password)
4. Check server logs for errors
5. Test with `GMAIL_USER` sending to itself first

### Status dropdown not appearing?
1. Verify AdminOrders.tsx was updated correctly
2. Check browser console for JavaScript errors
3. Verify admin is properly authenticated
4. Clear browser cache and reload

### Email content issues?
1. Check email subject line matches expectation
2. Verify order number format (MCL-YYYYMMDD-XXXXX)
3. Check shipping address parsing
4. Verify CSS styling in email client

---

**Status:** ✅ Email system fully implemented and ready to use!
