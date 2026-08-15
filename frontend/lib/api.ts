import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    // Do NOT redirect when /auth/me fails.
    // AuthContext handles an unauthenticated session itself.
    if (
      status === 401 &&
      !requestUrl.includes("/auth/me") &&
      !requestUrl.includes("/auth/login")
    ) {
      console.warn("Session expired.");

      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;