import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import authService from "../services/authService";
import type { LoginInput, RegisterInput, User } from "../types/auth.types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  demoLogin: () => Promise<User>;
  demoAdminLogin: () => Promise<User>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(
    () => Boolean(authService.getStoredToken())
  );

  useEffect(() => {
    const token = authService.getStoredToken();

    if (!token) {
      authService.logout();
      setUser(null);
      setLoading(false);
      return;
    }

    authService
      .getMe()
      .then((me) => {
        setUser(me);
      })
      .catch(() => {
        authService.logout();
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const res = await authService.login(input);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await authService.register(input);
    setUser(res.user);
    return res.user;
  }, []);

  const demoLogin = useCallback(async () => {
    const res = await authService.demoLogin();
    setUser(res.user);
    return res.user;
  }, []);

  const demoAdminLogin = useCallback(async () => {
    const res = await authService.demoAdminLogin();
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => {
    setUser(authService.getUser());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: loading,
      login,
      register,
      demoLogin,
      demoAdminLogin,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, demoLogin, demoAdminLogin, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

export default useAuth;
