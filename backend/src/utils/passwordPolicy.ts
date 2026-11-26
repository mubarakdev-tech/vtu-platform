export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 12 characters and include uppercase, lowercase, number and special character.";

export const isStrongPassword = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length >= 12 &&
  value.length <= 72 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /\d/.test(value) &&
  /[^A-Za-z0-9\s]/.test(value);
