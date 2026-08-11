import "dotenv/config";
import { cleanEnv, str, port } from "envalid";

console.log("=================================");
console.log("ENVIRONMENT CHECK");
console.log("EMAIL_USER loaded:", !!process.env.EMAIL_USER);
console.log("EMAIL_PASSWORD loaded:", !!process.env.EMAIL_PASSWORD);
console.log("MONGO_URI loaded:", !!process.env.MONGO_URI);
console.log("JWT_SECRET loaded:", !!process.env.JWT_SECRET);
console.log("=================================");

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    default: "development",
    choices: ["development", "production", "test"],
  }),

  PORT: port({
    default: 5000,
  }),

  MONGO_URI: str(),

  JWT_SECRET: str(),

  JWT_EXPIRES_IN: str({
    default: "7d",
  }),

  VTPASS_API_KEY: str(),
  VTPASS_PUBLIC_KEY: str(),
  VTPASS_SECURITY_KEY: str(),

  EMAIL_USER: str(),
  EMAIL_PASSWORD: str(),
});

export default env;