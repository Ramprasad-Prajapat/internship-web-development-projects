import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import authService from "../services/authService";
import type { LoginInput, RegisterInput, User } from "../types/auth.types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  demoLogin: () => Promise<User>;
  demoAdminLogin: () => Promise<User>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.getUser());

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
      login,
      register,
      demoLogin,
      demoAdminLogin,
      logout,
      refreshUser,
    }),
    [user, login, register, demoLogin, demoAdminLogin, logout, refreshUser],
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
