import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Check, X } from 'lucide-react';
import { getVisibleItems, type SignatureService } from '../lib/domain';

interface SignatureServicesSectionProps {
  services: SignatureService[];
  onBookService: (service: SignatureService) => void;
}

export function SignatureServicesSection({ services, onBookService }: SignatureServicesSectionProps) {
  const [selectedService, setSelectedService] = useState<SignatureService | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const visibleServices = getVisibleItems(services);
  if (visibleServices.length === 0) return null;

  return (
    <section id="services" className="bg-white border-b border-neutral-200 py-14 lg:py-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#FF5A1F]">Signature Services</p>
            <h2 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#171717]">
              Live entertainment &amp; production
            </h2>
          </div>
          <p className="text-sm text-neutral-500">
            Transparent starting rates in ₹
          </p>
        </div>

        <div className="mt-9 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleServices.map((service, index) => (
            <motion.article
              key={service.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              className="group flex flex-col bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:border-neutral-400 transition-colors"
            >
              {/* Clean 4:3 visual header */}
              <div className="relative aspect-[4/3] bg-[#242424] overflow-hidden">
                {!failedImages[service.id] ? (
                  <img
                    src={service.image}
                    alt={service.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() => setFailedImages((prev) => ({ ...prev, [service.id]: true }))}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#171717] to-[#242424] text-white p-6">
                    <span className="font-display text-xl font-semibold">{service.title}</span>
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-lg font-bold text-[#171717]">
                      {String(index + 1).padStart(2, '0')}. {service.title}
                    </h3>
                    <span className="font-mono text-sm font-semibold text-[#FF5A1F] tabular-nums whitespace-nowrap">
                      {service.priceLabel}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed line-clamp-2">
                    {service.summary}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onBookService(service)}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#FF5A1F] hover:bg-[#E04810] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Book Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedService(service)}
                    aria-label={`View details for ${service.title}`}
                    className="inline-flex items-center gap-1 px-3.5 py-2.5 text-sm font-medium text-[#171717] bg-[#F3F3F3] hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Details
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* Service Details Modal */}
      {selectedService && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden border border-neutral-200 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9] bg-[#171717]">
              <img
                src={selectedService.image}
                alt={selectedService.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                aria-label="Close service details"
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 text-[#171717] flex items-center justify-center hover:bg-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 id="service-detail-title" className="font-display text-2xl sm:text-3xl font-bold text-[#171717]">
                  {selectedService.title}
                </h3>
                <span className="font-mono text-lg font-semibold text-[#FF5A1F] tabular-nums">
                  Starting from {selectedService.priceLabel}
                </span>
              </div>

              <p className="mt-2 text-sm text-neutral-500">Ideal for: {selectedService.idealFor}</p>
              <p className="mt-4 text-neutral-700 leading-relaxed">{selectedService.description}</p>

              <h4 className="mt-6 font-display text-sm font-semibold text-[#171717]">
                Included Highlights
              </h4>
              <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                {selectedService.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#FF5A1F] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-2.5 text-sm font-medium text-neutral-700 hover:text-[#171717] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const chosen = selectedService;
                    setSelectedService(null);
                    onBookService(chosen);
                  }}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#FF5A1F] hover:bg-[#E04810] rounded-lg transition-colors cursor-pointer"
                >
                  Book This Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
