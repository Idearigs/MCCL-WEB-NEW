import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useUserAuth } from '../contexts/UserAuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'login' }) => {
  const [view, setView] = useState<'login' | 'signup'>(initialView);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { login, signup, error: authError, clearError } = useUserAuth();

  // Reset form when view changes
  useEffect(() => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setLocalError(null);
    setSuccessMessage(null);
    clearError();
  }, [view, clearError]);

  // Update view when initialView prop changes
  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

    setPasswordStrength(Math.min(strength, 100));
  }, [password]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (view === 'login') {
        await login(email, password, rememberMe);
        setSuccessMessage('Welcome back!');
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        await signup(email, password, firstName, lastName);
        setSuccessMessage('Account created successfully!');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      setLocalError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || authError;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white w-full max-w-md rounded-lg shadow-2xl transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="pt-8 px-8 pb-6 border-b border-gray-100">
              <h2 className="text-2xl font-light text-gray-900 tracking-wide">
                {view === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="mt-2 text-sm text-gray-500 font-light">
                {view === 'login'
                  ? 'Sign in to access your favorites and orders'
                  : 'Join us for an exclusive luxury experience'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {/* Success Message */}
              {successMessage && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-800 font-light">{successMessage}</p>
                </div>
              )}

              {/* Error Message */}
              {displayError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800 font-light">{displayError}</p>
                </div>
              )}

              {/* Name fields (signup only) */}
              {view === 'signup' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-medium text-gray-700 mb-2 tracking-wide">
                      FIRST NAME
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 text-sm font-light"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-medium text-gray-700 mb-2 tracking-wide">
                      LAST NAME
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 text-sm font-light"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-2 tracking-wide">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 text-sm font-light"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-2 tracking-wide">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 text-sm font-light"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength indicator (signup only) */}
                {view === 'signup' && password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 font-light">Password Strength</span>
                      <span className={`text-xs font-medium ${passwordStrength >= 75 ? 'text-green-600' : passwordStrength >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Remember me / Forgot password */}
              {view === 'login' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-600 font-light group-hover:text-gray-900 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-amber-700 hover:text-amber-800 font-light transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-md hover:from-amber-700 hover:to-amber-800 transition-all duration-200 font-light tracking-wide text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{view === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                  </>
                ) : (
                  <span>{view === 'login' ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>

              {/* Switch view */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600 font-light">
                  {view === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                    className="text-amber-700 hover:text-amber-800 font-medium transition-colors"
                  >
                    {view === 'login' ? 'Create one' : 'Sign in'}
                  </button>
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="px-8 pb-8">
              <p className="text-xs text-center text-gray-400 font-light">
                By continuing, you agree to our{' '}
                <a href="#" className="text-gray-600 hover:text-gray-900 underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-gray-600 hover:text-gray-900 underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;
