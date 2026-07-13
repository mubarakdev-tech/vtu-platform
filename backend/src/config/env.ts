import { cleanEnv, str, port } from "envalid";

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
});

export default env;