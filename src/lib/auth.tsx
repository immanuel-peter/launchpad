"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { AuthUser, Profile, UserRole } from "@/lib/types";

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    fullName?: string,
    companyName?: string
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return response.json() as Promise<T>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const data = await fetchJson<{ user: AuthUser; profile: Profile }>("/api/auth/me");
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const signUp: AuthContextType["signUp"] = async (
    email,
    password,
    role,
    fullName,
    companyName
  ) => {
    try {
      const data = await fetchJson<{ user: AuthUser; profile: Profile }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, role, fullName, companyName }),
      });
      setUser(data.user);
      setProfile(data.profile);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn: AuthContextType["signIn"] = async (email, password) => {
    try {
      const data = await fetchJson<{ user: AuthUser; profile: Profile }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      setProfile(data.profile);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await fetchJson("/api/auth/logout", { method: "POST" });
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
