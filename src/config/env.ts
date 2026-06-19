type AppEnvKey =
  | 'VITE_API_BASE_URL'
  | 'VITE_BACKEND_URL'
  | 'VITE_SOCKET_URL'
  | 'VITE_AWS_REGION'
  | 'VITE_AWS_COGNITO_USER_POOL_ID'
  | 'VITE_AWS_COGNITO_CLIENT_ID'
  | 'VITE_AWS_COGNITO_DOMAIN'
  | 'VITE_COGNITO_REDIRECT_SIGN_IN'
  | 'VITE_COGNITO_REDIRECT_SIGN_OUT';

type RuntimeEnv = Partial<Record<AppEnvKey, string>>;

declare global {
  interface Window {
    __HAPPABI_ENV__?: RuntimeEnv;
  }
}

export const getAppEnv = (key: AppEnvKey) => {
  const runtimeValue = window.__HAPPABI_ENV__?.[key];
  if (runtimeValue) return runtimeValue;
  return import.meta.env[key];
};

export const requireAppEnv = (key: AppEnvKey) => {
  const value = getAppEnv(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};