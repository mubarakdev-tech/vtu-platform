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
    // Authentication is handled through
    // the HttpOnly cookie.
    //
    // DO NOT manually add Authorization:
    // Bearer token here.

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status = error.response?.status;

    const requestUrl =
      error.config?.url || "";

    // ==========================================
    // AUTH SESSION CHECK
    // ==========================================
    //
    // /auth/me returning 401 simply means there
    // is no active login session.
    //
    // Do NOT treat this as a console API error.
    //
    if (
      status === 401 &&
      requestUrl.includes("/auth/me")
    ) {
      return Promise.reject(error);
    }

    // ==========================================
    // LOG OTHER API ERRORS
    // ==========================================

    console.error(
      "API ERROR:",
      status,
      requestUrl,
      error.response?.data
    );

    // ==========================================
    // SESSION EXPIRED
    // ==========================================

    if (
      status === 401 &&
      !requestUrl.includes("/auth/login")
    ) {
      console.warn(
        "Session expired."
      );

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