import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import API_BASE_URL from '../config/api';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  emailVerified: boolean;
  avatarUrl?: string;
}

interface UserAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

interface UserAuthProviderProps {
  children: ReactNode;
}

export const UserAuthProvider: React.FC<UserAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Token management
  const getAccessToken = () => localStorage.getItem('user_access_token');
  const getRefreshToken = () => localStorage.getItem('user_refresh_token');

  const setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('user_access_token', accessToken);
    localStorage.setItem('user_refresh_token', refreshToken);
  };

  const removeTokens = () => {
    localStorage.removeItem('user_access_token');
    localStorage.removeItem('user_refresh_token');
  };

  // API helper with auth header
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    // Handle token expiration
    if (!response.ok && data.code === 'TOKEN_EXPIRED') {
      // Try to refresh token
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry the original request
        const newToken = getAccessToken();
        if (newToken) {
          headers.Authorization = `Bearer ${newToken}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
          return await retryResponse.json();
        }
      } else {
        // Refresh failed, logout
        await logout();
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  };

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiCall('/users/profile');
        setUser(response.data);
      } catch (error) {
        console.error('Auth check failed:', error);
        removeTokens();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Signup function
  const signup = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall('/users/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      setTokens(response.data.accessToken, response.data.refreshToken);
      setUser(response.data.user);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall('/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      });

      setTokens(response.data.accessToken, response.data.refreshToken);
      setUser(response.data.user);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const refreshTokenValue = getRefreshToken();
      await apiCall('/users/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      removeTokens();
      setUser(null);
    }
  };

  // Refresh access token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = getRefreshToken();

      if (!refreshTokenValue) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/users/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        removeTokens();
        return false;
      }

      // Update access token (keep same refresh token)
      localStorage.setItem('user_access_token', data.data.accessToken);
      setUser(data.data.user);

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      removeTokens();
      return false;
    }
  };

  const value: UserAuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    refreshToken,
    error,
    clearError,
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
};

// Custom hook to use user auth context
export const useUserAuth = (): UserAuthContextType => {
  const context = useContext(UserAuthContext);

  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }

  return context;
};
