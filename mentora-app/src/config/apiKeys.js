const normalizeBaseUrl = (value) => (value || '').trim().replace(/\/+$/, '');

export const BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_URL || 'https://your-backend.onrender.com'
);

export const API = `${BASE_URL}/api`;

export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
export const GNEWS_API_KEY = process.env.EXPO_PUBLIC_GNEWS_API_KEY || '';
export const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
