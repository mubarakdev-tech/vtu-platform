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
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Prevent multiple initial session checks
  const hasCheckedSession = useRef(false);
  const isCheckingSession = useRef(false);

  // Load current user
  const refreshUser = async () => {
    // Prevent duplicate requests
    if (isCheckingSession.current) {
      return;
    }

    isCheckingSession.current = true;

    try {
      const { data } = await api.get("/auth/me");

      setUser(data.user || data);
    } catch (error) {
      console.log("Session check failed:", error);
      setUser(null);
    } finally {
      isCheckingSession.current = false;
      setLoading(false);
    }
  };

  // Check session once when AuthProvider starts
  useEffect(() => {
    if (hasCheckedSession.current) {
      return;
    }

    hasCheckedSession.current = true;

    refreshUser();
  }, []);

  // Login
  const login = async (
    email: string,
    password: string
  ): Promise<User> => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    setUser(data.user);

    return data.user;
  };

  // Logout
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  };

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

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext must be used inside AuthProvider"
    );
  }

  return context;
}