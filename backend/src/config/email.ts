import { Resend } from "resend";
import env from "./env";

// ==========================================
// RESEND EMAIL CONFIGURATION
// ==========================================

console.log("=================================");
console.log("RESEND EMAIL CONFIGURATION");
console.log(
  "RESEND API KEY LOADED:",
  !!env.RESEND_API_KEY
);
console.log("=================================");

// ==========================================
// CREATE RESEND CLIENT
// ==========================================

const resend = new Resend(
  env.RESEND_API_KEY
);

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default resend;