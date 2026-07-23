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
  console.log("\n========== VTPASS REQUEST ==========");
  console.log("METHOD :", config.method?.toUpperCase());
  console.log("URL    :", `${config.baseURL}${config.url}`);
  console.log("HEADERS:", config.headers);
  console.log("BODY   :", config.data);
  console.log("====================================\n");
  return config;
});

vtpassClient.interceptors.response.use(
  (response) => {
    console.log("\n========== VTPASS SUCCESS ==========");
    console.log("STATUS :", response.status);
    console.log("DATA   :", response.data);
    console.log("====================================\n");
    return response;
  },
  (error) => {
    console.log("\n========== VTPASS ERROR ==========");
    console.log("MESSAGE :", error.message);
    console.log("CODE    :", error.code);
    console.log("STATUS  :", error.response?.status);
    console.log("DATA    :", error.response?.data);
    console.log("==================================\n");

    return Promise.reject(error);
  }
);