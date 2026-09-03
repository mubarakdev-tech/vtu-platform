"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaInstagram,
  FaWhatsapp,
  FaEnvelope,
  FaPhone,
  FaArrowUp,
} from "react-icons/fa6";

import { siteConfig } from "@/lib/site";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer
      id="contact"
      className="relative overflow-hidden bg-slate-950 text-white"
    >
      {/* Background Glow */}
      <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-14 lg:grid-cols-4">

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-black text-emerald-400">
              {siteConfig.name}
            </h2>
            <p className="mt-3 text-lg italic text-emerald-200">
              {siteConfig.tagline}
            </p>
            <p className="mt-6 leading-8 text-slate-300">
              {siteConfig.description}
            </p>
            <p className="mt-6 text-sm font-medium text-emerald-300">
              {siteConfig.poweredBy}
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="mb-6 text-xl font-bold">Quick Links</h3>
            <div className="space-y-4">
              <Link href="/" className="block transition hover:text-emerald-400">
                Home
              </Link>
              <Link href="/#services" className="block transition hover:text-emerald-400">
                Services
              </Link>
              <Link href="/#why" className="block transition hover:text-emerald-400">
                Why AbuPay
              </Link>
              <Link href="/#reviews" className="block transition hover:text-emerald-400">
                Testimonials
              </Link>
              <Link href="/#faq" className="block transition hover:text-emerald-400">
                FAQ
              </Link>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="mb-6 text-xl font-bold">Contact</h3>
            <div className="space-y-5">
              <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-3 hover:text-emerald-400">
                <FaEnvelope />
                {siteConfig.email}
              </a>
              <a href={`tel:${siteConfig.phone}`} className="flex items-center gap-3 hover:text-emerald-400">
                <FaPhone />
                {siteConfig.phone}
              </a>
              <a href={`https://wa.me/${siteConfig.whatsapp}`} target="_blank" className="flex items-center gap-3 hover:text-green-400">
                <FaWhatsapp />
                WhatsApp Support
              </a>
            </div>
          </motion.div>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h3 className="mb-6 text-xl font-bold">Newsletter</h3>
            <p className="mb-5 text-slate-300">
              Subscribe to receive updates and exclusive offers.
            </p>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            />
            <button className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-semibold transition hover:bg-emerald-500">
              Subscribe
            </button>
            <a
              href={siteConfig.instagram}
              target="_blank"
              className="mt-6 flex items-center gap-3 text-pink-400 hover:text-pink-300"
            >
              <FaInstagram />
              @abupayng
            </a>
          </motion.div>
        </div>

        <div className="mt-20 border-t border-slate-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
            <p className="text-slate-400">{siteConfig.copyright}</p>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 transition hover:bg-emerald-500"
            >
              <FaArrowUp />
              Back to Top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}