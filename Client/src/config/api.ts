// API Configuration
// This file centralizes the API URL configuration for all environments

// Get API URL from environment variable or use default
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Helper function to build full API URLs (includes /api/v1 prefix)
export const api = (path: string): string => {
  // If path already starts with http, return as-is (for absolute URLs)
  if (path.startsWith('http')) {
    return path;
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Return full API URL
  return `${API_BASE_URL}/${cleanPath}`;
};

// Export for convenience
export default API_BASE_URL;
