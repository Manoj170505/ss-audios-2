import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { BRAND_ASSETS, getVisibleItems, type RagaStudioService } from '../lib/domain';

interface RagaStudioSectionProps {
  services: RagaStudioService[];
  onBookStudioService: (service: RagaStudioService) => void;
}

export function RagaStudioSection({ services, onBookStudioService }: RagaStudioSectionProps) {
  const [imgError, setImgError] = useState(false);
  const visibleServices = getVisibleItems(services);
  if (visibleServices.length === 0) return null;

  return (
    <section id="raga-studio" className="bg-[#F3F3F3] border-b border-neutral-200 py-14 lg:py-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Clean Editorial Studio Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-5 flex flex-col justify-center">
            <p className="text-sm font-semibold text-[#FF5A1F]">Raga Studio</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#171717] leading-[1.1] [text-wrap:balance]">
              Acoustic precision meets creative freedom.
            </h2>
            <p className="mt-3 text-neutral-600 leading-relaxed max-w-[42ch]">
              Jamming, multi-track recording, vocal mastering, podcasting &amp; chroma-key video.
            </p>
          </div>

          <div className="lg:col-span-7 relative rounded-2xl overflow-hidden bg-[#242424] border border-neutral-200 min-h-[260px] sm:min-h-[340px]">
            {!imgError ? (
              <img
                src={BRAND_ASSETS.ragaStudio}
                alt="Raga Studio acoustic control room, digital console, and glass vocal recording booth"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover lg:absolute lg:inset-0"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-8 text-white font-display text-2xl">
                Raga Studio
              </div>
            )}
          </div>
        </div>

        {/* Minimal Studio Rate Cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleServices.map((service) => (
            <article
              key={service.id}
              className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-400 transition-colors"
            >
              <div>
                <h3 className="font-display text-base font-bold text-[#171717]">{service.title}</h3>
                <p className="mt-1 font-mono text-base font-semibold text-[#FF5A1F] tabular-nums">
                  {service.priceLabel}
                </p>
                <p className="mt-2.5 text-xs sm:text-sm text-neutral-600 leading-relaxed line-clamp-2">
                  {service.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onBookStudioService(service)}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-[#171717] hover:bg-[#FF5A1F] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Book Slot
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
