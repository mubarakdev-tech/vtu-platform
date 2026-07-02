import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          VTU Platform
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link href="/">Home</Link>
          <Link href="/services">Services</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/contact">Contact</Link>
        </div>

        <div className="flex gap-3">
          <Button variant="outline">Login</Button>
          <Button>Register</Button>
        </div>
      </div>
    </nav>
  );
}