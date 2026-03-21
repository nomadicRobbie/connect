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
          socketManager.connect(token);
        }
      } catch {
        // Token invalid or expired — clear it
        await tokenStorage.deleteItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (data: LoginRequest) => {
    const { token, user: me } = await authApi.login(data);
    await tokenStorage.setItem(TOKEN_KEY, token);
    socketManager.connect(token);
    setUser(me);
  };

  const register = async (data: RegisterRequest) => {
    const { token, user: me } = await authApi.register(data);
    await tokenStorage.setItem(TOKEN_KEY, token);
    socketManager.connect(token);
    setUser(me);
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
