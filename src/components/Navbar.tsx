import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, ShieldCheck, X } from 'lucide-react';
import { BRAND_ASSETS } from '../lib/domain';

interface NavbarProps {
  onBookNow: () => void;
}

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: '3D Stage', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Portfolio', href: '#portfolio' },
  { label: 'Raga Studio', href: '#raga-studio' },
  { label: 'Academy', href: '#sampoorna-academy' },
  { label: 'Contact', href: '#contact' },
] as const;

export function Navbar({ onBookNow }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-6">
        {/* Zone 1: Untouched official SS Audios logo */}
        <a
          href="#home"
          className="flex items-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF5A1F] rounded"
          aria-label="SS Audios Home"
        >
          <img
            src={BRAND_ASSETS.logo}
            alt="SS Audios Official Logo"
            className="h-10 sm:h-11 w-auto object-contain"
          />
        </a>

        {/* Zone 2: Clean single-line typography navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden xl:flex items-center gap-6 text-[14px] font-medium text-neutral-700"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative py-1 whitespace-nowrap shrink-0 hover:text-[#171717] transition-colors after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-[#FF5A1F] after:transition-all after:duration-200 hover:after:w-full"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 py-1 text-xs font-semibold text-neutral-500 hover:text-[#FF5A1F] transition-colors"
            title="SS Audios Admin Portal (/admin)"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </Link>
        </nav>

        {/* Zone 3: Single primary CTA + Mobile Drawer Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBookNow}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#FF5A1F] hover:bg-[#E04810] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]"
          >
            Book Now
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="xl:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-neutral-200 text-[#171717] hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="xl:hidden border-t border-neutral-200 bg-white px-4 py-4 shadow-lg"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-3 text-base font-medium text-[#171717] hover:bg-[#F3F3F3] rounded-lg transition-colors"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-3 text-base font-semibold text-[#FF5A1F] hover:bg-[#F3F3F3] rounded-lg transition-colors flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Portal (/admin)
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
