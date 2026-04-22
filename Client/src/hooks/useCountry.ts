import { useState, useEffect } from 'react';

interface CachedCountry {
  code: string;
  name: string;
  fetchedAt: number;
}

const CACHE_KEY = 'mcculloch_user_country';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function useCountry() {
  const [countryCode, setCountryCode] = useState<string>('GB');
  const [countryName, setCountryName] = useState<string>('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached: CachedCountry = JSON.parse(raw);
        if (Date.now() - cached.fetchedAt < CACHE_TTL) {
          setCountryCode(cached.code);
          setCountryName(cached.name);
          return;
        }
      }
    } catch (_) {}

    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        if (data.country_code) {
          const entry: CachedCountry = {
            code: data.country_code,
            name: data.country_name || '',
            fetchedAt: Date.now(),
          };
          try { localStorage.setItem(CACHE_KEY, JSON.stringify(entry)); } catch (_) {}
          setCountryCode(data.country_code);
          setCountryName(data.country_name || '');
        }
      })
      .catch(() => {
        // Keep GB default on error
      });
  }, []);

  return { countryCode, countryName };
}
