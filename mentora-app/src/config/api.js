import axios from 'axios';
import { API as API_BASE, BASE_URL } from './apiKeys';

const normalizeApiBase = (value) => (value || '').trim().replace(/\/+$/, '');

let resolvedApiBase = normalizeApiBase(API_BASE);

export const apiClient = axios.create({
  baseURL: resolvedApiBase,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setApiBaseUrl = (nextBase) => {
  const normalized = normalizeApiBase(nextBase);
  if (!normalized) {
    return resolvedApiBase;
  }

  resolvedApiBase = normalized;
  apiClient.defaults.baseURL = normalized;
  return normalized;
};

export const getApiBaseUrl = () => resolvedApiBase;

export const ensureApiBaseUrl = async () => {
  if (!resolvedApiBase) {
    throw new Error('EXPO_PUBLIC_API_URL is missing.');
  }

  return resolvedApiBase;
};

export { BASE_URL };
export const API = getApiBaseUrl();
