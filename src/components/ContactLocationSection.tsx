import { ExternalLink, Globe, Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { BUSINESS_CONTACT } from '../lib/domain';

interface ContactLocationSectionProps {
  onOpenEnquiry: () => void;
}

export function ContactLocationSection({ onOpenEnquiry }: ContactLocationSectionProps) {
  return (
    <section id="contact" className="bg-white py-14 lg:py-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Contact Details & Instant Actions */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <p className="text-sm font-semibold text-[#FF5A1F]">Contact</p>
              <h2 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#171717]">
                Let&apos;s plan your event.
              </h2>

              <dl className="mt-7 space-y-4 text-sm">
                <div className="flex items-start gap-3.5">
                  <Phone className="w-5 h-5 text-[#FF5A1F] shrink-0 mt-0.5" />
                  <div>
                    <dt className="font-semibold text-[#171717]">Phone / WhatsApp</dt>
                    <dd className="text-neutral-600 mt-0.5 tabular-nums">
                      {BUSINESS_CONTACT.phoneDisplay}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Mail className="w-5 h-5 text-[#FF5A1F] shrink-0 mt-0.5" />
                  <div>
                    <dt className="font-semibold text-[#171717]">Email</dt>
                    <dd className="text-neutral-600 mt-0.5">{BUSINESS_CONTACT.email}</dd>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Instagram className="w-5 h-5 text-[#FF5A1F] shrink-0 mt-0.5" />
                  <div>
                    <dt className="font-semibold text-[#171717]">Instagram</dt>
                    <dd className="mt-0.5">
                      <a
                        href={BUSINESS_CONTACT.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-600 hover:text-[#FF5A1F] transition-colors"
                      >
                        {BUSINESS_CONTACT.instagramHandle}
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Globe className="w-5 h-5 text-[#FF5A1F] shrink-0 mt-0.5" />
                  <div>
                    <dt className="font-semibold text-[#171717]">Official Website</dt>
                    <dd className="mt-0.5">
                      <a
                        href={BUSINESS_CONTACT.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-600 hover:text-[#FF5A1F] transition-colors"
                      >
                        {BUSINESS_CONTACT.website}
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <MapPin className="w-5 h-5 text-[#FF5A1F] shrink-0 mt-0.5" />
                  <div>
                    <dt className="font-semibold text-[#171717]">Location</dt>
                    <dd className="mt-0.5">
                      <a
                        href={BUSINESS_CONTACT.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-600 hover:text-[#FF5A1F] transition-colors inline-flex items-center gap-1.5"
                      >
                        {BUSINESS_CONTACT.fullAddress}
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            {/* Direct Action Buttons */}
            <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onOpenEnquiry}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#FF5A1F] hover:bg-[#E04810] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Booking
              </button>

              <a
                href={`tel:+${BUSINESS_CONTACT.phoneDigits}`}
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#171717] bg-[#F3F3F3] hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>

              <a
                href={`mailto:${BUSINESS_CONTACT.email}`}
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#171717] border border-neutral-300 hover:border-[#171717] rounded-lg transition-colors whitespace-nowrap"
              >
                <Mail className="w-4 h-4" />
                Email
              </a>
            </div>
          </div>

          {/* Interactive Google Maps Embed */}
          <div className="lg:col-span-7 flex flex-col">
            <div
              data-testid="google-map-container"
              className="w-full h-[400px] lg:h-full lg:min-h-[460px] rounded-2xl overflow-hidden border border-neutral-200 bg-[#F3F3F3] relative shadow-sm"
            >
              <iframe
                title="Ss audios Google Map Location"
                src={BUSINESS_CONTACT.mapEmbedUrl}
                className="w-full h-full min-h-[400px] lg:min-h-[460px] border-0"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                Verified location · Ss audios (Erode, Tamil Nadu)
              </span>
              <a
                href={BUSINESS_CONTACT.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#171717] hover:text-[#FF5A1F] transition-colors"
              >
                Get Directions →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
