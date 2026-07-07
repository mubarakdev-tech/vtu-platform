import { z } from "zod";

export const airtimeSchema = z.object({
  network: z.string().min(1, "Network is required"),

  phone: z
    .string()
    .regex(/^0\d{10}$/, "Phone number must be 11 digits"),

  amount: z
    .number()
    .positive("Amount must be greater than zero"),
});