import apiClient from "./apiClient";
import type {
  AuthResult,
  LoginInput,
  RegisterInput,
  User,
} from "../types/auth.types";

const TOKEN_KEY = "token";
const USER_KEY = "user";

async function register(input: RegisterInput): Promise<AuthResult> {
  const response: any = await apiClient.post("/auth/register", input);
  const { token, user } = response.data;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return { token, user };
}

async function login(input: LoginInput): Promise<AuthResult> {
  const response: any = await apiClient.post("/auth/login", input);
  const { token, user } = response.data;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return { token, user };
}

async function demoLogin(): Promise<AuthResult> {
  const demo: LoginInput = {
    email: "demo@english.app",
    password: "demo1234",
  };
  try {
    return await login(demo);
  } catch {
    // If not exists on DB yet, let's register the demo user first
    const reg: RegisterInput = {
      name: "Demo Learner",
      email: "demo@english.app",
      password: "demo1234",
    };
    return await register(reg);
  }
}

async function demoAdminLogin(): Promise<AuthResult> {
  const demo: LoginInput = {
    email: "admin@english.app",
    password: "admin1234",
  };
  try {
    return await login(demo);
  } catch {
    // Register admin user
    const reg: RegisterInput = {
      name: "Demo Admin",
      email: "admin@english.app",
      password: "admin1234",
    };
    return await register(reg);
  }
}

async function getMe(): Promise<User> {
  const response: any = await apiClient.get("/auth/me");
  const user = response.data;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function updateUser(updates: Partial<User>): Promise<User> {
  const response: any = await apiClient.put("/profile", updates);
  const user = response.data;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export const authService = {
  register,
  login,
  demoLogin,
  demoAdminLogin,
  getMe,
  getUser: getStoredUser,
  getStoredUser,
  getStoredToken,
  logout,
  updateUser,
};

export default authService;
