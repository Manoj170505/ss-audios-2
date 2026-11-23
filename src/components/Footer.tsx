import { Globe, Instagram, Mail, MessageCircle, Phone, Sliders } from 'lucide-react';
import { BRAND_ASSETS, BUSINESS_CONTACT } from '../lib/domain';

interface FooterProps {
  onBookNow: () => void;
  onOpenAdmin: () => void;
}

export function Footer({ onBookNow, onOpenAdmin }: FooterProps) {
  return (
    <footer className="bg-[#171717] text-neutral-300 border-t border-neutral-800">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <div className="inline-block bg-white rounded-xl px-4 py-2.5">
              <img
                src={BRAND_ASSETS.logo}
                alt="SS Audios Official Logo"
                className="h-9 w-auto object-contain"
              />
            </div>
            <p className="mt-4 text-sm text-neutral-400 leading-relaxed max-w-xs">
              Live audio, orchestras, Raga Studio &amp; Sampoorna Music Academy · Erode, Tamil Nadu.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onBookNow}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#FF5A1F] hover:bg-[#E04810] rounded-lg transition-colors cursor-pointer"
              >
                Book Now
              </button>
              <button
                type="button"
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-200 bg-white/10 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-[#FF5A1F]" />
                Admin Portal
              </button>
            </div>
          </div>

          {/* Verticals */}
          <div className="lg:col-span-3">
            <h3 className="font-display text-sm font-semibold text-white tracking-wide">
              Services
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="#services" className="hover:text-[#FF5A1F] transition-colors">
                  Event Services
                </a>
              </li>
              <li>
                <a href="#portfolio" className="hover:text-[#FF5A1F] transition-colors">
                  Video Portfolio
                </a>
              </li>
              <li>
                <a href="#dj-packages" className="hover:text-[#FF5A1F] transition-colors">
                  DJ Packages (₹)
                </a>
              </li>
              <li>
                <a href="#raga-studio" className="hover:text-[#FF5A1F] transition-colors">
                  Raga Studio
                </a>
              </li>
              <li>
                <a href="#sampoorna-academy" className="hover:text-[#FF5A1F] transition-colors">
                  Sampoorna Academy
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h3 className="font-display text-sm font-semibold text-white tracking-wide">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="#home" className="hover:text-[#FF5A1F] transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#FF5A1F] transition-colors">
                  3D Stage
                </a>
              </li>
              <li>
                <a href="#event-planner" className="hover:text-[#FF5A1F] transition-colors">
                  Production Lab
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-[#FF5A1F] transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Direct Contact */}
          <div className="lg:col-span-3">
            <h3 className="font-display text-sm font-semibold text-white tracking-wide">
              Direct Channels
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${BUSINESS_CONTACT.phoneDisplay.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#FF5A1F]" />
                  {BUSINESS_CONTACT.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={BUSINESS_CONTACT.whatsappBase}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#FF5A1F]" />
                  WhatsApp Direct Booking
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${BUSINESS_CONTACT.email}`}
                  className="inline-flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#FF5A1F]" />
                  {BUSINESS_CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={BUSINESS_CONTACT.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <Instagram className="w-4 h-4 text-[#FF5A1F]" />
                  {BUSINESS_CONTACT.instagramHandle}
                </a>
              </li>
              <li>
                <a
                  href={BUSINESS_CONTACT.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <Globe className="w-4 h-4 text-[#FF5A1F]" />
                  {BUSINESS_CONTACT.website}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>
            &copy; {new Date().getFullYear()} SS Audios · Raga Studio · Sampoorna Music Academy. All
            rights reserved.
          </p>
          <p>Erode, Tamil Nadu, India · Map data powered by Google Maps Platform</p>
        </div>
      </div>
    </footer>
  );
}
