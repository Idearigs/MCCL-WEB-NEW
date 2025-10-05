# User Authentication & Favorites System - Integration Guide

## 🎉 What's Been Built

A complete, modern user authentication and favorites/wishlist system with:

### ✅ Backend (Complete)
- **Database Schema**: Users, favorites, addresses, refresh tokens tables
- **Authentication API**: Signup, login, logout, refresh tokens, profile management
- **Favorites API**: Add, remove, toggle, list favorites
- **JWT Authentication**: Access tokens (15min) + refresh tokens (7 days)
- **Security**: Password hashing (bcrypt), email validation, token management

### ✅ Frontend (Complete)
- **UserAuthContext**: Complete authentication state management
- **FavoritesContext**: Favorites/wishlist state management
- **AuthModal**: Luxury login/signup modal with password strength indicator
- **Account Menu**: Dropdown menu with user profile and navigation
- **FavoriteButton**: Reusable heart button component for products
- **Account Page**: User profile and account management
- **Favorites Page**: Beautiful wishlist page
- **Routes**: All new routes added to App.tsx

---

## 🔧 Integration Steps

### Step 1: Update Navigation Components

You need to update **LuxuryNavigation.tsx** and **LuxuryNavigationWhite.tsx** to:

1. Add state for AuthModal
2. Import AccountMenu component
3. Replace existing Account icon with AccountMenu
4. Add Favorites heart icon with count badge
5. Integrate AuthModal

#### Example Integration:

```typescript
import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import AuthModal from './AuthModal';
import AccountMenu from './AccountMenu';
import { useFavorites } from '../contexts/FavoritesContext';
import { Link } from 'react-router-dom';

// Inside your navigation component:
const [authModalOpen, setAuthModalOpen] = useState(false);
const [authModalView, setAuthModalView] = useState<'login' | 'signup'>('login');
const { favoritesCount } = useFavorites();

// Replace the existing Account section with:
<div className="flex items-center gap-4">
  {/* Favorites Heart */}
  <Link to="/favorites" className="relative p-2 hover:bg-gray-50 rounded-md transition-colors">
    <Heart className="w-5 h-5 text-gray-700" />
    {favoritesCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
        {favoritesCount}
      </span>
    )}
  </Link>

  {/* Account Menu */}
  <AccountMenu onLoginClick={() => setAuthModalOpen(true)} />

  {/* Cart icon (your existing cart code) */}
  {/* ... */}
</div>

// At the end of your component, before the closing tag:
<AuthModal
  isOpen={authModalOpen}
  onClose={() => setAuthModalOpen(false)}
  initialView={authModalView}
/>
```

---

## 📦 Adding Favorite Buttons to Product Cards

To add favorites functionality to your product listings:

```typescript
import FavoriteButton from '../components/FavoriteButton';

// In your product card component:
<div className="relative">
  <img src={product.image} alt={product.name} />

  {/* Favorite button in top-right corner */}
  <div className="absolute top-3 right-3">
    <FavoriteButton
      productId={product.id}
      onAuthRequired={() => {
        // Open auth modal if user not logged in
        setAuthModalOpen(true);
      }}
    />
  </div>
</div>
```

---

## 🗄️ Database Migration

Before testing, run the database migration:

```bash
cd Server
psql -U your_username -d your_database -f migrations/006_create_users_and_favorites.sql
```

Or add it to your migration runner if you have one.

---

## 🔑 Environment Variables

