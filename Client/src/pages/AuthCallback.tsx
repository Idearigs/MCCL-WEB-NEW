import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { T, FONT_BODY } from '../components/home-v2/tokens';
import { GROUND } from '../components/home-v2/listingShared';
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: GROUND, fontFamily: FONT_BODY, color: T.text }}>
      <style>{`@keyframes authSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ textAlign: "center" }}>
        <span style={{ display: "block", width: 26, height: 26, margin: "0 auto 22px", borderRadius: "50%", border: `1px solid ${T.line}`, borderTopColor: T.gold, animation: "authSpin 0.9s linear infinite" }} />
        <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>Completing sign in</p>
      </div>
    </div>
  );
};

export default AuthCallback;
