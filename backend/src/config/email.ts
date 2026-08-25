import nodemailer from "nodemailer";
import env from "./env";

console.log("EMAIL USER:", env.EMAIL_USER);
console.log("PASSWORD LENGTH:", env.EMAIL_PASSWORD.length);
console.log(
  "PASSWORD FIRST/LAST:",
  env.EMAIL_PASSWORD[0],
  env.EMAIL_PASSWORD[env.EMAIL_PASSWORD.length - 1]
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD,
  },
});

export default transporter;
