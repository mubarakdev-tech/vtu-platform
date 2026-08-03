import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "@/context/AuthContext";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AbuPay",
    template: "%s | AbuPay",
  },
  description:
    "Fast, secure and reliable VTU platform for airtime, data, electricity, TV subscriptions and wallet services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-slate-50">
        <AuthProvider>
          {children}

          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={10}
            toastOptions={{
              duration: 4000,

              style: {
                background: "#ffffff",
                color: "#0f172a",
                borderRadius: "14px",
                padding: "14px 18px",
                fontSize: "14px",
                fontWeight: 500,
                boxShadow:
                  "0 10px 25px rgba(0,0,0,0.08)",
              },

              success: {
                iconTheme: {
                  primary: "#16a34a",
                  secondary: "#ffffff",
                },
              },

              error: {
                iconTheme: {
                  primary: "#dc2626",
                  secondary: "#ffffff",
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}