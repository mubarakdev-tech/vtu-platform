import axios from "axios";

export const vtpassClient = axios.create({
  baseURL: process.env.VTPASS_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "api-key": process.env.VTPASS_API_KEY,
    "secret-key": process.env.VTPASS_SECURITY_KEY,
  },
});

vtpassClient.interceptors.request.use((config) => {
  console.log("=== VTPASS REQUEST ===");
  console.log("URL:", config.baseURL + config.url);
  console.log("Headers:", config.headers);
  console.log("Body:", config.data);
  return config;
});

vtpassClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("=== VTPASS RESPONSE ===");
    console.log(error.response?.status);
    console.log(error.response?.data);
    return Promise.reject(error);
  }
);