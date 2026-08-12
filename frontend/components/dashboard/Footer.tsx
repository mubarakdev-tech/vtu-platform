import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { siteConfig } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-gray-500 md:flex-row">
          
          <div className="text-center md:text-left">
            <p className="font-semibold text-emerald-700">{siteConfig.name}</p>
            <p className="mt-1 text-xs">{siteConfig.poweredBy}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <a
              href={`mailto:${siteConfig.email}`}
              className="flex items-center gap-1.5 hover:text-emerald-600"
            >
              <Mail size={13} />
              {siteConfig.email}
            </a>
            <a
              href={`tel:${siteConfig.phone}`}
              className="flex items-center gap-1.5 hover:text-emerald-600"
            >
              <Phone size={13} />
              {siteConfig.phone}
            </a>
          </div>

          <p className="text-xs text-gray-400">
            {siteConfig.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}