"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api, tokens } from "./api";
import type { Me } from "./types";

interface AuthValue {
  user: Me | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
  /** Comunidades donde la persona es miembro activo. */
  myCommunities: Me["communities"];
  /** Comunidades que puede administrar (autoridad o moderación). */
  managedCommunities: Me["communities"];
  canModerate: boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!tokens.access) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await api.me());
    } catch {
      tokens.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password);
    tokens.set(data.access, data.refresh);
    setUser(data.user);
  }, []);

  const signOut = useCallback(() => {
    tokens.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthValue>(() => {
    const communities = user?.communities ?? [];
    const active = communities.filter((m) => m.status === "activo");
    return {
      user,
      loading,
      signIn,
      signOut,
      refresh,
      myCommunities: active,
      managedCommunities: active.filter(
        (m) => m.role === "autoridad" || m.role === "moderador"
      ),
      canModerate:
        user?.role === "moderador" ||
        user?.role === "admin" ||
        active.some((m) => m.role === "autoridad" || m.role === "moderador"),
    };
  }, [user, loading, signIn, signOut, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
