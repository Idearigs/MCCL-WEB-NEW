import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useUserAuth } from '../contexts/UserAuthContext';
import { API_BASE_URL } from '../config/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'login' }) => {
  const [view, setView] = useState<'initial' | 'login' | 'signup'>('initial');
  const [step, setStep] = useState<'email' | 'password'>('email');
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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setView('initial');
      setStep('email');
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setLocalError(null);
      setSuccessMessage(null);
      clearError();
    }
  }, [isOpen, clearError]);

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

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setLocalError('Please enter your email address');
      return;
    }
    setLocalError(null);
    setStep('password');
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

  const handleSignInWithShop = () => {
    setView('login');
    setStep('email');
  };

  const handleCreateAccount = () => {
    setView('signup');
    setStep('email');
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
            className="relative bg-white w-full max-w-md rounded-none shadow-2xl transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-gray-400 hover:text-gray-900 transition-colors duration-200 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="px-12 py-16">
              {/* Logo/Brand */}
              <div className="text-center mb-12">
                <h1 className="text-2xl tracking-[0.3em] font-light text-gray-900 mb-1">
                  MCCULLOCH
                </h1>
                <p className="text-xs tracking-[0.2em] text-gray-500 font-light">1798</p>
              </div>

              {/* Initial View - Email entry */}
              {view === 'initial' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-light text-gray-900 mb-2">Sign in</h2>
                    <p className="text-sm text-gray-500 font-light">Choose how you'd like to continue</p>
                  </div>

                  {/* Google Sign-In Button */}
                  <a
                    href={`${API_BASE_URL}/auth/google`}
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3.5 rounded-md hover:bg-gray-50 transition-all duration-200 font-light text-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </a>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-4 bg-white text-gray-500 font-light tracking-wider">OR</span>
                    </div>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); if (email) { setView('login'); setStep('password'); } else { setLocalError('Please enter your email address'); } }} className="space-y-6">
                    {/* Error Message */}
                    {displayError && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-800 font-light">{displayError}</p>
                      </div>
                    )}

                    <div>
                      <label htmlFor="email-initial" className="block text-sm text-gray-700 mb-2 font-light">
                        Email
                      </label>
                      <input
                        id="email-initial"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 text-sm font-light"
                        placeholder="Enter your email"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-md hover:bg-gray-200 transition-all duration-200 font-light text-sm"
                    >
                      Continue
                    </button>
                  </form>

                  {/* Create account link */}
                  <div className="text-center pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-600 font-light">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={handleCreateAccount}
                        className="text-gray-900 hover:underline font-normal transition-colors"
                      >
                        Create account
                      </button>
                    </p>
                  </div>

                  {/* Footer links */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex justify-center gap-6 text-xs">
                      <a href="#" className="text-gray-500 hover:text-gray-900 font-light transition-colors">
                        Privacy policy
                      </a>
                      <a href="#" className="text-gray-500 hover:text-gray-900 font-light transition-colors">
                        Terms of service
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Login/Signup Form */}
              {(view === 'login' || view === 'signup') && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-light text-gray-900 mb-2">
                      {view === 'login' ? 'Sign in' : 'Create account'}
                    </h2>
                    <p className="text-sm text-gray-500 font-light">
                      {view === 'login' ? 'Welcome back' : 'Join our exclusive community'}
                    </p>
                  </div>

                  {/* Success Message */}
                  {successMessage && (
                    <div className="mb-6 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <p className="text-sm text-green-800 font-light">{successMessage}</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {displayError && (
                    <div className="mb-6 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-800 font-light">{displayError}</p>
                    </div>
                  )}

                  {/* Email Step */}
                  {step === 'email' && (
                    <form onSubmit={handleEmailContinue} className="space-y-6">
                      <div>
                        <label htmlFor="email" className="block text-sm text-gray-700 mb-2 font-light">
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoFocus
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 text-sm font-light"
                          placeholder="Enter your email"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-md hover:bg-gray-200 transition-all duration-200 font-light text-sm"
                      >
                        Continue
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setView('initial')}
                          className="text-sm text-gray-500 hover:text-gray-900 font-light transition-colors"
                        >
                          ← Back
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Password Step */}
                  {step === 'password' && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Name fields (signup only) */}
                      {view === 'signup' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="firstName" className="block text-sm text-gray-700 mb-2 font-light">
                              First name
                            </label>
                            <input
                              id="firstName"
                              type="text"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              required
                              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 text-sm font-light"
                              placeholder="John"
                            />
                          </div>
                          <div>
                            <label htmlFor="lastName" className="block text-sm text-gray-700 mb-2 font-light">
                              Last name
                            </label>
                            <input
                              id="lastName"
                              type="text"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              required
                              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 text-sm font-light"
                              placeholder="Doe"
                            />
                          </div>
                        </div>
                      )}

                      {/* Email (read-only) */}
                      <div>
                        <label htmlFor="email-display" className="block text-sm text-gray-700 mb-2 font-light">
                          Email
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id="email-display"
                            type="email"
                            value={email}
                            readOnly
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm font-light text-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => setStep('email')}
                            className="text-sm text-gray-500 hover:text-gray-900 font-light transition-colors whitespace-nowrap"
                          >
                            Change
                          </button>
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label htmlFor="password" className="block text-sm text-gray-700 mb-2 font-light">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 text-sm font-light"
                            placeholder="Enter your password"
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
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-gray-500 font-light">Password strength</span>
                              <span className={`text-xs font-light ${passwordStrength >= 75 ? 'text-green-600' : passwordStrength >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {getPasswordStrengthText()}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                                style={{ width: `${passwordStrength}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Remember me (login only) */}
                      {view === 'login' && (
                        <div className="flex items-center justify-between">
                          <label className="flex items-center cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="w-4 h-4 text-gray-700 border-gray-300 rounded focus:ring-gray-500 cursor-pointer"
                            />
                            <span className="ml-2 text-sm text-gray-600 font-light group-hover:text-gray-900 transition-colors">
                              Remember me
                            </span>
                          </label>
                          <button
                            type="button"
                            className="text-sm text-gray-500 hover:text-gray-900 font-light transition-colors"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gray-900 text-white py-3.5 rounded-md hover:bg-gray-800 transition-all duration-200 font-light text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{view === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                          </>
                        ) : (
                          <span>{view === 'login' ? 'Sign in' : 'Create account'}</span>
                        )}
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setStep('email')}
                          className="text-sm text-gray-500 hover:text-gray-900 font-light transition-colors"
                        >
                          ← Back
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Switch between login/signup */}
                  {step === 'email' && (
                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                      <p className="text-sm text-gray-600 font-light">
                        {view === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                        <button
                          type="button"
                          onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                          className="text-gray-900 hover:underline font-normal transition-colors"
                        >
                          {view === 'login' ? 'Create account' : 'Sign in'}
                        </button>
                      </p>
                    </div>
                  )}

                  {/* Footer links */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex justify-center gap-6 text-xs">
                      <a href="#" className="text-gray-500 hover:text-gray-900 font-light transition-colors">
                        Privacy policy
                      </a>
                      <a href="#" className="text-gray-500 hover:text-gray-900 font-light transition-colors">
                        Terms of service
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;
