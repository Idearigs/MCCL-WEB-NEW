import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import API_BASE_URL from '../../config/api';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'editor';
  avatar?: string;
  is_active: boolean;
  last_login_at?: string;
  login_count: number;
  created_at: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AdminUser>) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Get stored token
  const getToken = () => localStorage.getItem('admin_token');

  // Set token
  const setToken = (token: string) => localStorage.setItem('admin_token', token);

  // Remove token
  const removeToken = () => localStorage.removeItem('admin_token');

  // API helper with auth header
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();
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

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  };

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiCall('/admin/profile');
        setAdmin(response.data);
      } catch (error) {
        console.error('Auth check failed:', error);
        removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setToken(response.data.token);
      setAdmin(response.data.admin);
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
      await apiCall('/admin/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      removeToken();
      setAdmin(null);
    }
  };

  // Update profile function
  const updateProfile = async (data: Partial<AdminUser>) => {
    setError(null);

    try {
      const response = await apiCall('/admin/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      setAdmin(response.data);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const value: AdminAuthContextType = {
    admin,
    isAuthenticated: !!admin,
    isLoading,
    login,
    logout,
    updateProfile,
    error,
    clearError,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// Custom hook to use admin auth context
export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);

  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }

  return context;
};