import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/auth";
import { TOKEN_KEY } from "../api/client";
import { queryClient } from "../api/queryClient";
import { socketManager } from "../socket";
import type { LoginRequest, RegisterRequest, User } from "../types";
import { tokenStorage } from "../utils/tokenStorage";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStorage.getItem(TOKEN_KEY);
        if (token) {
          const me = await authApi.me();
          setUser(me);
          socketManager.connect(token, me.id);
        }
      } catch {
        // Token invalid or expired — clear it
        await tokenStorage.deleteItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  type AuthLikeResponse = {
    token?: string;
    user?: User | null;
  };

  async function establishSession(response: AuthLikeResponse, fallbackMessage: string) {
    const token = response?.token;
    if (!token) {
      throw new Error("Authentication token missing from server response");
    }

    await tokenStorage.setItem(TOKEN_KEY, token);

    try {
      let me = response?.user ?? null;

      // Defensive fallback for backends that return token only on register/login
      if (!me?.id) {
        me = await authApi.me();
      }

      if (!me?.id) {
        throw new Error(fallbackMessage);
      }

      socketManager.connect(token, me.id);
      setUser(me);
    } catch (error) {
      // Prevent half-authenticated state if anything fails after token write
      await tokenStorage.deleteItem(TOKEN_KEY);
      throw error instanceof Error ? error : new Error(fallbackMessage);
    }
  }

  const login = async (data: LoginRequest) => {
    const response = await authApi.login(data);
    await establishSession(response, "Login succeeded but user profile is invalid");
  };

  const register = async (data: RegisterRequest) => {
    const registerResponse = await authApi.register(data);

    // If backend already returns token/user, use it.
    const token =
      (registerResponse as any)?.token ?? (registerResponse as any)?.accessToken ?? (registerResponse as any)?.data?.token ?? (registerResponse as any)?.data?.accessToken;

    const user = (registerResponse as any)?.user ?? (registerResponse as any)?.data?.user;

    if (token) {
      await establishSession({ token, user }, "Registration succeeded but user profile is invalid");
      return;
    }

    // Fallback: register endpoint created user, but did not issue token.
    const loginResponse = await authApi.login({
      email: data.email,
      password: data.password,
    });

    await establishSession(loginResponse, "Registration succeeded but automatic sign-in failed");
  };

  const logout = async () => {
    await tokenStorage.deleteItem(TOKEN_KEY);
    socketManager.disconnect();
    queryClient.clear();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
