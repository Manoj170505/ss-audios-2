import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Film, Play, Upload, X } from 'lucide-react';
import {
  formatBytes,
  getVisiblePortfolioCategories,
  type PortfolioCategory,
  type PortfolioSlot,
} from '../lib/domain';
import { resolveMediaUrl } from '../lib/api';

interface VideoPortfolioSectionProps {
  categories: PortfolioCategory[];
  onOpenAdminForSlot: (slotId: string) => void;
  onBookCategory: (categoryName: string) => void;
}

interface ActiveModalState {
  category: PortfolioCategory;
  slotIndex: number;
}

interface GalleryRowProps {
  category: PortfolioCategory;
  categoryIndex: number;
  onSelectSlot: (category: PortfolioCategory, slotIndex: number) => void;
}

function PortfolioVideoCard({
  slot,
  category,
  onClick,
}: {
  slot: PortfolioSlot;
  category: PortfolioCategory;
  onClick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hovering, setHovering] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const isPublished = slot.status === 'published' && Boolean(slot.videoUrl);

  const handleMouseEnter = () => {
    if (!isPublished) return;
    setHovering(true);
    const el = videoRef.current;
    if (el) {
      el.currentTime = 0;
      void el.play().catch(() => {
        // Autoplay policy fallback — poster remains visible
      });
    }
  };

  const handleMouseLeave = () => {
    setHovering(false);
    const el = videoRef.current;
    if (el) {
      el.pause();
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`Open ${slot.title} in ${category.name}`}
      className="group relative shrink-0 snap-start w-[74vw] sm:w-[44vw] md:w-[30vw] lg:w-[23.5%] max-w-[310px] aspect-[9/14] rounded-2xl overflow-hidden bg-[#1b1b1b] border border-neutral-200/80 text-left transition-transform duration-200 ease-out hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A1F] cursor-pointer"
    >
      {isPublished && slot.videoUrl ? (
        <>
          {/* Instant real-frame poster thumbnail so cards never appear black */}
          {slot.posterUrl && !posterError && (
            <img
              src={resolveMediaUrl(slot.posterUrl) || slot.posterUrl}
              alt={slot.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setPosterError(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${
                hovering ? 'opacity-0' : 'opacity-100'
              }`}
            />
          )}
          <video
            ref={videoRef}
            src={resolveMediaUrl(slot.videoUrl) || slot.videoUrl}
            poster={resolveMediaUrl(slot.posterUrl) || (slot.posterUrl && !posterError ? slot.posterUrl : undefined)}
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
        </>
      ) : (
        <img
          src={category.coverImage}
          alt={slot.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover brightness-[0.65] saturate-[0.75] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      )}

      {/* Subtle top index */}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 via-black/20 to-transparent px-3.5 pt-3 pb-6 flex items-center justify-between text-[11px] font-medium text-white/90">
        <span className="truncate">{slot.archiveTag}</span>
        <span className="font-mono tabular-nums text-white/75 shrink-0">
          #{String(slot.slotNumber).padStart(2, '0')}
        </span>
      </div>

      {/* Central Play Icon */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110 ${
            isPublished ? 'bg-[#FF5A1F] text-white' : 'bg-white/90 text-[#171717]'
          }`}
        >
          <Play
            className={`w-5 h-5 ml-0.5 ${isPublished ? 'fill-white' : 'fill-[#171717]'}`}
          />
        </div>
        {!isPublished && (
          <span className="mt-2 text-[11px] font-medium tracking-wide text-white/85">
            Awaiting footage
          </span>
        )}
      </div>

      {/* Minimal Bottom Title Scrim */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-4 pt-8 pb-3.5">
        <p className="text-sm font-semibold text-white truncate">{slot.title}</p>
        {slot.location && (
          <p className="text-[11px] text-neutral-300 truncate mt-0.5">{slot.location}</p>
        )}
      </div>
    </button>
  );
}

function PortfolioCategoryRail({ category, categoryIndex, onSelectSlot }: GalleryRowProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef({ active: false, startX: 0, startScrollLeft: 0, dragged: false });

  const scrollByCards = (direction: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    const distance = Math.max(el.clientWidth * 0.78, 280);
    el.scrollBy({ left: direction * distance, behavior: 'smooth' });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (!el || e.pointerType === 'touch') return;
    dragState.current = {
      active: true,
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      dragged: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (!el || !dragState.current.active) return;
    const delta = e.clientX - dragState.current.startX;
    if (Math.abs(delta) > 6) {
      dragState.current.dragged = true;
    }
    el.scrollLeft = dragState.current.startScrollLeft - delta;
  };

  const endDrag = () => {
    dragState.current.active = false;
  };

  const publishedInCat = category.slots.filter((s) => s.status === 'published' && s.videoUrl).length;

  return (
    <div className="py-7 border-t border-neutral-200 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-baseline gap-3 min-w-0">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-[#171717] truncate">
            {String(categoryIndex + 1).padStart(2, '0')}. {category.name}
          </h3>
          <span className="text-xs font-mono text-neutral-500 tabular-nums shrink-0">
            {publishedInCat > 0 ? `${publishedInCat} live · ` : ''}
            {category.slots.length} slots
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label={`Scroll ${category.name} videos left`}
            className="w-9 h-9 rounded-full border border-neutral-300 bg-white hover:border-[#171717] text-[#171717] flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label={`Scroll ${category.name} videos right`}
            className="w-9 h-9 rounded-full border border-neutral-300 bg-white hover:border-[#171717] text-[#171717] flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontally scrolling portrait video cards */}
      <div
        ref={railRef}
        data-testid={`portfolio-rail-${category.id}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="portfolio-rail flex gap-4 sm:gap-5 overflow-x-auto pb-2 snap-x snap-mandatory select-none cursor-grab active:cursor-grabbing"
      >
        {category.slots.map((slot, slotIdx) => (
          <PortfolioVideoCard
            key={slot.id}
            slot={slot}
            category={category}
            onClick={() => {
              if (dragState.current.dragged) {
                dragState.current.dragged = false;
                return;
              }
              onSelectSlot(category, slotIdx);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function VideoPortfolioSection({
  categories,
  onOpenAdminForSlot,
  onBookCategory,
}: VideoPortfolioSectionProps) {
  const [activeModal, setActiveModal] = useState<ActiveModalState | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);

  useEffect(() => {
    setVideoPlaybackError(false);
  }, [activeModal?.category.id, activeModal?.slotIndex]);

  useEffect(() => {
    if (!activeModal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
      if (e.key === 'ArrowRight') {
        setActiveModal((prev) =>
          prev
            ? {
                ...prev,
                slotIndex: (prev.slotIndex + 1) % prev.category.slots.length,
              }
            : null,
        );
      }
      if (e.key === 'ArrowLeft') {
        setActiveModal((prev) =>
          prev
            ? {
                ...prev,
                slotIndex:
                  (prev.slotIndex - 1 + prev.category.slots.length) % prev.category.slots.length,
              }
            : null,
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeModal]);

  const publicCategories = getVisiblePortfolioCategories(categories);

  useEffect(() => {
    if (categoryFilter !== 'all' && !publicCategories.some((c) => c.id === categoryFilter)) {
      setCategoryFilter('all');
    }
  }, [categoryFilter, publicCategories]);

  if (publicCategories.length === 0) {
    return null;
  }

  const totalSlots = publicCategories.reduce((sum, c) => sum + c.slots.length, 0);
  const publishedSlots = publicCategories.reduce(
    (sum, c) => sum + c.slots.filter((s) => s.status === 'published' && s.videoUrl).length,
    0,
  );

  const visibleCategories =
    categoryFilter === 'all'
      ? publicCategories
      : publicCategories.filter((cat) => cat.id === categoryFilter);

  const activeSlot: PortfolioSlot | null = activeModal
    ? activeModal.category.slots[activeModal.slotIndex] ?? null
    : null;

  return (
    <section id="portfolio" className="bg-[#F3F3F3] border-b border-neutral-200 py-14 lg:py-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#FF5A1F]">Video Portfolio</p>
            <h2 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#171717]">
              Live event showcase
            </h2>
          </div>

          <div className="text-sm text-neutral-600 shrink-0 tabular-nums">
            <span className="font-semibold text-[#FF5A1F]">{publishedSlots}</span> Live ·{' '}
            <span className="font-semibold text-[#171717]">{totalSlots}</span> Slots
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="mt-6 flex items-center gap-1.5 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-[#171717] text-white'
                : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400'
            }`}
          >
            All ({publicCategories.length})
          </button>
          {publicCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-[#FF5A1F] text-white'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Video Galleries */}
        <div className="mt-5">
          {visibleCategories.map((cat, idx) => (
            <PortfolioCategoryRail
              key={cat.id}
              category={cat}
              categoryIndex={
                publicCategories.findIndex((c) => c.id === cat.id) >= 0
                  ? publicCategories.findIndex((c) => c.id === cat.id)
                  : idx
              }
              onSelectSlot={(category, slotIndex) => setActiveModal({ category, slotIndex })}
            />
          ))}
        </div>
      </div>

      {/* Video Lightbox Modal */}
      {activeModal && activeSlot && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-modal-title"
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-[#171717] text-white rounded-2xl max-w-4xl w-full overflow-hidden border border-white/15 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-neutral-400 truncate">
                  {activeModal.category.name} · #{String(activeSlot.slotNumber).padStart(2, '0')}
                </p>
                <h3 id="video-modal-title" className="font-display text-lg font-semibold text-white truncate">
                  {activeSlot.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close video player"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black flex items-center justify-center min-h-[340px] max-h-[68vh]">
              {activeSlot.status === 'published' && activeSlot.videoUrl ? (
                videoPlaybackError ? (
                  <div className="p-8 text-center max-w-md">
                    <p className="font-display text-lg font-semibold text-white">
                      Optimizing video for browser playback
                    </p>
                    <p className="mt-2 text-sm text-neutral-300">
                      Refresh in a moment, or open the file directly.
                    </p>
                    <a
                      href={resolveMediaUrl(activeSlot.videoUrl) || activeSlot.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center px-4 py-2 text-sm font-semibold bg-[#FF5A1F] text-white rounded-lg"
                    >
                      Open Video File
                    </a>
                  </div>
                ) : (
                  <video
                    key={activeSlot.videoUrl}
                    src={resolveMediaUrl(activeSlot.videoUrl) || activeSlot.videoUrl}
                    poster={resolveMediaUrl(activeSlot.posterUrl) || activeSlot.posterUrl || undefined}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    onError={() => setVideoPlaybackError(true)}
                    className="max-h-[68vh] w-auto max-w-full"
                  />
                )
              ) : (
                <div className="relative w-full h-[340px] flex flex-col items-center justify-center text-center px-6">
                  <img
                    src={activeModal.category.coverImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover opacity-25"
                  />
                  <div className="relative z-10 max-w-sm">
                    <div className="w-12 h-12 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-3">
                      <Film className="w-5 h-5 text-[#FF5A1F]" />
                    </div>
                    <p className="font-display text-lg font-semibold text-white">Awaiting footage</p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const id = activeSlot.id;
                          setActiveModal(null);
                          onOpenAdminForSlot(id);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#FF5A1F] hover:bg-[#E04810] text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Video
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const name = activeModal.category.name;
                          setActiveModal(null);
                          onBookCategory(name);
                        }}
                        className="px-4 py-2.5 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Book Event
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-neutral-400 tabular-nums">
                {activeSlot.status === 'published'
                  ? formatBytes(activeSlot.fileSizeBytes)
                  : 'Awaiting footage'}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveModal((prev) =>
                      prev
                        ? {
                            ...prev,
                            slotIndex:
                              (prev.slotIndex - 1 + prev.category.slots.length) %
                              prev.category.slots.length,
                          }
                        : null,
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveModal((prev) =>
                      prev
                        ? {
                            ...prev,
                            slotIndex: (prev.slotIndex + 1) % prev.category.slots.length,
                          }
                        : null,
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
