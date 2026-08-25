import axios from "axios";

const token = process.env.BIGISUB_API_KEY || "";

const bigisubClient = axios.create({
  baseURL:
    process.env.BIGISUB_BASE_URL ||
    "https://api.bigisub.ng/api/v2",

  timeout: 60000,

  headers: {
    "Content-Type": "application/json",
    Authorization: `Token ${token}`,
  },
});

export default bigisubClient;
