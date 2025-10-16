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
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      navigate('/?auth_error=' + error);
      return;
    }

    if (accessToken && refreshToken) {
      // Store tokens with correct keys used by UserAuthContext
      localStorage.setItem('user_access_token', accessToken);
      localStorage.setItem('user_refresh_token', refreshToken);

      // Decode JWT to get user info (simple decode, not validation)
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));

        // Fetch full user profile
        fetch(`${API_BASE_URL}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        .then(res => res.json())
        .then(data => {
          if (data.success && setUser) {
            setUser(data.data);
          }
          navigate('/');
        })
        .catch(() => {
          navigate('/');
        });
      } catch (error) {
        console.error('Failed to process auth:', error);
        navigate('/');
      }
    } else {
      navigate('/');
    }
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
