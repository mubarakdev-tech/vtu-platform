import "dotenv/config";

import { cleanEnv, str, port } from "envalid";

console.log("=================================");
console.log("ENVIRONMENT CHECK");

console.log(
  "MONGO_URI loaded:",
  !!process.env.MONGO_URI
);

console.log(
  "JWT_SECRET loaded:",
  !!process.env.JWT_SECRET
);

console.log(
  "VTPASS_API_KEY loaded:",
  !!process.env.VTPASS_API_KEY
);

console.log(
  "PAYSTACK_SECRET_KEY loaded:",
  !!process.env.PAYSTACK_SECRET_KEY
);

console.log(
  "BIGISUB_API_KEY loaded:",
  !!process.env.BIGISUB_API_KEY
);

console.log(
  "EMAIL_USER loaded:",
  !!process.env.EMAIL_USER
);

console.log(
  "EMAIL_PASSWORD loaded:",
  !!process.env.EMAIL_PASSWORD
);

console.log(
  "FRONTEND_URL loaded:",
  !!process.env.FRONTEND_URL
);

console.log("=================================");

const env = cleanEnv(process.env, {
  // ==========================================
  // APPLICATION
  // ==========================================

  NODE_ENV: str({
    default: "development",
    choices: [
      "development",
      "production",
      "test",
    ],
  }),

  PORT: port({
    default: 5000,
  }),

  // ==========================================
  // DATABASE
  // ==========================================

  MONGO_URI: str(),

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  JWT_SECRET: str(),

  JWT_EXPIRES_IN: str({
    default: "7d",
  }),

  // ==========================================
  // FRONTEND
  // ==========================================

  FRONTEND_URL: str(),

  // ==========================================
  // VTPASS
  // ==========================================

  VTPASS_BASE_URL: str(),

  VTPASS_API_KEY: str(),

  VTPASS_PUBLIC_KEY: str(),

  VTPASS_SECURITY_KEY: str(),

  // ==========================================
  // BIGISUB
  // ==========================================

  BIGISUB_BASE_URL: str(),

  BIGISUB_API_KEY: str(),

  BIGISUB_PIN: str(),

  // ==========================================
  // PAYSTACK
  // ==========================================

  PAYSTACK_SECRET_KEY: str(),

  PAYSTACK_PUBLIC_KEY: str(),

  // ==========================================
  // CLOUDINARY
  // ==========================================

  CLOUDINARY_CLOUD_NAME: str(),

  CLOUDINARY_API_KEY: str(),

  CLOUDINARY_API_SECRET: str(),

  // ==========================================
  // EMAIL
  // ==========================================

  EMAIL_USER: str(),

  EMAIL_PASSWORD: str(),
});

export default env;
