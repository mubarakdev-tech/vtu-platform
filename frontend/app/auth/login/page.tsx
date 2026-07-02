import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <MainLayout>
      <div className="flex items-center justify-center py-20">
        <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full rounded border px-3 py-2"
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full rounded border px-3 py-2"
            />

            <Button className="w-full">Login</Button>
          </div>

          <p className="text-sm text-center mt-4">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-blue-600">
              Register
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}