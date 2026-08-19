import axios from "axios";

const secretKey = process.env.PAYSTACK_SECRET_KEY;

console.log("=================================");
console.log(
  "Paystack Secret Key loaded:",
  secretKey ? "Yes" : "No"
);
console.log(
  "Paystack Key starts with:",
  secretKey?.substring(0, 10)
);
console.log("=================================");

if (!secretKey) {
  console.error(
    "❌ PAYSTACK_SECRET_KEY is missing from environment variables"
  );
}

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export default paystack;