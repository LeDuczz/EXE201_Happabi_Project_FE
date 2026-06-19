import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { requireAppEnv, getAppEnv } from '../config/env';
import { translateApiMessage } from '../utils/apiError';

const baseURL =
  getAppEnv('VITE_API_BASE_URL') ??
  getAppEnv('VITE_BACKEND_URL') ??
  requireAppEnv('VITE_API_BASE_URL');

const TOKEN_KEY = 'happabi_access_token';
const USER_KEY = 'happabi_user';
const ACTIVE_ROLE_KEY = 'happabi_active_role';
const REFRESH_URL = '/api/v1/auth/refresh';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<string> | null = null;

const axiosClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const translateResponseError = (error: AxiosError) => {
  const data = error?.response?.data as {
    message?: string;
    errors?: Array<{ message?: string; [key: string]: unknown }>;
  } | undefined;
  if (data?.message) {
    data.message = translateApiMessage(data.message);
  }
  if (Array.isArray(data?.errors)) {
    data.errors = data.errors.map((item) => ({
      ...item,
      message: translateApiMessage(item?.message) || item?.message,
    }));
  }
};

const isAuthenticationFailure = (error: AxiosError) => {
  const data = error.response?.data as { error?: string } | undefined;
  const code = typeof data?.error === 'string' ? data.error : '';
  return !code || [
    'AUTH_FAILED',
    'ACCESS_TOKEN_INVALID',
    'TOKEN_EXPIRED',
    'UNAUTHORIZED',
  ].includes(code);
};

const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACTIVE_ROLE_KEY);
};

const notifyAuthExpired = () => {
  clearStoredAuth();
  window.dispatchEvent(new Event('happabi:auth-expired'));
};

const requestNewAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post(REFRESH_URL, null)
      .then((response) => {
        const accessToken = response.data?.data?.accessToken;
        if (!accessToken) {
          throw new Error('REFRESH_RESPONSE_INVALID');
        }

        localStorage.setItem(TOKEN_KEY, accessToken);
        window.dispatchEvent(new CustomEvent('happabi:token-refreshed', {
          detail: { accessToken },
        }));
        return accessToken as string;
      })
      .catch((error) => {
        notifyAuthExpired();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url ?? '';
    const isAuthEndpoint = url.includes('/api/v1/auth/');
    const shouldRefresh =
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint &&
      Boolean(localStorage.getItem(TOKEN_KEY)) &&
      isAuthenticationFailure(error);

    if (shouldRefresh) {
      try {
        originalRequest._retry = true;
        const accessToken = await requestNewAccessToken();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosClient(originalRequest);
      } catch {
        translateResponseError(error);
        return Promise.reject(error);
      }
    }

    translateResponseError(error);
    return Promise.reject(error);
  },
);

export default axiosClient;