Make sure these are set in your backend `.env`:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
NODE_ENV=production # or development
```

---

## 🎨 Design Features

### Authentication Modal
- **Luxury Design**: Minimal, clean interface with gold accents
- **Password Strength**: Real-time indicator (Weak/Fair/Good/Strong)
- **Form Validation**: Email format, password length
- **Remember Me**: Extended session option
- **Smooth Animations**: Fade in/out, slide effects
- **Error Handling**: User-friendly error messages

### Favorites System
- **Heart Animation**: Smooth fill animation on favorite
- **Login Prompt**: Tooltip for unauthenticated users
- **Real-time Updates**: Instant UI updates
- **Count Badge**: Shows number of favorites
- **Persistent Storage**: Database-backed

### Account Menu
- **User Avatar**: Gradient circle with initial
- **Dropdown Menu**: Profile, favorites, orders, settings
- **Stats Display**: Quick view of favorites count
- **Smooth Transitions**: Elegant hover states

---

## 🧪 Testing Checklist

### Authentication Flow
- [ ] Sign up with new email
- [ ] Receive success message
- [ ] Automatically logged in after signup
- [ ] Log out
- [ ] Log back in with same credentials
- [ ] "Remember me" checkbox works
- [ ] Password strength indicator shows correctly
- [ ] Error messages for invalid credentials
- [ ] Token refresh works (test by waiting 15+ minutes)

### Favorites Flow
- [ ] Add product to favorites (heart turns red)
- [ ] Remove from favorites (heart becomes outline)
- [ ] View favorites page
- [ ] Favorites persist after logout/login
- [ ] Add to cart from favorites page
- [ ] Remove from favorites page
- [ ] Favorites count shows in navigation
- [ ] Unauthenticated users see login prompt

### Navigation Integration
- [ ] Account menu shows when logged in
- [ ] "Account" button shows when logged out
- [ ] Clicking "Account" when logged out opens auth modal
- [ ] Favorites heart icon shows count badge
- [ ] Dropdown menu works correctly
- [ ] All menu links navigate properly

---

## 🎯 API Endpoints

### Authentication
```
POST /api/v1/users/signup
POST /api/v1/users/login
POST /api/v1/users/logout
POST /api/v1/users/refresh
GET  /api/v1/users/profile
PUT  /api/v1/users/profile
POST /api/v1/users/change-password
```

### Favorites
```
GET    /api/v1/favorites
POST   /api/v1/favorites
DELETE /api/v1/favorites/:productId
PUT    /api/v1/favorites/:productId
GET    /api/v1/favorites/check/:productId
POST   /api/v1/favorites/toggle/:productId
```

---

## 🎨 Component Props Reference

### AuthModal
```typescript
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'signup';
}
```

### AccountMenu
```typescript
interface AccountMenuProps {
  onLoginClick: () => void; // Called when user clicks login while not authenticated
}
```

### FavoriteButton
```typescript
interface FavoriteButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  onAuthRequired?: () => void; // Callback to open auth modal
}
```

---

## 🚀 Quick Start for Testing

1. **Run database migration**
2. **Start backend**: `cd Server && npm run dev`
3. **Start frontend**: `cd Client && npm run dev`
4. **Open browser**: http://localhost:5173
5. **Click Account** → Sign up with test email
6. **Browse products** → Click heart icons
7. **View Favorites** → Check your wishlist

---

## 🎁 Features Included

### User Features
✅ Email/password authentication
✅ JWT with refresh tokens
✅ Session persistence (Remember me)
✅ User profile management
✅ Favorites/wishlist
✅ Account overview page
✅ Password strength validation
✅ Email verification ready (tokens generated)
✅ Password reset ready (tokens generated)

### Developer Features
✅ TypeScript throughout
✅ React Context for state
✅ Reusable components
✅ Responsive design
✅ Error handling
✅ Loading states
✅ Animations
✅ Security best practices

---

## 📝 Next Steps (Optional Enhancements)

1. **Email Verification**: Implement email sending service (SendGrid, AWS SES)
2. **Password Reset**: Add forgot password email flow
3. **Social Login**: Google/Facebook OAuth integration
4. **Profile Photos**: Avatar upload functionality
5. **Order History**: Link with orders system
6. **Notifications**: Toast notifications for actions
7. **Two-Factor Auth**: Additional security layer

---

## 🎨 Brand Consistency

The system matches your McCulloch Jewellers brand:
- **Colors**: Amber/gold accents (#D97706, #B45309)
- **Typography**: Light font weights, elegant spacing
- **Animations**: Subtle, sophisticated transitions
- **Icons**: Lucide icons matching existing design
- **Shadows**: Soft, premium shadows
- **Borders**: Minimal, clean lines

---

## 🆘 Troubleshooting

### "Cannot read properties of undefined"
- Make sure providers are wrapped correctly in App.tsx
- UserAuthProvider → FavoritesProvider → CartProvider

### JWT Token Errors
- Check JWT_SECRET in backend .env
- Clear localStorage and try logging in again

### Favorites not persisting
- Run database migration
- Check network tab for API errors
- Verify user is authenticated

### Modal not opening
- Check state management in navigation
- Verify AuthModal is imported and rendered
- Check for console errors

---

**Created**: 2025-01-03
**System**: McCulloch Jewellers User Authentication & Favorites
**Status**: ✅ Ready for Integration
