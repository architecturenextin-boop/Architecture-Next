import { Link } from "@tanstack/react-router";
import { brand } from "@/lib/brand";

export function Footer({ className = "" }: { className?: string }) {
  return (
    <footer className={`relative border-t border-border bg-[#F0EDE8] text-[#555555] ${className}`}>
      <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:py-16 md:grid-cols-4 md:gap-12 md:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-2 border border-border shadow-xs">
              <img src={brand.logoUrl} alt={brand.fullName} className="h-9 w-auto" />
            </div>
          </div>
          <p className="mt-5 max-w-sm font-display text-lg font-bold tracking-tight text-[#111111]">
            {brand.tagline}
          </p>
          <p className="mt-2 max-w-md text-sm text-[#555555]">{brand.description}</p>
        </div>
        <div>
          <div className="font-display text-sm font-bold uppercase tracking-wider text-[#111111]">
            Program
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-[#555555]">
            <li className="transition-colors hover:text-primary">
              <Link to="/courses">All Courses</Link>
            </li>
            <li className="transition-colors hover:text-primary">
              <a href="/#courses">Curriculum</a>
            </li>
            <li className="transition-colors hover:text-primary">
              <a href="/#instructor">Mentor</a>
            </li>
            <li className="transition-colors hover:text-primary">
              <a href="/#pricing">Pricing</a>
            </li>
            <li className="transition-colors hover:text-primary">
              <a href="/#faq">FAQ</a>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-display text-sm font-bold uppercase tracking-wider text-[#111111]">
            Contact
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-[#555555]">
            <li>{brand.contact.email}</li>
            <li>Phone: {brand.contact.phone}</li>
            <li className="leading-relaxed">{brand.contact.location}</li>
            <li className="transition-colors hover:text-primary">Privacy Policy</li>
            <li className="transition-colors hover:text-primary">Terms of Service</li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-border py-6 text-center text-xs text-[#888888]">
        © {new Date().getFullYear()} {brand.fullName}. All rights reserved.
      </div>
    </footer>
  );
}
