import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import {
  clearSession,
  getApiErrorMessage,
  getMe,
  getStoredToken,
  getStoredUser,
  login as apiLogin,
  register as apiRegister,
  type AuthUser,
} from "@/lib/taskflow-auth";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function TaskFlowAuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const storedToken = await getStoredToken();
      if (!storedToken) {
        setToken(null);
        setUser(null);
        return;
      }
      const storedUser = await getStoredUser();
      try {
        const currentUser = await getMe(storedToken);
        setToken(storedToken);
        setUser(currentUser);
      } catch {
        await clearSession();
        setToken(null);
        setUser(storedUser);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiLogin({ email, password });
      setToken(response.token);
      setUser(response.user);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRegister({ name, email, password });
      setToken(response.token);
      setUser(response.user);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    await clearSession();
    setToken(null);
    setUser(null);
    setError(null);
    setLoading(false);
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    error,
    login,
    register,
    logout,
    refresh,
    clearError: () => setError(null),
  }), [user, token, loading, error, login, register, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useTaskFlowAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useTaskFlowAuth must be used inside TaskFlowAuthProvider");
  return value;
}
