import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';

export type UserRole = 'MOTHER' | 'NURSE' | 'ADMIN';

export interface UserProfile {
  id: string;
  fullName?: string;
  phone?: string;
  email?: string;
  roles: UserRole[];
  linkedProviders?: string[];
  avatarUrl?: string;
  isActive?: boolean;
}

interface AuthPayload {
  accessToken: string;
  refreshToken?: string;
  user?: UserProfile;
  activeRole?: UserRole;
}

interface AuthContextValue {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  primaryRole: UserRole | null;
  login: (payloadOrToken: AuthPayload | string, maybeUser?: UserProfile) => void;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'happabi_access_token';
const USER_KEY = 'happabi_user';
const ACTIVE_ROLE_KEY = 'happabi_active_role';

const readStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

const readStoredActiveRole = () => {
  const raw = localStorage.getItem(ACTIVE_ROLE_KEY) as UserRole | null;
  return raw === 'MOTHER' || raw === 'NURSE' || raw === 'ADMIN' ? raw : null;
};

const normalizeUser = (user: UserProfile): UserProfile => ({
  ...user,
  roles: Array.isArray(user.roles) ? user.roles : [],
});

const getPrimaryRole = (user: UserProfile | null, activeRole: UserRole | null): UserRole | null => {
  if (!user?.roles?.length) return null;
  if (activeRole && user.roles.includes(activeRole)) return activeRole;
  if (user.roles.includes('NURSE')) return 'NURSE';
  if (user.roles.includes('MOTHER')) return 'MOTHER';
  return user.roles[0];
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserProfile | null>(() => readStoredUser());
  const [activeRole, setActiveRole] = useState<UserRole | null>(() => readStoredActiveRole());
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)) && !readStoredUser());

  const login = useCallback((payloadOrToken: AuthPayload | string, maybeUser?: UserProfile) => {
    const payload = typeof payloadOrToken === 'string'
      ? { accessToken: payloadOrToken, user: maybeUser }
      : payloadOrToken;

    localStorage.setItem(TOKEN_KEY, payload.accessToken);
    setAccessToken(payload.accessToken);

    if (payload.user) {
      const normalizedUser = normalizeUser(payload.user);
      localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
      setUser(normalizedUser);

      const nextActiveRole = payload.activeRole && normalizedUser.roles.includes(payload.activeRole)
        ? payload.activeRole
        : getPrimaryRole(normalizedUser, activeRole);

      if (nextActiveRole) {
        localStorage.setItem(ACTIVE_ROLE_KEY, nextActiveRole);
        setActiveRole(nextActiveRole);
      }
    }
  }, [activeRole]);

  const refreshMe = useCallback(async () => {
    const response = await axiosClient.get('/api/v1/users/me');
    const profile = normalizeUser(response.data?.data as UserProfile);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);

    if (activeRole && !profile.roles.includes(activeRole)) {
      const nextActiveRole = getPrimaryRole(profile, null);
      if (nextActiveRole) {
        localStorage.setItem(ACTIVE_ROLE_KEY, nextActiveRole);
        setActiveRole(nextActiveRole);
      } else {
        localStorage.removeItem(ACTIVE_ROLE_KEY);
        setActiveRole(null);
      }
    }
  }, [activeRole]);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    try {
      if (token) {
        await axiosClient.post('/api/v1/auth/logout', null, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Local logout should still happen if the server token is already invalid.
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ACTIVE_ROLE_KEY);
      setAccessToken(null);
      setUser(null);
      setActiveRole(null);
    }
  }, []);

  useEffect(() => {
    if (!accessToken || user) {
      setIsLoading(false);
      return;
    }

    refreshMe().catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(ACTIVE_ROLE_KEY);
        setAccessToken(null);
        setUser(null);
        setActiveRole(null);
    }).finally(() => setIsLoading(false));
  }, [accessToken, refreshMe, user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken && user),
    isLoading,
    primaryRole: getPrimaryRole(user, activeRole),
    login,
    logout,
    refreshMe,
  }), [accessToken, activeRole, isLoading, login, logout, refreshMe, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
