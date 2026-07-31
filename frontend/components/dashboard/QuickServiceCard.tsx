import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface QuickServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

export default function QuickServiceCard({
  title,
  description,
  icon: Icon,
  href,
  color,
}: QuickServiceCardProps) {
  return (
    <Link
      href={href}
      className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-white ${color}`}
      >
        <Icon size={28} />
      </div>

      <h3 className="text-lg font-semibold text-gray-800">
        {title}
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        {description}
      </p>
    </Link>
  );
}