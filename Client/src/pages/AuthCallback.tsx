import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useUserAuth } from '../contexts/UserAuthContext';
import { API_BASE_URL } from '../config/api';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useUserAuth() as any;

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const checkoutRedirect = localStorage.getItem('checkout_redirect') === 'true';

    const redirectAfterAuth = () => {
      if (checkoutRedirect) {
        localStorage.removeItem('checkout_redirect');
        navigate('/checkout');
      } else {
        navigate('/');
      }
    };

    if (error) {
      navigate('/?auth_error=' + error);
      return;
    }

    if (!code) {
      redirectAfterAuth();
      return;
    }

    // Exchange the one-time code for tokens — tokens are never in the URL
    fetch(`${API_BASE_URL}/auth/exchange?code=${encodeURIComponent(code)}`)
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          navigate('/?auth_error=exchange_failed');
          return;
        }

        const { accessToken, refreshToken } = data.data;
        localStorage.setItem('user_access_token', accessToken);
        localStorage.setItem('user_refresh_token', refreshToken);

        return fetch(`${API_BASE_URL}/users/profile`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }).then(res => res.json()).then(profileData => {
          if (profileData.success && setUser) setUser(profileData.data);
          redirectAfterAuth();
        });
      })
      .catch(() => redirectAfterAuth());
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
        <p className="text-gray-600 font-light">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
