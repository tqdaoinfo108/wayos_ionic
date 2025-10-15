import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { StoredUser } from '../constants/storageKeys';
import { loadStoredUser } from '../services/storage';
import * as authService from '../services/authService';

interface AuthContextValue {
  token: string | null;
  user: StoredUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [{ token, user, loading, initialized, error }, setAuthState] = useState<{
    token: string | null;
    user: StoredUser | null;
    loading: boolean;
    initialized: boolean;
    error: string | null;
  }>({
    token: null,
    user: null,
    loading: false,
    initialized: false,
    error: null,
  });

  useEffect(() => {
    const { token: storedToken, user: storedUser } = loadStoredUser();
    setAuthState((previous) => ({
      ...previous,
      token: storedToken,
      user: storedToken ? storedUser : null,
      initialized: true,
    }));
  }, []);

  const handleLogin = useCallback(async (username: string, password: string) => {
    setAuthState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const { token: newToken, user: newUser } = await authService.login(username, password);
      setAuthState({
        token: newToken,
        user: newUser,
        loading: false,
        initialized: true,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setAuthState((previous) => ({
        ...previous,
        loading: false,
        error: message,
      }));
      throw err;
    }
  }, []);

  const handleLogout = useCallback(() => {
    authService.logout();
    setAuthState({
      token: null,
      user: null,
      loading: false,
      initialized: true,
      error: null,
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      initialized,
      error,
      login: handleLogin,
      logout: handleLogout,
    }),
    [token, user, loading, initialized, error, handleLogin, handleLogout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

