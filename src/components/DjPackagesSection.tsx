import { useState, useRef, useEffect } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Film,
  Play,
  SlidersHorizontal,
  Upload,
  X,
  Volume2,
} from 'lucide-react';
import {
  formatPrice,
  getDjPackagePrice,
  getVisibleItems,
  ensureDjPackageSlots,
  type CurrencyCode,
  type DjPackage,
  type PortfolioSlot,
} from '../lib/domain';
import { resolveMediaUrl } from '../lib/api';

interface DjPackagesSectionProps {
  packages: DjPackage[];
  currency: CurrencyCode;
  onBookPackage: (pkg: DjPackage) => void;
  onOpenAdminPricing: () => void;
  onOpenAdminForSlot?: (slotId: string) => void;
}

export function DjPackagesSection({
  packages,
  currency,
  onBookPackage,
  onOpenAdminPricing,
  onOpenAdminForSlot,
}: DjPackagesSectionProps) {
  const visiblePackages = getVisibleItems(packages);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    visiblePackages[0]?.id || 'starter',
  );
  const [activeModalSlotIndex, setActiveModalSlotIndex] = useState<number | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  // Sync selected package if current selected gets hidden or removed
  useEffect(() => {
    if (visiblePackages.length > 0 && !visiblePackages.some((p) => p.id === selectedPackageId)) {
      setSelectedPackageId(visiblePackages[0].id);
    }
  }, [visiblePackages, selectedPackageId]);

  const activePackage =
    visiblePackages.find((p) => p.id === selectedPackageId) || visiblePackages[0];

  // Guarantee 10 slots per package
  const packageSlots: PortfolioSlot[] = activePackage
    ? ensureDjPackageSlots(activePackage).slice(0, 10)
    : [];

  const activeModalSlot: PortfolioSlot | null =
    activeModalSlotIndex !== null ? packageSlots[activeModalSlotIndex] ?? null : null;

  // Keyboard controls for active modal
  useEffect(() => {
    if (activeModalSlotIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModalSlotIndex(null);
      if (e.key === 'ArrowRight') {
        setActiveModalSlotIndex((prev) =>
          prev !== null ? (prev + 1) % packageSlots.length : null,
        );
      }
      if (e.key === 'ArrowLeft') {
        setActiveModalSlotIndex((prev) =>
          prev !== null ? (prev - 1 + packageSlots.length) % packageSlots.length : null,
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeModalSlotIndex, packageSlots.length]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 320;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (visiblePackages.length === 0) return null;

  return (
    <section id="dj-packages" className="bg-white border-b border-neutral-200 py-14 lg:py-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#FF5A1F]">DJ Event Packages</p>
            <h2 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#171717]">
              Sound &amp; lighting tiers
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenAdminPricing}
            className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 text-xs sm:text-sm font-medium text-[#171717] bg-[#F3F3F3] hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#FF5A1F]" />
            Edit Prices
          </button>
        </div>

        {/* 5 Package Cards */}
        <div className="mt-9 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {visiblePackages.map((pkg) => {
            const amount = getDjPackagePrice(pkg, currency);
            const isFeatured = Boolean(pkg.featured);
            const isSelected = pkg.id === activePackage?.id;

            return (
              <article
                key={pkg.id}
                data-testid={`dj-package-${pkg.id}`}
                onClick={() => setSelectedPackageId(pkg.id)}
                className={`group/card flex flex-col justify-between rounded-2xl p-5 transition-all duration-200 cursor-pointer text-left relative ${
                  isSelected
                    ? 'ring-2 ring-[#FF5A1F] shadow-lg -translate-y-1'
                    : 'hover:-translate-y-0.5'
                } ${
                  isFeatured
                    ? 'bg-[#171717] text-white border border-[#171717]'
                    : 'bg-[#F3F3F3]/60 text-[#171717] border border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-bold">{pkg.name}</h3>
                    <div className="flex items-center gap-1.5">
                      {isFeatured && (
                        <span className="text-[11px] font-semibold text-[#FF5A1F] whitespace-nowrap">
                          Popular
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FF5A1F] text-white whitespace-nowrap">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  <p
                    className={`mt-1 text-xs ${
                      isFeatured ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  >
                    {pkg.powerRating} · {pkg.durationLabel}
                  </p>

                  <div className="mt-4 pb-4 border-b border-current/10">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-3xl font-bold tracking-tight tabular-nums">
                        {formatPrice(amount, currency)}
                      </span>
                      <span
                        className={`text-xs ${
                          isFeatured ? 'text-neutral-400' : 'text-neutral-500'
                        }`}
                      >
                        {pkg.unitLabel}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2 text-xs leading-snug">
                    {pkg.features.slice(0, 5).map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#FF5A1F]" />
                        <span className={isFeatured ? 'text-neutral-200' : 'text-neutral-700'}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 space-y-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookPackage(pkg);
                    }}
                    className={`w-full py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      isFeatured
                        ? 'bg-[#FF5A1F] hover:bg-[#E04810] text-white'
                        : 'bg-[#171717] hover:bg-[#FF5A1F] text-white'
                    }`}
                  >
                    Book Package
                  </button>

                  <div className="text-center">
                    <span className="text-[11px] font-medium text-[#FF5A1F] opacity-90 group-hover/card:underline">
                      {isSelected ? '↓ Viewing 10 Reels Below' : 'Click to View 10 Reels'}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Selected Package Video Carousel (Portrait Mode - 10 Videos Limit) */}
        {activePackage && (
          <div className="mt-16 pt-8 border-t border-neutral-200">
            {/* Carousel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#171717]">
                    {activePackage.name}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FF5A1F]/10 text-[#FF5A1F]">
                    10 Showcase Videos
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {activePackage.powerRating} Concert Setup · {activePackage.durationLabel} Live
                  Performance · Click any portrait reel to play with audio
                </p>
              </div>

              {/* Carousel Controls */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => scrollCarousel('left')}
                  aria-label="Scroll left"
                  className="w-10 h-10 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 flex items-center justify-center text-neutral-700 transition-colors shadow-sm cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel('right')}
                  aria-label="Scroll right"
                  className="w-10 h-10 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 flex items-center justify-center text-neutral-700 transition-colors shadow-sm cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Horizontal Portrait Video Carousel */}
            <div
              ref={carouselRef}
              data-testid={`dj-package-carousel-${activePackage.id}`}
              className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scroll-smooth no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {packageSlots.map((slot, index) => {
                const isPublished = slot.status === 'published' && Boolean(slot.videoUrl);
                const isHovered = hoveredSlotId === slot.id;

                return (
                  <div
                    key={slot.id}
                    data-testid={`dj-slot-card-${slot.id}`}
                    onMouseEnter={() => setHoveredSlotId(slot.id)}
                    onMouseLeave={() => setHoveredSlotId(null)}
                    onClick={() => {
                      if (isPublished) {
                        setActiveModalSlotIndex(index);
                      } else if (onOpenAdminForSlot) {
                        onOpenAdminForSlot(slot.id);
                      }
                    }}
                    className={`group relative shrink-0 snap-start w-[72vw] sm:w-[42vw] md:w-[28vw] lg:w-[22%] max-w-[280px] aspect-[9/14] sm:aspect-[9/15] rounded-3xl overflow-hidden border transition-all duration-300 cursor-pointer ${
                      isPublished
                        ? 'bg-[#121212] border-neutral-300 hover:border-[#FF5A1F] hover:-translate-y-1.5 hover:shadow-xl'
                        : 'bg-[#d8d8d8] border-neutral-300 hover:border-neutral-400 hover:-translate-y-1'
                    }`}
                  >
                    {isPublished && slot.videoUrl ? (
                      <>
                        {/* Video Element for hover preview */}
                        <video
                          src={resolveMediaUrl(slot.videoUrl) || slot.videoUrl}
                          poster={
                            resolveMediaUrl(slot.posterUrl) || slot.posterUrl || undefined
                          }
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          ref={(el) => {
                            if (!el) return;
                            if (isHovered) {
                              void el.play().catch(() => {});
                            } else {
                              el.pause();
                            }
                          }}
                        />

                        {/* Top Badge: Archive Tag & Index */}
                        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 via-black/30 to-transparent p-3.5 flex items-center justify-between text-[11px] font-medium text-white/90">
                          <span className="truncate bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded font-mono">
                            {slot.archiveTag}
                          </span>
                          <span className="font-mono text-white/70">
                            {String(index + 1).padStart(2, '0')}/10
                          </span>
                        </div>

                        {/* Central Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110 group-hover:bg-[#FF5A1F]">
                            <Play className="w-6 h-6 fill-current ml-0.5" />
                          </div>
                        </div>

                        {/* Bottom Title & Details */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 text-white">
                          <p className="font-display text-sm font-bold line-clamp-1">
                            {slot.title}
                          </p>
                          <p className="text-[11px] text-neutral-300 flex items-center gap-1 mt-0.5">
                            <Volume2 className="w-3 h-3 text-[#FF5A1F]" />
                            {activePackage.name} Reel
                          </p>
                        </div>
                      </>
                    ) : (
                      /* Awaiting Video Card (Exact match to the portrait placeholder design) */
                      <div className="w-full h-full flex flex-col justify-between p-4 bg-gradient-to-b from-[#e3e3e3] to-[#cfcfcf]">
                        {/* Top Header */}
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-600">
                          <span className="font-semibold">{slot.archiveTag}</span>
                          <span>{String(index + 1).padStart(2, '0')}/10</span>
                        </div>

                        {/* Center Icon (Black Ring & Play Icon) */}
                        <div className="flex flex-col items-center justify-center my-auto">
                          <div className="w-14 h-14 rounded-full border-2 border-neutral-800 flex items-center justify-center text-neutral-800 transition-transform duration-200 group-hover:scale-110 shadow-sm bg-white/40">
                            <Play className="w-6 h-6 fill-neutral-800 ml-0.5" />
                          </div>
                        </div>

                        {/* Bottom Tag / Action */}
                        <div className="text-center pt-2">
                          <p className="text-xs font-semibold text-neutral-700 truncate">
                            {slot.title}
                          </p>
                          {onOpenAdminForSlot && (
                            <span className="mt-1 inline-block text-[11px] font-semibold text-[#FF5A1F] opacity-0 group-hover:opacity-100 transition-opacity">
                              + Upload Video
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Video Player Modal for DJ Package Slots */}
        {activeModalSlot && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setActiveModalSlotIndex(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-[#171717] rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10 text-white">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#FF5A1F] uppercase px-2 py-0.5 rounded bg-[#FF5A1F]/10">
                      {activePackage.name}
                    </span>
                    <span className="text-xs font-mono text-neutral-400">
                      {activeModalSlot.archiveTag}
                    </span>
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-bold mt-1">
                    {activeModalSlot.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModalSlotIndex(null)}
                  aria-label="Close video player"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player Body */}
              <div className="relative bg-black flex items-center justify-center min-h-[360px] max-h-[70vh]">
                {activeModalSlot.videoUrl ? (
                  <video
                    key={activeModalSlot.videoUrl}
                    src={resolveMediaUrl(activeModalSlot.videoUrl) || activeModalSlot.videoUrl}
                    poster={
                      resolveMediaUrl(activeModalSlot.posterUrl) ||
                      activeModalSlot.posterUrl ||
                      undefined
                    }
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    className="max-h-[70vh] w-auto max-w-full"
                  />
                ) : (
                  <div className="py-16 text-center text-white px-6">
                    <Film className="w-10 h-10 text-[#FF5A1F] mx-auto mb-3" />
                    <p className="font-display text-lg font-bold">Awaiting Video Footage</p>
                    <p className="text-sm text-neutral-400 mt-1">
                      No video is uploaded for this reel slot yet.
                    </p>
                    {onOpenAdminForSlot && (
                      <button
                        type="button"
                        onClick={() => {
                          const slotId = activeModalSlot.id;
                          setActiveModalSlotIndex(null);
                          onOpenAdminForSlot(slotId);
                        }}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#FF5A1F] hover:bg-[#E04810] text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Video to this Slot
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer with Carousel Navigation & Booking CTA */}
              <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-[#1F1F1F] border-t border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveModalSlotIndex((prev) =>
                        prev !== null ? (prev - 1 + packageSlots.length) % packageSlots.length : null,
                      )
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="text-xs font-mono text-neutral-400 px-1">
                    {activeModalSlotIndex !== null ? activeModalSlotIndex + 1 : 1} /{' '}
                    {packageSlots.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveModalSlotIndex((prev) =>
                        prev !== null ? (prev + 1) % packageSlots.length : null,
                      )
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveModalSlotIndex(null);
                    onBookPackage(activePackage);
                  }}
                  className="px-5 py-2 text-sm font-bold bg-[#FF5A1F] hover:bg-[#E04810] text-white rounded-lg transition-colors shadow-md cursor-pointer"
                >
                  Book {activePackage.name} Package
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
