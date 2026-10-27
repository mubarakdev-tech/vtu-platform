import axios from "axios";

const token = process.env.MASKAWA_API_KEY || "";

const maskawaClient = axios.create({
  baseURL:
    process.env.MASKAWA_BASE_URL ||
    "https://www.maskawasub.com/api",

  timeout: 60000,

  headers: {
    "Content-Type": "application/json",
    Authorization: `Token ${token}`,
  },
});

export default maskawaClient;
