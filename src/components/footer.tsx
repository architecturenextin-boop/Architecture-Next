import { Link } from "@tanstack/react-router";
import { brand } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-gradient-ink text-background mt-16">
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-brand-purple/30 blur-[120px]" />
      <div className="pointer-events-none absolute -left-32 -bottom-32 h-80 w-80 rounded-full bg-brand-blue/30 blur-[120px]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-background p-2">
              <img src={brand.logoUrl} alt={brand.fullName} className="h-9 w-auto" />
            </div>
          </div>
          <p className="mt-5 max-w-sm font-display text-lg font-bold tracking-tight text-background">
            {brand.tagline}
          </p>
          <p className="mt-2 max-w-md text-sm text-background/60">{brand.description}</p>
        </div>
        <div>
          <div className="font-display text-sm font-bold uppercase tracking-wider text-background/80">
            Program
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-background/60">
            <li className="transition-colors hover:text-background">
              <Link to="/">Curriculum</Link>
            </li>
            <li className="transition-colors hover:text-background">
              <Link to="/">Mentor</Link>
            </li>
            <li className="transition-colors hover:text-background">
              <Link to="/">Pricing</Link>
            </li>
            <li className="transition-colors hover:text-background">
              <Link to="/">FAQ</Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-display text-sm font-bold uppercase tracking-wider text-background/80">
            Contact
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-background/60">
            <li>{brand.contact.email}</li>
            <li>Phone: {brand.contact.phone}</li>
            <li className="leading-relaxed">{brand.contact.location}</li>
            <li className="transition-colors hover:text-background">Privacy Policy</li>
            <li className="transition-colors hover:text-background">Terms of Service</li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-background/10 py-6 text-center text-xs text-background/50">
        © {new Date().getFullYear()} {brand.fullName}. All rights reserved.
      </div>
    </footer>
  );
}
