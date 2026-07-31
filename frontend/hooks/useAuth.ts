import { useState } from "react";
import api from "@/lib/api";
import { User } from "@/types/user";

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);


  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);

      setUser(user);

      return response.data;

    } catch (error) {
      console.error("Login error:", error);
      throw error;

    } finally {
      setLoading(false);
    }
  };


  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string
  ) => {
    try {
      setLoading(true);

      const response = await api.post("/auth/register", {
        name,
        email,
        phone,
        password,
      });

      return response.data;

    } catch (error) {
      console.error("Register error:", error);
      throw error;

    } finally {
      setLoading(false);
    }
  };


  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };


  return {
    user,
    loading,
    login,
    register,
    logout,
  };
}