import API_BASE_URL from '../config/api';

const TOKEN_KEY = 'admin_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';
const DEVICE_ID_KEY = 'admin_device_id';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getDeviceId(): string | null {
  return localStorage.getItem(DEVICE_ID_KEY);
}

export function setTokens(accessToken: string, refreshToken: string, deviceId?: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (deviceId) {
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(DEVICE_ID_KEY);
}

// Callbacks for auth state changes
let onLogout: (() => void) | null = null;

export function setOnLogout(callback: () => void) {
  onLogout = callback;
}

async function doRefresh(): Promise<string | null> {
  const refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/admin/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshTokenValue }),
    });

    if (!res.ok) {
      clearTokens();
      onLogout?.();
      return null;
    }

    const data = await res.json();
    if (data.success && data.data?.token) {
      localStorage.setItem(TOKEN_KEY, data.data.token);
      return data.data.token;
    }

    clearTokens();
    onLogout?.();
    return null;
  } catch {
    clearTokens();
    onLogout?.();
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  // Deduplicate concurrent refresh calls
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = doRefresh().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  // On 401 with TOKEN_EXPIRED, try refresh
  if (res.status === 401) {
    const body = await res.clone().json().catch(() => ({}));
    if (body.code === 'TOKEN_EXPIRED') {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
      } else {
        // Refresh failed - user will be logged out via onLogout callback
        return res;
      }
    } else if (body.code === 'REFRESH_EXPIRED') {
      clearTokens();
      onLogout?.();
    }
  }

  return res;
}
