import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, XCircle, Loader2, Mail } from 'lucide-react';
import LuxuryNavigation from '../components/LuxuryNavigation';
import { FooterSection } from '../components/FooterSection';
import { api } from '../config/api';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'already-verified'>('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(api(`/users/verify-email/${token}`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          if (data.data?.alreadyVerified) {
            setStatus('already-verified');
            setMessage(data.message || 'Email already verified');
          } else {
            setStatus('success');
            setMessage(data.message || 'Email verified successfully!');
            setEmail(data.data?.email || '');
          }
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Failed to verify email. Please try again.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <>
      <LuxuryNavigation />
      <div className="min-h-screen bg-gray-50 pt-32 pb-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-12">
            {/* Verifying State */}
            {status === 'verifying' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 mb-6">
                  <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
                </div>
                <h1 className="text-2xl font-light text-gray-900 mb-3">Verifying your email</h1>
                <p className="text-gray-600 font-light">Please wait while we verify your email address...</p>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-light text-gray-900 mb-3">Email Verified!</h1>
                <p className="text-gray-600 font-light mb-8">
                  {message}
                  {email && (
                    <>
                      <br />
                      <span className="text-sm text-gray-500 mt-2 block">{email}</span>
                    </>
                  )}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/account')}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-md hover:from-amber-700 hover:to-amber-800 transition-all duration-200 font-light"
                  >
                    Go to My Account
                  </button>
                  <button
                    onClick={() => navigate('/products')}
                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-md hover:bg-gray-50 transition-all duration-200 font-light"
                  >
                    Explore Products
                  </button>
                </div>
              </div>
            )}

            {/* Already Verified State */}
            {status === 'already-verified' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6">
                  <Mail className="w-10 h-10 text-blue-600" />
                </div>
                <h1 className="text-2xl font-light text-gray-900 mb-3">Already Verified</h1>
                <p className="text-gray-600 font-light mb-8">{message}</p>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/account')}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-md hover:from-amber-700 hover:to-amber-800 transition-all duration-200 font-light"
                  >
                    Go to My Account
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-md hover:bg-gray-50 transition-all duration-200 font-light"
                  >
                    Go to Home
                  </button>
                </div>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-light text-gray-900 mb-3">Verification Failed</h1>
                <p className="text-gray-600 font-light mb-8">{message}</p>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/account')}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-md hover:from-amber-700 hover:to-amber-800 transition-all duration-200 font-light"
                  >
                    Request New Verification Email
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-md hover:bg-gray-50 transition-all duration-200 font-light"
                  >
                    Go to Home
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <FooterSection />
    </>
  );
};

export default VerifyEmail;
