"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";

import api from "@/lib/api";
import { User } from "@/types/user";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  // ==========================================
  // PREVENT MULTIPLE INITIAL SESSION CHECKS
  // ==========================================

  const hasCheckedSession =
    useRef(false);

  const isCheckingSession =
    useRef(false);

  // ==========================================
  // LOAD CURRENT USER
  // ==========================================

  const refreshUser = async (): Promise<void> => {
    if (isCheckingSession.current) {
      return;
    }

    isCheckingSession.current = true;

    try {
      const { data } =
        await api.get("/auth/me");

      setUser(
        data?.user || data || null
      );
    } catch (error: any) {
      console.log(
        "Session check failed:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setUser(null);
    } finally {
      isCheckingSession.current = false;
      setLoading(false);
    }
  };

  // ==========================================
  // CHECK SESSION ON STARTUP
  // ==========================================

  useEffect(() => {
    if (hasCheckedSession.current) {
      return;
    }

    hasCheckedSession.current = true;

    refreshUser();
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================

  const login = async (
    email: string,
    password: string
  ): Promise<User> => {
    const { data } =
      await api.post("/auth/login", {
        email,
        password,
      });

    // ========================================
    // SAVE JWT TOKEN
    // ========================================

    if (
      typeof window !== "undefined" &&
      data?.token
    ) {
      localStorage.setItem(
        "token",
        data.token
      );
    }

    // ========================================
    // SAVE USER
    // ========================================

    const loggedInUser =
      data?.user || null;

    setUser(loggedInUser);

    return loggedInUser;
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error(
        "Logout request failed:",
        error
      );
    } finally {
      // Remove locally stored JWT
      if (
        typeof window !== "undefined"
      ) {
        localStorage.removeItem("token");
      }

      setUser(null);
    }
  };

  // ==========================================
  // PROVIDER
  // ==========================================

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ==========================================
// AUTH HOOK
// ==========================================

export function useAuthContext() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext must be used inside AuthProvider"
    );
  }

  return context;
}