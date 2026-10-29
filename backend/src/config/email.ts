import { Resend } from "resend";
import env from "./env";

// ==========================================
// RESEND EMAIL CONFIGURATION
// ==========================================

const hasResendCredentials =
  Boolean(env.RESEND_API_KEY) &&
  Boolean(env.EMAIL_FROM);

console.log("=================================");
console.log("RESEND EMAIL CONFIGURATION");
console.log(
  "RESEND CREDENTIALS CONFIGURED:",
  hasResendCredentials
);
console.log("=================================");

// ==========================================
// CREATE RESEND CLIENT
// ==========================================

// Create the client only when valid configuration
// is available. Otherwise, email sending must be
// guarded by the calling code.

const resend = hasResendCredentials
  ? new Resend(env.RESEND_API_KEY)
  : null;

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default resend;