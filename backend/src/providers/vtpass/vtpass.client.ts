import axios from "axios";

const vtpassClient = axios.create({
  baseURL: process.env.VTPASS_BASE_URL || "https://vtpass.com/api",
  timeout: 60000,
  headers: {
    "api-key": process.env.VTPASS_API_KEY || "",
    "public-key": process.env.VTPASS_PUBLIC_KEY || "",
    "secret-key": process.env.VTPASS_SECURITY_KEY || "",
    "Content-Type": "application/json",
  },
});

export default vtpassClient;
