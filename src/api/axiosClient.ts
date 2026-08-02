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
const CSRF_URL = '/api/v1/auth/csrf';
const CSRF_HEADER = 'X-HAPPABI-CSRF';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<string> | null = null;
let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

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

const csrfClient = axios.create({
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

const isUnsafeMethod = (method?: string) =>
  ['post', 'put', 'patch', 'delete'].includes((method ?? 'get').toLowerCase());

const PUBLIC_AUTH_ENDPOINTS = [
  '/api/v1/auth/register',
  '/api/v1/auth/verify-otp',
  '/api/v1/auth/resend-otp',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/social/sync',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/csrf',
];

const CSRF_FRESH_AUTH_ENDPOINTS = PUBLIC_AUTH_ENDPOINTS.filter((endpoint) => endpoint !== CSRF_URL);

const isPublicAuthEndpoint = (url?: string) =>
  Boolean(url && PUBLIC_AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint)));

const needsFreshCsrf = (url?: string) =>
  Boolean(url && CSRF_FRESH_AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint)));

const readCsrfToken = (response: { headers?: Record<string, unknown>; data?: unknown }) => {
  const headerValue = response.headers?.[CSRF_HEADER.toLowerCase()] ?? response.headers?.[CSRF_HEADER];
  if (typeof headerValue === 'string' && headerValue) {
    return headerValue;
  }

  const data = response.data as { data?: unknown } | undefined;
  return typeof data?.data === 'string' ? data.data : '';
};

const requestCsrfToken = async (force = false) => {
  if (!force && csrfToken) {
    return csrfToken;
  }
  if (!csrfPromise) {
    csrfPromise = csrfClient.get(CSRF_URL)
      .then((response) => {
        const token = readCsrfToken(response);
        if (!token) {
          throw new Error('CSRF_RESPONSE_INVALID');
        }
        csrfToken = token;
        return token;
      })
      .finally(() => {
        csrfPromise = null;
      });
  }
  return csrfPromise;
};

const requestNewAccessToken = async () => {
  if (!refreshPromise) {
    const token = await requestCsrfToken(true);
    refreshPromise = refreshClient
      .post(REFRESH_URL, null, { headers: { [CSRF_HEADER]: token } })
      .then((response) => {
        csrfToken = readCsrfToken(response) || csrfToken;
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

axiosClient.interceptors.request.use(async (config) => {
  if (isUnsafeMethod(config.method) && !config.url?.includes(CSRF_URL)) {
    config.headers[CSRF_HEADER] = await requestCsrfToken(needsFreshCsrf(config.url));
  }

  const token = localStorage.getItem(TOKEN_KEY);
  if (token && !isPublicAuthEndpoint(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    csrfToken = readCsrfToken(response) || csrfToken;
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url ?? '';
    const shouldRefresh =
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isPublicAuthEndpoint(url) &&
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
