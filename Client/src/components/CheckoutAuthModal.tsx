import React, { useState } from 'react';
import { X, LogIn, Mail } from 'lucide-react';
import API_BASE_URL from '../config/api';
import { useUserAuth } from '../contexts/UserAuthContext';

interface CheckoutAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthComplete: () => void;
  autoCloseOnAuth?: boolean;
}

const CheckoutAuthModal: React.FC<CheckoutAuthModalProps> = ({ isOpen, onClose, onAuthComplete }) => {
  const { user, isAuthenticated } = useUserAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // If already authenticated, show quick continue
  if (isAuthenticated && user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-light text-gray-900 mb-2">Welcome Back!</h2>
            <p className="text-gray-600 font-light mb-6">
              {user.firstName ? `Hi ${user.firstName}, ` : 'You\'re '} ready to complete your purchase.
            </p>
            <button
              onClick={onAuthComplete}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Continue to Checkout
            </button>
            <button
              onClick={onClose}
              className="w-full mt-3 text-gray-700 hover:text-gray-900 font-medium py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleGoogleAuth = () => {
    setIsLoading(true);
    // Save the checkout intent to localStorage
    localStorage.setItem('checkout_redirect', 'true');
    // Redirect to Google OAuth endpoint with checkout redirect
    window.location.href = `${API_BASE_URL}/auth/google?redirect_to=/checkout`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-light text-gray-900 mb-2">Sign In or Create Account</h2>
          <p className="text-gray-600 font-light text-sm">
            Sign in to view your order history, track shipments, and manage your collection.
          </p>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue without signing in</span>
          </div>
        </div>

        {/* Continue as Guest */}
        <button
          onClick={onAuthComplete}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Mail className="w-5 h-5" />
          Continue as Guest
        </button>

        <p className="text-xs text-gray-500 text-center mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default CheckoutAuthModal;
