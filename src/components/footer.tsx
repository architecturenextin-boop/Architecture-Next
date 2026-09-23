import { Link } from "@tanstack/react-router";
import { brand } from "@/lib/brand";
import { Mail, Phone, MapPin, Sparkles, ShieldCheck, ArrowUpRight } from "lucide-react";

export function Footer({ className = "" }: { className?: string }) {
  return (
    <footer className={`relative overflow-hidden border-t border-white/10 bg-[#0B0B14] text-zinc-400 ${className}`}>
      {/* Ambient Brand Glow Orbs */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-primary/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-accent/15 blur-[120px]" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:py-16 md:grid-cols-12 md:gap-10 md:px-8">
        {/* Brand Column */}
        <div className="md:col-span-5 space-y-4">
          <div className="inline-flex items-center gap-3">
            <div className="rounded-2xl bg-white p-2.5 shadow-soft border border-white/10">
              <img src={brand.logoUrl} alt={brand.fullName} className="h-8 sm:h-9 w-auto object-contain" />
            </div>
          </div>
          
          <p className="font-display text-base sm:text-lg font-bold tracking-tight text-white leading-snug">
            {brand.tagline}
          </p>
          
          <p className="max-w-md text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {brand.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-zinc-400">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white">
              <Sparkles className="h-3 w-3 text-primary" /> Industry Mentorship
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white">
              <ShieldCheck className="h-3 w-3 text-emerald-400" /> Verified Certification
            </span>
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div className="md:col-span-3">
          <div className="font-display text-xs font-bold uppercase tracking-[0.16em] text-white">
            Program & Curriculum
          </div>
          <ul className="mt-4 space-y-2.5 text-xs sm:text-sm">
            <li>
              <Link to="/courses" className="inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-white">
                All Professional Courses
                <ArrowUpRight className="h-3 w-3 opacity-60" />
              </Link>
            </li>
            <li>
              <a href="/#courses" className="text-zinc-400 transition-colors hover:text-white">
                Core Curriculum
              </a>
            </li>
            <li>
              <a href="/#instructor" className="text-zinc-400 transition-colors hover:text-white">
                Architect Mentors
              </a>
            </li>
            <li>
              <a href="/#pricing" className="text-zinc-400 transition-colors hover:text-white">
                Tuition &amp; Fees
              </a>
            </li>
            <li>
              <a href="/#faq" className="text-zinc-400 transition-colors hover:text-white">
                Frequently Asked Questions
              </a>
            </li>
          </ul>
        </div>

        {/* Contact & Studio Location */}
        <div className="md:col-span-4 space-y-3">
          <div className="font-display text-xs font-bold uppercase tracking-[0.16em] text-white">
            Studio &amp; Contact
          </div>
          <ul className="mt-4 space-y-3 text-xs sm:text-sm">
            <li className="flex items-start gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <a href={`mailto:${brand.contact.email}`} className="text-zinc-300 hover:text-white transition-colors">
                {brand.contact.email}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <a href={`tel:${brand.contact.phone.replace(/\s+/g, "")}`} className="text-zinc-300 hover:text-white transition-colors">
                {brand.contact.phone}
              </a>
            </li>
            <li className="flex items-start gap-2.5 leading-relaxed text-zinc-400">
              <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <span>{brand.contact.location}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright & Legal Line */}
      <div className="relative border-t border-white/10 bg-black/40 py-5">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-5 sm:px-8 text-center text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} {brand.fullName}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-zinc-400 text-xs">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer transition-colors">Refund Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
