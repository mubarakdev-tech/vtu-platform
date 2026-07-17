"use client";

import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { LoginResponse } from "@/types/auth";

export function useAuth() {
  const router = useRouter();

  const login = async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>(
      "/auth/login",
      {
        email,
        password,
      }
    );

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    router.push("/dashboard");
  };

  return {
    login,
  };
}