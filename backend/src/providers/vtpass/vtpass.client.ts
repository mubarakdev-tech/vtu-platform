import axios from "axios";

const vtpassClient = axios.create({
  baseURL: process.env.VTPASS_BASE_URL || "https://sandbox.vtpass.com/api",
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    "api-key": process.env.VTPASS_API_KEY || "",
    "secret-key": process.env.VTPASS_SECRET_KEY || process.env.VTPASS_SECURITY_KEY || "",
    "public-key": process.env.VTPASS_PUBLIC_KEY || "",
  },
});

// Log requests (optional but useful)
vtpassClient.interceptors.request.use((config) => {
  console.log("========== VTPASS REQUEST ==========");
  console.log("URL:", (config.baseURL || "") + (config.url || ""));
  console.log("Method:", config.method?.toUpperCase());
  return config;
});

vtpassClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("========== VTPASS CLIENT ERROR ==========");
    console.error(error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default vtpassClient;