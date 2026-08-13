import axios from "axios";

console.log("=================================");
console.log("Paystack Secret Key loaded:", process.env.PAYSTACK_SECRET_KEY ? "Yes" : "No");
console.log("Key starts with:", process.env.PAYSTACK_SECRET_KEY?.substring(0, 10));
console.log("=================================");

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export default paystack;