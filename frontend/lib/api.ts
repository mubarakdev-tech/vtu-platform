import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// REQUEST INTERCEPTOR
// ==========================================
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    // Normal when user is not logged in
    if (status === 401 && requestUrl.includes("/auth/me")) {
      return Promise.reject(error);
    }

    console.error(
      "API ERROR:",
      status,
      requestUrl,
      error.response?.data
    );

    if (
      status === 401 &&
      !requestUrl.includes("/auth/login") &&
      !requestUrl.includes("/auth/register")
    ) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");

        const path = window.location.pathname;

        if (
          path !== "/login" &&
          path !== "/auth/login" &&
          !path.startsWith("/auth/")
        ) {
          window.location.href = "/auth/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;