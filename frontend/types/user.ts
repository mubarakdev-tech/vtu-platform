export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
  isVerified?: boolean;
  profilePicture?: string | null;
  walletBalance?: number;
  createdAt?: string;
}